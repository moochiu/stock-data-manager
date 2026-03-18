<template>
  <div class="sector-concept-query">
    <el-card class="query-card">
      <template #header>
        <div class="card-header">
          <span>行业概念数据查询</span>
        </div>
      </template>

      <el-form :model="queryForm" label-width="120px">
        <el-form-item label="数据类型">
          <el-radio-group v-model="queryForm.dataType" @change="handleDataTypeChange">
            <el-radio label="sector">行业板块</el-radio>
            <el-radio label="concept">概念板块</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="选择日期">
          <el-date-picker
            v-model="queryForm.selectedDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            @change="handleDateChange"
          />
        </el-form-item>

        <el-form-item :label="'选择' + (queryForm.dataType === 'sector' ? '行业' : '概念')">
          <el-select
            v-model="queryForm.selectedNames"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择"
            style="width: 100%"
            @change="handleSearch"
          >
            <el-option
              v-for="name in nameList"
              :key="name"
              :label="name"
              :value="name"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="Search">
            查询
          </el-button>
          <el-button @click="resetForm" :icon="RefreshLeft">重置</el-button>
        </el-form-item>
      </el-form>

      <el-divider />

      <div v-if="queryResults.length > 0" class="query-results">
        <div class="result-header">
          <span>查询结果: 共 {{ queryResults.length }} 条</span>
        </div>

        <el-table
          :data="queryResults"
          stripe
          style="width: 100%"
          height="400"
          :default-sort="{ prop: 'net_amount', order: 'descending' }"
        >
          <el-table-column prop="date" label="日期" width="120" fixed sortable />
          <el-table-column prop="name" :label="queryForm.dataType === 'sector' ? '行业名称' : '概念名称'" width="150" fixed sortable />
          <el-table-column prop="index_value" label="指数" width="100" align="right" sortable>
            <template #default="{ row }">
              {{ row.index_value ? row.index_value.toFixed(2) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="change_percent" label="涨跌幅" width="100" align="right" sortable>
            <template #default="{ row }">
              <span :style="{ color: row.change_percent >= 0 ? '#f56c6c' : '#67c23a' }">
                {{ row.change_percent ? (row.change_percent > 0 ? '+' : '') + row.change_percent.toFixed(2) + '%' : '-' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="inflow_amount" label="流入资金(亿)" width="120" align="right" sortable>
            <template #default="{ row }">
              {{ row.inflow_amount ? row.inflow_amount.toFixed(2) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="outflow_amount" label="流出资金(亿)" width="120" align="right" sortable>
            <template #default="{ row }">
              {{ row.outflow_amount ? row.outflow_amount.toFixed(2) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="net_amount" label="净额(亿)" width="120" align="right" sortable>
            <template #default="{ row }">
              <span :style="{ color: row.net_amount >= 0 ? '#f56c6c' : '#67c23a' }">
                {{ row.net_amount ? (row.net_amount > 0 ? '+' : '') + row.net_amount.toFixed(2) : '-' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="company_count" label="公司家数" width="100" align="center" sortable>
            <template #default="{ row }">
              {{ row.company_count || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="leading_stock" label="领涨股" width="120" />
          <el-table-column prop="leading_stock_change" label="领涨股涨跌幅" width="120" align="right" sortable>
            <template #default="{ row }">
              <span :style="{ color: row.leading_stock_change >= 0 ? '#f56c6c' : '#67c23a' }">
                {{ row.leading_stock_change ? (row.leading_stock_change > 0 ? '+' : '') + row.leading_stock_change.toFixed(2) + '%' : '-' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="leading_stock_price" label="领涨股价(元)" width="120" align="right" sortable>
            <template #default="{ row }">
              {{ row.leading_stock_price ? row.leading_stock_price.toFixed(2) : '-' }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-empty v-else description="暂无数据" />

      <el-divider />

      <div class="query-tips">
        <h4>使用说明</h4>
        <ul>
          <li>先选择数据类型: 行业板块 或 概念板块</li>
          <li>选择日期查看该日期的历史数据</li>
          <li>然后选择具体的行业名称 或 概念名称(支持多选)</li>
          <li>点击表头可以进行排序</li>
          <li>点击"查询"按钮显示结果</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, RefreshLeft } from '@element-plus/icons-vue'
import { getSectorList, getConceptList, getSectorData, getConceptData } from '../database'

const queryForm = reactive({
  dataType: 'sector',
  selectedDate: '',
  selectedNames: []
})

const nameList = ref([])
const queryResults = ref([])

// 加载名称列表
onMounted(async () => {
  // 设置默认日期为今天
  queryForm.selectedDate = new Date().toISOString().split('T')[0]
  await loadNameList()
})

// 数据类型变化
async function handleDataTypeChange() {
  queryForm.selectedNames = []
  queryResults.value = []
  await loadNameList()
}

// 日期变化
async function handleDateChange() {
  queryResults.value = []
  await loadNameList()
}

// 加载名称列表
async function loadNameList() {
  try {
    const startDate = queryForm.selectedDate || undefined
    const endDate = queryForm.selectedDate || undefined

    if (queryForm.dataType === 'sector') {
      const allData = await getSectorData('sectors', startDate, endDate)
      const names = new Set(allData.map(s => s.name))
      nameList.value = Array.from(names).sort()
    } else {
      const allData = await getConceptData(startDate, endDate)
      const names = new Set(allData.map(c => c.name))
      nameList.value = Array.from(names).sort()
    }
  } catch (error) {
    console.error('加载名称列表失败:', error)
  }
}

// 查询数据
async function handleSearch() {
  try {
    const filters = {}

    // 日期筛选
    if (queryForm.selectedDate) {
      filters.startDate = queryForm.selectedDate
      filters.endDate = queryForm.selectedDate
    }

    // 名称筛选
    if (queryForm.selectedNames.length > 0) {
      filters.names = queryForm.selectedNames
    }

    console.log('查询条件:', filters)

    let results
    if (queryForm.dataType === 'sector') {
      results = await getSectorData('sectors', queryForm.selectedDate, queryForm.selectedDate)
    } else {
      results = await getConceptData(queryForm.selectedDate, queryForm.selectedDate)
    }

    console.log('查询结果:', results.length, '条')
    queryResults.value = results

    if (results.length === 0) {
      ElMessage.info('没有找到符合条件的数据')
    } else {
      ElMessage.success(`查询成功,共找到 ${results.length} 条数据`)
    }
  } catch (error) {
    console.error('查询失败:', error)
    ElMessage.error('查询失败: ' + error.message)
  }
}

// 重置表单
function resetForm() {
  queryForm.dataType = 'sector'
  queryForm.selectedDate = new Date().toISOString().split('T')[0]
  queryForm.selectedNames = []
  queryResults.value = []
  loadNameList()
}
</script>

<style scoped>
.sector-concept-query {
  padding: 20px;
}

.query-card {
  max-width: 1400px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.query-results {
  margin-bottom: 20px;
}

.result-header {
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
  font-weight: bold;
}

.query-tips {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.query-tips h4 {
  margin-bottom: 10px;
  color: #409EFF;
}

.query-tips ul {
  padding-left: 20px;
  margin: 0;
}

.query-tips li {
  margin-bottom: 5px;
  color: #606266;
  font-size: 14px;
}
</style>
