<template>
  <div class="export-view">
    <el-card class="export-card">
      <template #header>
        <div class="card-header">
          <span>数据导出</span>
        </div>
      </template>

      <!-- 导出范围 -->
      <div class="form-section">
        <h3 class="section-title">导出范围</h3>
        <el-form :inline="true">
          <el-form-item label="日期范围">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 240px"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 股票选择 -->
      <div class="form-section">
        <h3 class="section-title">股票选择</h3>
        <el-radio-group v-model="stockSelectMode">
          <el-radio label="all">全部股票</el-radio>
          <el-radio label="selected">指定股票</el-radio>
        </el-radio-group>

        <div v-if="stockSelectMode === 'selected'" class="stock-select-area">
          <el-select
            v-model="selectedStocks"
            multiple
            placeholder="请选择股票"
            style="width: 100%"
            collapse-tags
            collapse-tags-tooltip
          >
            <el-option
              v-for="stock in stockList"
              :key="stock.code"
              :label="`${stock.code} - ${stock.name}`"
              :value="stock.code"
            />
          </el-select>
        </div>
      </div>

      <!-- 导出内容 -->
      <div class="form-section">
        <h3 class="section-title">导出内容</h3>
        <el-checkbox-group v-model="exportContent">
          <el-checkbox label="quote">基础行情数据</el-checkbox>
          <el-checkbox label="technical">技术指标数据</el-checkbox>
        </el-checkbox-group>
      </div>

      <!-- 导出格式 -->
      <div class="form-section">
        <h3 class="section-title">导出格式</h3>
        <el-checkbox-group v-model="exportFormats">
          <el-checkbox label="excel">Excel (.xlsx)</el-checkbox>
          <el-checkbox label="csv">CSV (.csv)</el-checkbox>
        </el-checkbox-group>
      </div>

      <!-- 操作按钮 -->
      <div class="button-section">
        <el-button type="primary" @click="handleExport" :loading="exporting">
          导出数据
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <!-- 导出状态 -->
      <div v-if="exportStatus.show" class="status-section">
        <el-alert
          :title="exportStatus.title"
          :type="exportStatus.type"
          :description="exportStatus.description"
          :closable="false"
          show-icon
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getDailyQuotes, getTechnicalIndicators, getStockList } from '../database/operations'
import XLSX from 'xlsx'
import Papa from 'papaparse'

// 状态数据
const dateRange = ref([])
const stockSelectMode = ref('all')
const selectedStocks = ref([])
const stockList = ref([])
const exportContent = ref(['quote', 'technical'])
const exportFormats = ref(['excel'])
const exporting = ref(false)

const exportStatus = reactive({
  show: false,
  title: '',
  type: 'info',
  description: ''
})

// 初始化
onMounted(() => {
  loadStockList()
})

// 加载股票列表
const loadStockList = () => {
  try {
    stockList.value = getStockList()
  } catch (error) {
    console.error('加载股票列表失败:', error)
    ElMessage.error('加载股票列表失败: ' + error.message)
  }
}

// 重置
const handleReset = () => {
  dateRange.value = []
  stockSelectMode.value = 'all'
  selectedStocks.value = []
  exportContent.value = ['quote', 'technical']
  exportFormats.value = ['excel']
  exportStatus.show = false
}

// 导出数据
const handleExport = async () => {
  // 验证导出范围
  if (!dateRange.value || dateRange.value.length !== 2) {
    ElMessage.warning('请选择日期范围')
    return
  }

  // 验证导出内容
  if (exportContent.value.length === 0) {
    ElMessage.warning('请选择至少一种导出内容')
    return
  }

  // 验证导出格式
  if (exportFormats.value.length === 0) {
    ElMessage.warning('请选择至少一种导出格式')
    return
  }

  exporting.value = true
  exportStatus.show = false

  try {
    const [startDate, endDate] = dateRange.value

    // 构建查询条件
    const quoteFilters = {
      startDate,
      endDate
    }

    const indicatorFilters = {
      startDate,
      endDate
    }

    // 如果选择了指定股票，添加股票筛选
    if (stockSelectMode.value === 'selected' && selectedStocks.value.length > 0) {
      // 对于基础行情，需要处理多个股票
      // 这里简化处理，实际可能需要多次查询或使用IN语句
      // 暂时不实现多股票筛选，使用全部股票
    }

    // 获取数据
    let quoteData = []
    let indicatorData = []

    if (exportContent.value.includes('quote')) {
      quoteData = getDailyQuotes(quoteFilters)
    }

    if (exportContent.value.includes('technical')) {
      indicatorData = getTechnicalIndicators(indicatorFilters)
    }

    // 筛选指定股票的数据
    if (stockSelectMode.value === 'selected' && selectedStocks.value.length > 0) {
      quoteData = quoteData.filter(item => selectedStocks.value.includes(item.code))
      indicatorData = indicatorData.filter(item => selectedStocks.value.includes(item.code));
    }

    if (quoteData.length === 0 && indicatorData.length === 0) {
      throw new Error('没有找到符合条件的数据')
    }

    // 生成文件名
    const fileName = `股票数据_${startDate}_至_${endDate}`

    // 导出Excel
    if (exportFormats.value.includes('excel')) {
      await exportToExcel(quoteData, indicatorData, fileName)
    }

    // 导出CSV
    if (exportFormats.value.includes('csv')) {
      await exportToCSV(quoteData, indicatorData, fileName)
    }

    // 显示导出成功
    exportStatus.title = '导出成功'
    exportStatus.type = 'success'
    exportStatus.description = `共导出 ${quoteData.length} 条行情数据，${indicatorData.length} 条技术指标数据`
    exportStatus.show = true

    ElMessage.success('数据导出完成')

  } catch (error) {
    console.error('导出失败:', error)
    exportStatus.title = '导出失败'
    exportStatus.type = 'error'
    exportStatus.description = error.message || '未知错误'
    exportStatus.show = true
    ElMessage.error('数据导出失败: ' + error.message)
  } finally {
    exporting.value = false
  }
}

