<template>
  <div class="data-import">
    <div class="import-container">
      <div class="import-section">
        <el-card class="import-card">
          <template #header>
            <div class="card-header">
              <span>行情数据</span>
            </div>
          </template>

          <el-input
            v-model="importForm.quoteData"
            type="textarea"
            :rows="15"
            placeholder="请粘贴行情数据...&#10;格式示例:&#10;代码	名称	现价	涨幅%	换手率	开盘	昨收	成交额(亿)	市盈(动)	主力净额(亿)	最低	最高	5日涨幅%	10日涨幅%	20日涨幅%	总市值(亿)	流通市值(亿)	所属行业&#10;601038	一拖股份	14.70	+2.37%	1.26%	14.30	14.36	1.35	42.34	-2.16	14.23	14.77	-1.14%	3.38%	1.24%	165.18	107.56	专用设备"
          />
        </el-card>
      </div>

      <div class="import-section">
        <el-card class="import-card">
          <template #header>
            <div class="card-header">
              <span>技术指标数据</span>
            </div>
          </template>

          <el-input
            v-model="importForm.indicatorData"
            type="textarea"
            :rows="15"
            placeholder="请粘贴技术指标数据...&#10;格式示例(Markdown表格):&#10;| 股票名称   | MA5    | MA10   | MA20   | MA30   | MACD   | DIFF   | DEA    | RSI6   | RSI12  | RSI24  | KDJ_K  | KDJ_D  | KDJ_J   |&#10;|------------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|---------|&#10;| 一拖股份   | 14.50  | 14.62  | 14.39  | 14.40  | 0.006  | 0.113  | 0.110  | 57.48  | 55.51  | 55.14  | 50.97  | 54.64  | 43.63   |"
          />
        </el-card>
      </div>
    </div>

    <div class="action-bar">
      <el-form :model="importForm" label-width="100px">
        <el-form-item label="选择日期">
          <el-date-picker
            v-model="importForm.date"
            type="date"
            placeholder="选择数据日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleImport" :loading="importing">
            {{ importing ? '导入中...' : '解析并导入' }}
          </el-button>
          <el-button type="danger" @click="handleDelete" :loading="deleting">
            删除该日期数据
          </el-button>
          <el-button @click="clearForm">清空</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div v-if="importResult" class="import-result">
      <h4>导入结果</h4>
      <el-alert
        :title="importResult.message"
        :type="importResult.success ? 'success' : 'error'"
        :closable="false"
        show-icon
      />
      <div v-if="importResult.details" style="margin-top: 10px;">
        <p>成功导入: {{ importResult.details.successCount }} 条记录</p>
        <p v-if="importResult.details.failedCount > 0">失败: {{ importResult.details.failedCount }} 条记录</p>
        <p v-if="importResult.details.errors.length > 0" style="color: #f56c6c;">
          错误信息: {{ importResult.details.errors.join(', ') }}
        </p>
      </div>
    </div>

    <div class="import-tips">
      <h4>使用说明</h4>
      <ul>
        <li>左侧输入框: 粘贴行情数据(制表符分隔的表格)</li>
        <li>右侧输入框: 粘贴技术指标数据(Markdown表格)</li>
        <li>两个输入框可以只填一个,也可以都填</li>
        <li>系统会自动识别数据格式并解析</li>
        <li>相同日期的数据会被覆盖更新</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { parseStockData, mergeIndicatorsWithQuotes } from '../utils/parser'
import {
  batchInsertStocks,
  batchInsertQuotes,
  batchInsertIndicators,
  deleteDataByDate,
  getStockList
} from '../database'

const importing = ref(false)
const deleting = ref(false)
const importResult = ref(null)

const importForm = reactive({
  date: new Date().toISOString().split('T')[0],
  quoteData: '',
  indicatorData: ''
})

// 页面加载时恢复上次输入的数据
onMounted(() => {
  const savedQuoteData = localStorage.getItem('lastQuoteData')
  const savedIndicatorData = localStorage.getItem('lastIndicatorData')
  const savedDate = localStorage.getItem('lastImportDate')

  if (savedDate) importForm.date = savedDate
  if (savedQuoteData) importForm.quoteData = savedQuoteData
  if (savedIndicatorData) importForm.indicatorData = savedIndicatorData
})

