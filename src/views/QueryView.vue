<template>
  <div class="query-view">
    <el-card class="query-card">
      <template #header>
        <div class="card-header">
          <span>数据查询</span>
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filter-section">
        <el-form :inline="true" :model="filters">
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

          <el-form-item label="股票代码">
            <el-input
              v-model="filters.code"
              placeholder="输入股票代码"
              clearable
              style="width: 150px"
            />
          </el-form-item>

          <el-form-item label="股票名称">
            <el-input
              v-model="filters.name"
              placeholder="输入股票名称"
              clearable
              style="width: 150px"
            />
          </el-form-item>

          <el-form-item label="所属行业">
            <el-select
              v-model="filters.industry"
              placeholder="选择行业"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="industry in industries"
                :key="industry"
                :label="industry"
                :value="industry"
              />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 查询结果 -->
      <div class="result-section">
        <div class="result-header">
          <span>查询结果 (共 {{ tableData.length }} 条记录)</span>
        </div>

        <el-table
          :data="tableData"
          border
          stripe
          max-height="480"
          style="width: 100%"
          @row-click="handleRowClick"
        >
          <el-table-column prop="code" label="代码" width="100" fixed />
          <el-table-column prop="name" label="名称" width="120" fixed />
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="price" label="现价" width="80" align="right">
            <template #default="{ row }">
              {{ formatNumber(row.price, 2) }}
            </template>
          </el-table-column>
          <el-table-column prop="change_percent" label="涨幅%" width="90" align="right">
            <template #default="{ row }">
              <span :class="getChangeClass(row.change_percent)">
                {{ formatNumber(row.change_percent, 2) }}%
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="change_value" label="涨跌" width="80" align="right">
            <template #default="{ row }">
              {{ formatNumber(row.change_value, 2) }}
            </template>
          </el-table-column>
          <el-table-column prop="turnover_rate" label="换手率" width="90" align="right">
            <template #default="{ row }">
              {{ formatNumber(row.turnover_rate, 2) }}%
            </template>
          </el-table-column>
          <el-table-column prop="open_price" label="开盘" width="80" align="right">
            <template #default="{ row }">
              {{ formatNumber(row.open_price, 2) }}
            </template>
          </el-table-column>
          <el-table-column prop="high_price" label="最高" width="80" align="right">
            <template #default="{ row }">
              {{ formatNumber(row.high_price, 2) }}
            </template>
          </el-table-column>
          <el-table-column prop="low_price" label="最低" width="80" align="right">
            <template #default="{ row }">
              {{ formatNumber(row.low_price, 2) }}
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="成交额" width="100" align="right">
            <template #default="{ row }">
              {{ formatAmount(row.amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="pe_ratio" label="市盈率" width="80" align="right">
            <template #default="{ row }">
              {{ formatNumber(row.pe_ratio, 2) }}
            </template>
          </el-table-column>
          <el-table-column prop="main_net_amount" label="主力净额" width="100" align="right">
            <template #default="{ row }">
              {{ formatAmount(row.main_net_amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="industry" label="行业" width="120" />
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click.stop="handleViewDetail(row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`${currentStock?.name} (${currentStock?.code}) - ${currentStock?.date}`"
      width="900px"
    >
      <div v-if="currentStock" class="detail-content">
        <!-- 基础行情 -->
        <div class="detail-section">
          <h3>基础行情</h3>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="现价">
              {{ formatNumber(currentStock.price, 2) }}
            </el-descriptions-item>
            <el-descriptions-item label="涨幅%">
              <span :class="getChangeClass(currentStock.change_percent)">
                {{ formatNumber(currentStock.change_percent, 2) }}%
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="涨跌">
              {{ formatNumber(currentStock.change_value, 2) }}
            </el-descriptions-item>
            <el-descriptions-item label="开盘">
              {{ formatNumber(currentStock.open_price, 2) }}
            </el-descriptions-item>
            <el-descriptions-item label="最高">
              {{ formatNumber(currentStock.high_price, 2) }}
            </el-descriptions-item>
            <el-descriptions-item label="最低">
              {{ formatNumber(currentStock.low_price, 2) }}
            </el-descriptions-item>
            <el-descriptions-item label="昨收">
              {{ formatNumber(currentStock.close_yesterday, 2) }}
            </el-descriptions-item>
            <el-descriptions-item label="换手率">
              {{ formatNumber(currentStock.turnover_rate, 2) }}%
            </el-descriptions-item>
            <el-descriptions-item label="成交额">
              {{ formatAmount(currentStock.amount) }}
            </el-descriptions-item>
            <el-descriptions-item label="市盈率">
              {{ formatNumber(currentStock.pe_ratio, 2) }}
            </el-descriptions-item>
            <el-descriptions-item label="主力净额">
              {{ formatAmount(currentStock.main_net_amount) }}
            </el-descriptions-item>
            <el-descriptions-item label="所属行业">
              {{ currentStock.industry }}
            </el-descriptions-item>
            <el-descriptions-item label="总市值">
              {{ formatAmount(currentStock.total_market_cap) }}
            </el-descriptions-item>
            <el-descriptions-item label="流通市值">
              {{ formatAmount(currentStock.circulation_market_cap) }}
            </el-descriptions-item>
            <el-descriptions-item label="5日涨幅">
              {{ formatNumber(currentStock.rise_5d, 2) }}%
            </el-descriptions-item>
            <el-descriptions-item label="10日涨幅">
              {{ formatNumber(currentStock.rise_10d, 2) }}%
            </el-descriptions-item>
            <el-descriptions-item label="20日涨幅">
              {{ formatNumber(currentStock.rise_20d, 2) }}%
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 技术指标 -->
        <div v-if="currentIndicator" class="detail-section">
          <h3>技术指标</h3>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="MA5">
              {{ formatNumber(currentIndicator.ma5, 2) }}
            </el-descriptions-item>
            <el-descriptions-item label="MA10">
              {{ formatNumber(currentIndicator.ma10, 2) }}
            </el-descriptions-item>
            <el-descriptions-item label="MA20">
              {{ formatNumber(currentIndicator.ma20, 2) }}
            </el-descriptions-item>
            <el-descriptions-item label="MA30">
              {{ formatNumber(currentIndicator.ma30, 2) }}
            </el-descriptions-item>
            <el-descriptions-item label="MACD">
              {{ formatNumber(currentIndicator.macd, 4) }}
            </el-descriptions-item>
            <el-descriptions-item label="DIFF">
              {{ formatNumber(currentIndicator.macd_diff, 4) }}
            </el-descriptions-item>
            <el-descriptions-item label="DEA">
              {{ formatNumber(currentIndicator.macd_dea, 4) }}
            </el-descriptions-item>
            <el-descriptions-item label="RSI6">
              {{ formatNumber(currentIndicator.rsi6, 2) }}
            </el-descriptions-item>
            <el-descriptions-item label="RSI12">
              {{ formatNumber(currentIndicator.rsi12, 2) }}
            </el-descriptions-item>
            <el-descriptions-item label="RSI24">
              {{ formatNumber(currentIndicator.rsi24, 2) }}
            </el-descriptions-item>
            <el-descriptions-item label="KDJ_K">
              {{ formatNumber(currentIndicator.kdj_k, 2) }}
            </el-descriptions-item>
            <el-descriptions-item label="KDJ_D">
              {{ formatNumber(currentIndicator.kdj_d, 2) }}
            </el-descriptions-item>
            <el-descriptions-item label="KDJ_J">
              {{ formatNumber(currentIndicator.kdj_j, 2) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <div v-else class="detail-section">
          <el-empty description="暂无技术指标数据" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getDailyQuotes, getTechnicalIndicators, getIndustries, getStockCompleteData } from '../database/operations'

// 状态数据
const dateRange = ref([])
const filters = reactive({
  code: '',
  name: '',
  industry: ''
})
const tableData = ref([])
const industries = ref([])
const detailDialogVisible = ref(false)
const currentStock = ref(null)
const currentIndicator = ref(null)

// 初始化
onMounted(() => {
  loadIndustries()
  handleQuery()
})

// 加载行业列表
const loadIndustries = () => {
  industries.value = getIndustries()
}

// 查询数据
const handleQuery = () => {
  const queryFilters = {}

  if (dateRange.value && dateRange.value.length === 2) {
    queryFilters.startDate = dateRange.value[0]
    queryFilters.endDate = dateRange.value[1]
  }

  if (filters.code) {
    queryFilters.code = filters.code
  }

  if (filters.name) {
    queryFilters.name = filters.name
  }

  if (filters.industry) {
    queryFilters.industry = filters.industry
  }

  try {
    tableData.value = getDailyQuotes(queryFilters)
  } catch (error) {
    console.error('查询失败:', error)
    ElMessage.error('查询失败: ' + error.message)
  }
}

// 重置筛选条件
const handleReset = () => {
  dateRange.value = []
  filters.code = ''
  filters.name = ''
  filters.industry = ''
  handleQuery()
}

// 查看详情
const handleViewDetail = (row) => {
  currentStock.value = row

  try {
    const completeData = getStockCompleteData(row.code, row.date)
    currentIndicator.value = completeData.indicator
    detailDialogVisible.value = true
  } catch (error) {
    console.error('获取详情失败:', error)
    ElMessage.error('获取详情失败: ' + error.message)
  }
}

// 行点击事件
const handleRowClick = (row) => {
  handleViewDetail(row)
}

// 格式化数字
const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return Number(value).toFixed(decimals)
}

// 格式化金额
const formatAmount = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  const num = Number(value)
  if (num >= 100000000) {
    return (num / 100000000).toFixed(2) + '亿'
  } else if (num >= 10000) {
    return (num / 10000).toFixed(2) + '万'
  } else {
    return num.toFixed(2)
  }
}

// 获取涨跌样式
const getChangeClass = (value) => {
  if (value === null || value === undefined) {
    return ''
  }
  const num = Number(value)
  if (num > 0) {
    return 'text-red'
  } else if (num < 0) {
    return 'text-green'
  }
  return ''
}
</script>

<style scoped>
.query-view {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.query-card {
  height: 100%;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

.filter-section {
  margin-bottom: 20px;
}

.result-section {
  height: calc(100% - 120px);
}

.result-header {
  margin-bottom: 10px;
  font-weight: bold;
}

.detail-content {
  max-height: 600px;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 30px;
}

.detail-section h3 {
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.text-red {
  color: #f56c6c;
}

.text-green {
  color: #67c23a;
}

:deep(.el-table__body tr:hover > td) {
  cursor: pointer;
}
</style>
