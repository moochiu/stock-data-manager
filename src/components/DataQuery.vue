<template>
  <div class="data-query">
    <el-card class="query-card">
      <template #header>
        <div class="card-header">
          <span>数据查询</span>
        </div>
      </template>

      <el-form :model="queryForm" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="12">
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
          </el-col>
          <el-col :span="12">
            <el-form-item label="股票代码">
              <el-input
                v-model="queryForm.code"
                placeholder="输入股票代码"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="股票名称">
              <el-input
                v-model="queryForm.name"
                placeholder="输入股票名称"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属行业">
              <el-select
                v-model="queryForm.industry"
                placeholder="选择行业"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="industry in industries"
                  :key="industry"
                  :label="industry"
                  :value="industry"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" @click="handleQuery" :icon="Search">查询</el-button>
          <el-button @click="resetQuery" :icon="RefreshLeft">重置</el-button>
        </el-form-item>
      </el-form>

      <el-divider />

      <div class="query-result">
        <div class="result-header">
          <span>查询结果: 共 {{ queryData.length }} 条记录</span>
        </div>

        <el-table
          :data="queryData"
          stripe
          style="width: 100%"
          height="400"
          @row-click="handleRowClick"
          :default-sort="{ prop: 'amount', order: 'descending' }"
        >
          <el-table-column prop="code" label="代码" width="80" fixed sortable />
          <el-table-column prop="name" label="名称" width="100" fixed sortable />
          <el-table-column prop="date" label="日期" width="100" sortable />
          <el-table-column prop="price" label="现价" width="80" align="right" sortable>
            <template #default="{ row }">
              {{ row.price ? row.price.toFixed(2) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="change_percent" label="涨幅%" width="80" align="right" sortable>
            <template #default="{ row }">
              <span :style="{ color: row.change_percent >= 0 ? '#f56c6c' : '#67c23a' }">
                {{ row.change_percent ? (row.change_percent > 0 ? '+' : '') + row.change_percent.toFixed(2) + '%' : '-' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="turnover_rate" label="换手率%" width="90" align="right" sortable>
            <template #default="{ row }">
              {{ row.turnover_rate ? row.turnover_rate.toFixed(2) + '%' : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="成交额(亿)" width="100" align="right" sortable>
            <template #default="{ row }">
              {{ row.amount ? row.amount.toFixed(2) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="industry" label="行业" width="120" sortable />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click.stop="showDetail(row)">
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
      title="股票详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="currentStock" class="stock-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="股票代码">{{ currentStock.code }}</el-descriptions-item>
          <el-descriptions-item label="股票名称">{{ currentStock.name }}</el-descriptions-item>
          <el-descriptions-item label="数据日期">{{ currentStock.date }}</el-descriptions-item>
          <el-descriptions-item label="所属行业">{{ currentStock.industry }}</el-descriptions-item>
          <el-descriptions-item label="现价">
            {{ currentStock.price ? currentStock.price.toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="昨收价">
            {{ currentStock.close_yesterday ? currentStock.close_yesterday.toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="开盘价">
            {{ currentStock.open_price ? currentStock.open_price.toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="最高价">
            {{ currentStock.high_price ? currentStock.high_price.toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="最低价">
            {{ currentStock.low_price ? currentStock.low_price.toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="涨跌">
            {{ currentStock.change_value ? currentStock.change_value.toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="涨跌幅">
            <span :style="{ color: currentStock.change_percent >= 0 ? '#f56c6c' : '#67c23a' }">
              {{ currentStock.change_percent ? (currentStock.change_percent > 0 ? '+' : '') + currentStock.change_percent.toFixed(2) + '%' : '-' }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="换手率">
            {{ currentStock.turnover_rate ? currentStock.turnover_rate.toFixed(2) + '%' : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="成交额(亿)">
            {{ currentStock.amount ? currentStock.amount.toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="市盈率(动态)">
            {{ currentStock.pe_ratio ? currentStock.pe_ratio.toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="主力净额(亿)">
            {{ currentStock.main_net_amount ? currentStock.main_net_amount.toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="总市值(亿)">
            {{ currentStock.total_market_cap ? currentStock.total_market_cap.toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="流通市值(亿)">
            {{ currentStock.circulation_market_cap ? currentStock.circulation_market_cap.toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="5日涨幅%">
            {{ currentStock.rise_5d ? currentStock.rise_5d.toFixed(2) + '%' : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="10日涨幅%">
            {{ currentStock.rise_10d ? currentStock.rise_10d.toFixed(2) + '%' : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="20日涨幅%">
            {{ currentStock.rise_20d ? currentStock.rise_20d.toFixed(2) + '%' : '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider />

        <h4>技术指标</h4>
        <el-descriptions v-if="currentIndicators" :column="3" border>
          <el-descriptions-item label="MA5">
            {{ currentIndicators.ma5 ? currentIndicators.ma5.toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="MA10">
            {{ currentIndicators.ma10 ? currentIndicators.ma10.toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="MA20">
            {{ currentIndicators.ma20 ? currentIndicators.ma20.toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="MA30">
            {{ currentIndicators.ma30 ? currentIndicators.ma30.toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="MACD">
            {{ currentIndicators.macd ? currentIndicators.macd.toFixed(4) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="DIFF">
            {{ currentIndicators.macd_diff ? currentIndicators.macd_diff.toFixed(4) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="DEA">
            {{ currentIndicators.macd_dea ? currentIndicators.macd_dea.toFixed(4) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="RSI6">
            {{ currentIndicators.rsi6 ? currentIndicators.rsi6.toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="RSI12">
            {{ currentIndicators.rsi12 ? currentIndicators.rsi12.toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="RSI24">
            {{ currentIndicators.rsi24 ? currentIndicators.rsi24.toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="KDJ_K">
            {{ currentIndicators.kdj_k ? currentIndicators.kdj_k.toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="KDJ_D">
            {{ currentIndicators.kdj_d ? currentIndicators.kdj_d.toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="KDJ_J">
            {{ currentIndicators.kdj_j ? currentIndicators.kdj_j.toFixed(2) : '-' }}
          </el-descriptions-item>
        </el-descriptions>
        <el-empty v-else description="暂无技术指标数据" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, RefreshLeft } from '@element-plus/icons-vue'
import { getDailyQuotes, getTechnicalIndicators, getStockList, getAllIndustries } from '../database'

const queryData = ref([])
const industries = ref([])
const dateRange = ref([])
const detailDialogVisible = ref(false)
const currentStock = ref(null)
const currentIndicators = ref(null)

const queryForm = reactive({
  code: '',
  name: '',
  industry: ''
})

// 加载行业列表
onMounted(async () => {
  try {
    industries.value = await getAllIndustries()
  } catch (error) {
    console.error('加载行业列表失败:', error)
  }
})

// 查询数据
async function handleQuery() {
  try {
    const filters = {}

    if (dateRange.value && dateRange.value.length === 2) {
      filters.startDate = dateRange.value[0]
      filters.endDate = dateRange.value[1]
    }

    if (queryForm.code) {
      filters.code = queryForm.code
    }

    if (queryForm.name) {
      filters.name = queryForm.name
    }

    if (queryForm.industry) {
      filters.industry = queryForm.industry
    }

    queryData.value = await getDailyQuotes(filters.startDate, filters.endDate, filters.code, filters.name, filters.industry)

    if (queryData.value.length === 0) {
      ElMessage.info('未找到符合条件的数据')
    } else {
      ElMessage.success(`查询到 ${queryData.value.length} 条记录`)
    }
  } catch (error) {
    ElMessage.error('查询失败: ' + error.message)
  }
}

// 重置查询
function resetQuery() {
  dateRange.value = []
  queryForm.code = ''
  queryForm.name = ''
  queryForm.industry = ''
  queryData.value = []
}

// 显示详情
async function showDetail(row) {
  currentStock.value = row
  detailDialogVisible.value = true

  try {
    // 查询该股票当天的技术指标
    const indicators = await getTechnicalIndicators(row.date, row.date, row.code)
    // 获取第一个元素或null
    currentIndicators.value = indicators && indicators.length > 0 ? indicators[0] : null
  } catch (error) {
    console.error('加载技术指标失败:', error)
    currentIndicators.value = null
  }
}

// 行点击事件
function handleRowClick(row) {
  showDetail(row)
}
</script>

<style scoped>
.data-query {
  padding: 20px;
}

.query-card {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.query-result {
  margin-top: 20px;
}

.result-header {
  margin-bottom: 10px;
  font-weight: bold;
  color: #409EFF;
}

.stock-detail h4 {
  margin: 20px 0 10px 0;
  color: #409EFF;
}
</style>
