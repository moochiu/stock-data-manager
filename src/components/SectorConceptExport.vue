<template>
  <div class="sector-concept-export">
    <el-card class="export-card">
      <template #header>
        <div class="card-header">
          <span>行业概念数据导出</span>
        </div>
      </template>

      <el-form :model="exportForm" label-width="120px">
        <el-form-item label="数据类型">
          <el-radio-group v-model="exportForm.dataType" @change="handleDataTypeChange">
            <el-radio label="sector">行业板块</el-radio>
            <el-radio label="concept">概念板块</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="选择方式">
          <el-radio-group v-model="exportForm.selectType">
            <el-radio label="all">全部{{ exportForm.dataType === 'sector' ? '行业' : '概念' }}</el-radio>
            <el-radio label="selected">指定{{ exportForm.dataType === 'sector' ? '行业' : '概念' }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="exportForm.selectType === 'selected'" :label="'选择' + (exportForm.dataType === 'sector' ? '行业' : '概念')">
          <el-select
            v-model="exportForm.selectedNames"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择"
            style="width: 100%"
          >
            <el-option
              v-for="name in nameList"
              :key="name"
              :label="name"
              :value="name"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="导出格式">
          <el-checkbox-group v-model="exportForm.exportFormats">
            <el-checkbox label="excel">Excel</el-checkbox>
            <el-checkbox label="csv">CSV</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="导出方式">
          <el-radio-group v-model="exportForm.exportType">
            <el-radio label="merge">合并导出(一个文件)</el-radio>
            <el-radio label="separate">分别导出(多个文件)</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleExport" :loading="exporting" :icon="Download">
            {{ exporting ? '导出中...' : '导出数据' }}
          </el-button>
          <el-button @click="resetForm" :icon="RefreshLeft">重置</el-button>
        </el-form-item>
      </el-form>

      <el-divider />

      <div class="export-tips">
        <h4>使用说明</h4>
        <ul>
          <li>选择数据类型: 行业板块 或 概念板块</li>
          <li>选择日期范围导出指定时间段的数据</li>
          <li>支持导出全部{{ exportForm.dataType === 'sector' ? '行业' : '概念' }} 或 指定{{ exportForm.dataType === 'sector' ? '行业' : '概念' }}的数据</li>
          <li>支持同时导出Excel和CSV格式</li>
          <li>可以选择合并导出(一个文件包含所有数据)或分别导出(每个{{ exportForm.dataType === 'sector' ? '行业' : '概念' }}一个文件)</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, RefreshLeft } from '@element-plus/icons-vue'
import { getSectorList, getConceptList, getSectorData, getConceptData } from '../database'
import { exportToExcel, exportToCSV, generateFileName } from '../utils/exporter'
import * as XLSX from 'xlsx'

const exporting = ref(false)
const nameList = ref([])
const dateRange = ref([])

const exportForm = reactive({
  dataType: 'sector',
  selectType: 'all',
  selectedNames: [],
  exportFormats: ['excel'],
  exportType: 'merge'
})

// 加载名称列表
onMounted(async () => {
  await loadNameList()
})

// 数据类型变化
async function handleDataTypeChange() {
  exportForm.selectType = 'all'
  exportForm.selectedNames = []
  await loadNameList()
}

// 加载名称列表
async function loadNameList() {
  try {
    if (exportForm.dataType === 'sector') {
      nameList.value = await getSectorList('sectors')
    } else {
      nameList.value = await getConceptList()
    }
  } catch (error) {
    console.error('加载名称列表失败:', error)
  }
}