// 处理导入
async function handleImport() {
  if (!importForm.date) {
    ElMessage.warning('请选择日期')
    return
  }

  if (!importForm.quoteData.trim() && !importForm.indicatorData.trim()) {
    ElMessage.warning('请至少填写一种数据')
    return
  }

  importing.value = true
  importResult.value = null

  try {
    let allStocks = []
    let allQuotes = []
    let allIndicators = []

    // 解析行情数据
    if (importForm.quoteData.trim()) {
      console.log('开始解析行情数据...')
      const quoteResult = parseStockData(importForm.quoteData, importForm.date)
      console.log('行情数据解析结果:', quoteResult)
      if (quoteResult) {
        if (quoteResult.stocks) {
          console.log('股票数量:', quoteResult.stocks.length)
          allStocks = allStocks.concat(quoteResult.stocks)
        }
        if (quoteResult.quotes) {
          console.log('行情记录数量:', quoteResult.quotes.length)
          allQuotes = allQuotes.concat(quoteResult.quotes)
        }
        if (quoteResult.indicators) {
          console.log('技术指标数量:', quoteResult.indicators.length)
          allIndicators = allIndicators.concat(quoteResult.indicators)
        }
      }
    }

    // 解析技术指标数据
    if (importForm.indicatorData.trim()) {
      console.log('开始解析技术指标数据...')
      const indicatorResult = parseStockData(importForm.indicatorData, importForm.date)
      console.log('技术指标数据解析结果:', indicatorResult)
      if (indicatorResult && indicatorResult.indicators) {
        console.log('技术指标数量:', indicatorResult.indicators.length)
        allIndicators = allIndicators.concat(indicatorResult.indicators)
      }
    }

    console.log('总计 - 股票:', allStocks.length, '行情:', allQuotes.length, '指标:', allIndicators.length)

    // 删除同日期的旧数据
    await deleteDataByDate(importForm.date)

    let successCount = 0
    let failedCount = 0
    const errors = []

    // 插入股票基础信息
    if (allStocks.length > 0) {
      try {
        console.log('插入股票基础信息:', allStocks.length, '条')
        batchInsertStocks(allStocks)
        successCount += allStocks.length
        console.log('股票基础信息插入成功')
      } catch (error) {
        console.error('股票基础信息插入失败:', error)
        failedCount += allStocks.length
        errors.push('股票信息插入失败: ' + error.message)
      }
    }

    // 插入行情数据
    if (allQuotes.length > 0) {
      try {
        console.log('插入行情数据:', allQuotes.length, '条')
        batchInsertQuotes(allQuotes)
        successCount += allQuotes.length
        console.log('行情数据插入成功')
      } catch (error) {
        console.error('行情数据插入失败:', error)
        failedCount += allQuotes.length
        errors.push('行情数据插入失败: ' + error.message)
      }
    }

    // 处理技术指标数据
    if (allIndicators.length > 0) {
      try {
        console.log('处理技术指标数据:', allIndicators.length, '条')
        // 如果有行情数据,先合并股票代码
        if (allQuotes.length > 0) {
          console.log('合并股票代码...')
          const mergedIndicators = mergeIndicatorsWithQuotes(allQuotes, allIndicators)
          console.log('合并后有效指标:', mergedIndicators.length, '条')
          batchInsertIndicators(mergedIndicators)
          successCount += mergedIndicators.length
          console.log('技术指标插入成功')
        } else {
          // 如果没有行情数据,需要从数据库查询股票代码
          console.log('从数据库查询股票代码...')
          const stocks = getStockList()
          const nameToCode = {}
          stocks.forEach(s => nameToCode[s.name] = s.code)

          const validIndicators = allIndicators.filter(ind => {
            if (ind.name && nameToCode[ind.name]) {
              ind.code = nameToCode[ind.name]
              delete ind.name
              return true
            }
            return false
          })

          console.log('有效指标:', validIndicators.length, '条')
          batchInsertIndicators(validIndicators)
          successCount += validIndicators.length
          console.log('技术指标插入成功')
        }
      } catch (error) {
        console.error('技术指标插入失败:', error)
        failedCount += allIndicators.length
        errors.push('技术指标插入失败: ' + error.message)
      }
    }

    console.log('导入完成 - 成功:', successCount, '失败:', failedCount)

    // 保存输入的数据,以便下次恢复
    localStorage.setItem('lastImportDate', importForm.date)
    localStorage.setItem('lastQuoteData', importForm.quoteData)
    localStorage.setItem('lastIndicatorData', importForm.indicatorData)

    // 显示结果
    importResult.value = {
      success: failedCount === 0,
      message: failedCount === 0 ? '数据导入成功' : '数据导入部分失败',
      details: {
        successCount,
        failedCount,
        errors
      }
    }

    if (failedCount === 0) {
      ElMessage.success(`成功导入 ${successCount} 条记录`)
    } else {
      ElMessage.warning(`导入完成,成功 ${successCount} 条,失败 ${failedCount} 条`)
    }

  } catch (error) {
    importResult.value = {
      success: false,
      message: '导入失败: ' + error.message,
      details: null
    }
    ElMessage.error('导入失败: ' + error.message)
  } finally {
    importing.value = false
  }
}

// 清空表单
function clearForm() {
  importForm.quoteData = ''
  importForm.indicatorData = ''
  importResult.value = null
}

// 处理删除
async function handleDelete() {
  if (!importForm.date) {
    ElMessage.warning('请选择日期')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除 ${importForm.date} 的所有数据吗?此操作不可恢复!`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
  } catch {
    return
  }

  deleting.value = true

  try {
    const result = await deleteDataByDate(importForm.date)

    const message = `
      成功删除 ${importForm.date} 的数据:
      - 股票行情: ${result.deletedItems.quotes} 条
      - 技术指标: ${result.deletedItems.indicators} 条
      - 行业板块: ${result.deletedItems.sectors} 条
      - 概念板块: ${result.deletedItems.concepts} 条
      共计: ${result.count} 条记录
    `

    ElMessage.success(message)
    importResult.value = {
      success: true,
      message: '数据删除成功',
      details: {
        successCount: result.count,
        failedCount: 0,
        errors: []
      }
    }
  } catch (error) {
    ElMessage.error('删除失败: ' + error.message)
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.data-import {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.import-container {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.import-section {
  flex: 1;
}

.import-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.action-bar {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.import-result {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 4px;
}

.import-result h4 {
  margin-bottom: 10px;
  color: #409EFF;
}

.import-tips {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.import-tips h4 {
  margin-bottom: 10px;
  color: #409EFF;
}

.import-tips ul {
  padding-left: 20px;
  margin: 0;
}

.import-tips li {
  margin-bottom: 5px;
  color: #606266;
  font-size: 14px;
}
</style>