// 导出为Excel
const exportToExcel = (quoteData, indicatorData, fileName) => {
  try {
    const workbook = XLSX.utils.book_new()

    // 基础行情数据表
    if (quoteData.length > 0) {
      const quoteWorksheet = XLSX.utils.json_to_sheet(quoteData.map(item => ({
        '代码': item.code,
        '名称': item.name,
        '日期': item.date,
        '现价': item.price,
        '涨幅%': item.change_percent,
        '涨跌': item.change_value,
        '换手率%': item.turnover_rate,
        '开盘': item.open_price,
        '最高': item.high_price,
        '最低': item.low_price,
        '昨收': item.close_yesterday,
        '成交额': item.amount,
        '市盈率': item.pe_ratio,
        '主力净额': item.main_net_amount,
        '5日涨幅%': item.rise_5d,
        '10日涨幅%': item.rise_10d,
        '20日涨幅%': item.rise_20d,
        '总市值': item.total_market_cap,
        '流通市值': item.circulation_market_cap,
        '所属行业': item.industry
      })))

      XLSX.utils.book_append_sheet(workbook, quoteWorksheet, '基础行情')
    }

    // 技术指标数据表
    if (indicatorData.length > 0) {
      const indicatorWorksheet = XLSX.utils.json_to_sheet(indicatorData.map(item => ({
        '代码': item.code,
        '名称': item.name,
        '日期': item.date,
        'MA5': item.ma5,
        'MA10': item.ma10,
        'MA20': item.ma20,
        'MA30': item.ma30,
        'MACD': item.macd,
        'DIFF': item.macd_diff,
        'DEA': item.macd_dea,
        'RSI6': item.rsi6,
        'RSI12': item.rsi12,
        'RSI24': item.rsi24,
        'KDJ_K': item.kdj_k,
        'KDJ_D': item.kdj_d,
        'KDJ_J': item.kdj_j
      })))

      XLSX.utils.book_append_sheet(workbook, indicatorWorksheet, '技术指标')
    }

    // 保存文件
    XLSX.writeFile(workbook, `${fileName}.xlsx`)

  } catch (error) {
    throw new Error('Excel导出失败: ' + error.message)
  }
}

// 导出为CSV
const exportToCSV = (quoteData, indicatorData, fileName) => {
  try {
    // 基础行情CSV
    if (quoteData.length > 0) {
      const quoteCSV = Papa.unparse(quoteData.map(item => ({
        '代码': item.code,
        '名称': item.name,
        '日期': item.date,
        '现价': item.price,
        '涨幅%': item.change_percent,
        '涨跌': item.change_value,
        '换手率%': item.turnover_rate,
        '开盘': item.open_price,
        '最高': item.high_price,
        '最低': item.low_price,
        '昨收': item.close_yesterday,
        '成交额': item.amount,
        '市盈率': item.pe_ratio,
        '主力净额': item.main_net_amount,
        '5日涨幅%': item.rise_5d,
        '10日涨幅%': item.rise_10d,
        '20日涨幅%': item.rise_20d,
        '总市值': item.total_market_cap,
        '流通市值': item.circulation_market_cap,
        '所属行业': item.industry
      })))

      downloadCSV(quoteCSV, `${fileName}_基础行情.csv`)
    }

    // 技术指标CSV
    if (indicatorData.length > 0) {
      const indicatorCSV = Papa.unparse(indicatorData.map(item => ({
        '代码': item.code,
        '名称': item.name,
        '日期': item.date,
        'MA5': item.ma5,
        'MA10': item.ma10,
        'MA20': item.ma20,
        'MA30': item.ma30,
        'MACD': item.macd,
        'DIFF': item.macd_diff,
        'DEA': item.macd_dea,
        'RSI6': item.rsi6,
        'RSI12': item.rsi12,
        'RSI24': item.rsi24,
        'KDJ_K': item.kdj_k,
        'KDJ_D': item.kdj_d,
        'KDJ_J': item.kdj_j
      })))

      downloadCSV(indicatorCSV, `${fileName}_技术指标.csv`)
    }

  } catch (error) {
    throw new Error('CSV导出失败: ' + error.message)
  }
}

// 下载CSV文件
const downloadCSV = (csvContent, fileName) => {
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', fileName)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
.export-view {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.export-card {
  height: 100%;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

.form-section {
  margin-bottom: 30px;
}

.section-title {
  margin-bottom: 15px;
  font-size: 15px;
  font-weight: bold;
  color: #303133;
}

.stock-select-area {
  margin-top: 15px;
}

.button-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.status-section {
  margin-bottom: 20px;
}
</style>