// 处理导出
async function handleExport() {
  if (!dateRange.value || dateRange.value.length !== 2) {
    ElMessage.warning('请选择日期范围')
    return
  }

  if (exportForm.exportFormats.length === 0) {
    ElMessage.warning('请至少选择一种导出格式')
    return
  }

  if (exportForm.selectType === 'selected' && exportForm.selectedNames.length === 0) {
    ElMessage.warning('请选择至少一个' + (exportForm.dataType === 'sector' ? '行业' : '概念'))
    return
  }

  exporting.value = true

  try {
    console.log('开始导出数据...')
    console.log('数据类型:', exportForm.dataType)
    console.log('日期范围:', dateRange.value)
    console.log('选择方式:', exportForm.selectType)
    console.log('选择的名称:', exportForm.selectedNames)

    // 构建查询条件
    const filters = {
      startDate: dateRange.value[0],
      endDate: dateRange.value[1]
    }

    if (exportForm.selectType === 'selected' && exportForm.selectedNames.length > 0) {
      filters.names = exportForm.selectedNames
    }

    console.log('查询条件:', filters)

    // 查询数据
    let data
    if (exportForm.dataType === 'sector') {
      data = await getSectorData('sectors', filters.startDate, filters.endDate)
    } else {
      data = await getConceptData(filters.startDate, filters.endDate)
    }

    console.log('查询到数据:', data.length, '条')

    if (data.length === 0) {
      ElMessage.warning('没有找到符合条件的数据')
      return
    }

    // 格式化数据
    const formattedData = data.map(item => ({
      '日期': item.date,
      '名称': item.name,
      '指数': item.index_value ? item.index_value.toFixed(2) : '',
      '涨跌幅%': item.change_percent ? (item.change_percent > 0 ? '+' : '') + item.change_percent.toFixed(2) + '%' : '',
      '流入资金(亿)': item.inflow_amount ? item.inflow_amount.toFixed(2) : '',
      '流出资金(亿)': item.outflow_amount ? item.outflow_amount.toFixed(2) : '',
      '净额(亿)': item.net_amount ? (item.net_amount > 0 ? '+' : '') + item.net_amount.toFixed(2) : '',
      '公司家数': item.company_count || '',
      '领涨股': item.leading_stock || '',
      '领涨股涨跌幅%': item.leading_stock_change ? (item.leading_stock_change > 0 ? '+' : '') + item.leading_stock_change.toFixed(2) + '%' : '',
      '领涨股价(元)': item.leading_stock_price ? item.leading_stock_price.toFixed(2) : ''
    }))

    // 生成文件名
    const dateRangeStr = {
      start: dateRange.value[0],
      end: dateRange.value[1]
    }
    const prefix = exportForm.dataType === 'sector' ? '行业板块' : '概念板块'

    // 导出Excel
    if (exportForm.exportFormats.includes('excel')) {
      if (exportForm.exportType === 'merge') {
        // 合并导出
        let filePrefix = prefix
        if (exportForm.selectType === 'selected' && exportForm.selectedNames.length > 0) {
          if (exportForm.selectedNames.length === 1) {
            // 单个行业/概念
            filePrefix = exportForm.selectedNames[0]
          } else {
            // 多个行业/概念
            filePrefix = exportForm.selectedNames.join('_')
          }
        }
        const excelFileName = generateFileName(filePrefix, dateRangeStr) + '.xlsx'
        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.json_to_sheet(formattedData)
        XLSX.utils.book_append_sheet(workbook, worksheet, filePrefix)
        
        // 使用支持路径选择的导出函数
        await exportToExcel({ merged: formattedData }, excelFileName)
        ElMessage.success(`Excel文件导出成功`)
      } else {
        // 分别导出
        const names = exportForm.selectType === 'all' ? nameList.value : exportForm.selectedNames
        for (const name of names) {
          const nameData = formattedData.filter(d => d['名称'] === name)
          if (nameData.length > 0) {
            const excelFileName = `${name}_${dateRange.value[0]}_to_${dateRange.value[1]}.xlsx`
            const workbook = XLSX.utils.book_new()
            const worksheet = XLSX.utils.json_to_sheet(nameData)
            XLSX.utils.book_append_sheet(workbook, worksheet, name)
            
            // 使用支持路径选择的导出函数
            await exportToExcel({ merged: nameData }, excelFileName)
          }
        }
        ElMessage.success(`Excel文件导出成功`)
      }
    }

    // 导出CSV
    if (exportForm.exportFormats.includes('csv')) {
      if (exportForm.exportType === 'merge') {
        // 合并导出
        let filePrefix = prefix
        if (exportForm.selectType === 'selected' && exportForm.selectedNames.length > 0) {
          if (exportForm.selectedNames.length === 1) {
            // 单个行业/概念
            filePrefix = exportForm.selectedNames[0]
          } else {
            // 多个行业/概念
            filePrefix = exportForm.selectedNames.join('_')
          }
        }
        const csvFileName = generateFileName(filePrefix, dateRangeStr) + '.csv'
        
        // 使用支持路径选择的导出函数
        await exportToCSV({ merged: formattedData }, csvFileName)
        ElMessage.success(`CSV文件导出成功`)
      } else {
        // 分别导出
        const names = exportForm.selectType === 'all' ? nameList.value : exportForm.selectedNames
        for (const name of names) {
          const nameData = formattedData.filter(d => d['名称'] === name)
          if (nameData.length > 0) {
            const csvFileName = `${name}_${dateRange.value[0]}_to_${dateRange.value[1]}.csv`
            
            // 使用支持路径选择的导出函数
            await exportToCSV({ merged: nameData }, csvFileName)
          }
        }
        ElMessage.success(`CSV文件导出成功`)
      }
    }

  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败: ' + error.message)
  } finally {
    exporting.value = false
  }
}

// 重置表单
function resetForm() {
  exportForm.dataType = 'sector'
  exportForm.selectType = 'all'
  exportForm.selectedNames = []
  exportForm.exportFormats = ['excel']
  exportForm.exportType = 'merge'
  dateRange.value = []
  loadNameList()
}
</script>

<style scoped>
.sector-concept-export {
  padding: 20px;
}

.export-card {
  max-width: 900px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.export-tips {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.export-tips h4 {
  margin-bottom: 10px;
  color: #409EFF;
}

.export-tips ul {
  padding-left: 20px;
  margin: 0;
}

.export-tips li {
  margin-bottom: 5px;
  color: #606266;
  font-size: 14px;
}
</style>
