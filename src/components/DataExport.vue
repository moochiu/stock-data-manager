<template>
  <div class="data-export">
    <el-card class="export-card">
      <template #header>
        <div class="card-header">
          <span>数据导出</span>
        </div>
      </template>

      <el-form :model="exportForm" label-width="100px">
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

        <el-form-item label="股票选择">
          <el-radio-group v-model="exportForm.stockType">
            <el-radio label="all">全部股票</el-radio>
            <el-radio label="selected">指定股票</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="exportForm.stockType === 'selected'" label="选择股票">
          <el-select
            v-model="exportForm.selectedStocks"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择股票"
            style="width: 100%"
          >
            <el-option
              v-for="stock in stockList"
              :key="stock.code"
              :label="`${stock.code} - ${stock.name}`"
              :value="stock.code"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="导出格式">
          <el-checkbox-group v-model="exportForm.exportFormats">
            <el-checkbox label="excel">Excel</el-checkbox>
            <el-checkbox label="csv">CSV</el-checkbox>
          </el-checkbox-group>
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
          <li>可选择日期范围导出指定时间段的数据</li>
          <li>支持导出全部股票或指定股票的数据</li>
          <li>支持同时导出Excel和CSV格式</li>
          <li>导出文件包含行情数据和技术指标数据</li>
          <li>如需导出单个股票的详细数据,请使用"数据查询"功能</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, RefreshLeft } from '@element-plus/icons-vue'
import { getDailyQuotes, getTechnicalIndicators, getStockList } from '../database'
import { exportToExcel, exportToCSV, formatExportData, generateFileName } from '../utils/exporter'

const exporting = ref(false)
const stockList = ref([])
const dateRange = ref([])

const exportForm = reactive({
  stockType: 'all',
  selectedStocks: [],
  exportFormats: ['excel']
})

// 加载股票列表
onMounted(async () => {
  try {
    stockList.value = await getStockList()
  } catch (error) {
    console.error('加载股票列表失败:', error)
  }
})

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

  if (exportForm.stockType === 'selected' && exportForm.selectedStocks.length === 0) {
    ElMessage.warning('请选择至少一只股票')
    return
  }

  exporting.value = true

  try {
    console.log('开始导出数据...')
    console.log('日期范围:', dateRange.value)
    console.log('股票类型:', exportForm.stockType)
    console.log('选择的股票:', exportForm.selectedStocks)

    // 构建查询条件
    const filters = {
      startDate: dateRange.value[0],
      endDate: dateRange.value[1]
    }

    if (exportForm.stockType === 'selected' && exportForm.selectedStocks.length > 0) {
      filters.codes = exportForm.selectedStocks
    }

    console.log('查询条件:', filters)

    // 查询行情数据
    let quotes = await getDailyQuotes(filters.startDate, filters.endDate, null, null, filters.industry)
    console.log('查询到行情数据:', quotes.length, '条')

    // 如果是指定股票,需要进一步过滤
    if (exportForm.stockType === 'selected' && exportForm.selectedStocks.length > 0) {
      quotes = quotes.filter(q => exportForm.selectedStocks.includes(q.code))
      console.log('过滤后行情数据:', quotes.length, '条')
    }

    if (quotes.length === 0) {
      ElMessage.warning('没有找到符合条件的数据')
      return
    }

    // 查询技术指标数据
    const indicators = []
    for (const quote of quotes) {
      try {
        const indicator = await getTechnicalIndicators(quote.date, quote.date, quote.code)
        if (indicator && indicator.length > 0) {
          indicators.push(indicator[0])
        }
      } catch (error) {
        console.error(`查询技术指标失败: ${quote.code} ${quote.date}`, error)
      }
    }
    console.log('查询到技术指标数据:', indicators.length, '条')

    // 格式化导出数据
    const formattedData = formatExportData(quotes, indicators)
    console.log('格式化后的数据:', formattedData)

    // 生成文件名
    const dateRangeStr = {
      start: dateRange.value[0],
      end: dateRange.value[1]
    }

    // 生成文件名前缀
    let filePrefix = '股票数据'
    if (exportForm.stockType === 'selected' && exportForm.selectedStocks.length > 0) {
      if (exportForm.selectedStocks.length === 1) {
        // 单个股票,使用股票代码和名称
        const stock = quotes.find(q => q.code === exportForm.selectedStocks[0])
        filePrefix = `${stock.code}_${stock.name}`
      } else {
        // 多个股票,使用股票代码列表
        filePrefix = exportForm.selectedStocks.join('_')
      }
    }

    // 导出Excel
    if (exportForm.exportFormats.includes('excel')) {
      const excelFileName = generateFileName(filePrefix, dateRangeStr) + '.xlsx'

      // 浏览器环境直接下载
      await exportToExcel(formattedData, excelFileName)
      ElMessage.success(`Excel文件导出成功`)
    }

    // 导出CSV
    if (exportForm.exportFormats.includes('csv')) {
      const csvFileName = generateFileName(filePrefix, dateRangeStr) + '.csv'

      // 浏览器环境直接下载
      await exportToCSV(formattedData, csvFileName)
      ElMessage.success(`CSV文件导出成功`)
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
  dateRange.value = []
  exportForm.stockType = 'all'
  exportForm.selectedStocks = []
  exportForm.exportFormats = ['excel']
}
</script>

<style scoped>
.data-export {
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
