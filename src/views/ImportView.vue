<template>
  <div class="import-view">
    <el-card class="import-card">
      <template #header>
        <div class="card-header">
          <span>数据导入</span>
        </div>
      </template>

      <!-- 日期选择 -->
      <div class="form-section">
        <el-form-item label="选择日期">
          <el-date-picker
            v-model="selectedDate"
            type="date"
            placeholder="选择数据日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 200px"
          />
        </el-form-item>
      </div>

      <!-- 导入方式选择 -->
      <div class="form-section">
        <el-radio-group v-model="importMethod">
          <el-radio label="paste">粘贴文本</el-radio>
          <el-radio label="file">导入文件</el-radio>
        </el-radio-group>
      </div>

      <!-- 粘贴文本区域 -->
      <div v-if="importMethod === 'paste'" class="paste-section">
        <el-input
          v-model="pasteText"
          type="textarea"
          :rows="15"
          placeholder="请粘贴股票数据...&#10;支持以下格式：&#10;1. 表格文本（可直接从网页复制）&#10;2. CSV格式文本&#10;3. 包含股票代码、名称、价格等信息的文本&#10;&#10;示例：&#10;代码    名称    现价    涨幅%    换手%&#10;601038  一拖股份  14.70   +2.37%  1.26%"
          show-word-limit
        />
      </div>

      <!-- 文件导入区域 -->
      <div v-if="importMethod === 'file'" class="file-section">
        <el-upload
          ref="uploadRef"
          class="upload-demo"
          drag
          :auto-upload="false"
          :on-change="handleFileChange"
          :limit="1"
          accept=".xlsx,.xls,.csv"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            拖拽文件到此处或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 Excel (.xlsx, .xls) 和 CSV 文件
            </div>
          </template>
        </el-upload>
      </div>

      <!-- 操作按钮 -->
      <div class="button-section">
        <el-button type="primary" @click="handleImport" :loading="importing">
          解析并导入
        </el-button>
        <el-button @click="handleClear">清空</el-button>
      </div>

      <!-- 导入状态 -->
      <div v-if="importStatus.show" class="status-section">
        <el-alert
          :title="importStatus.title"
          :type="importStatus.type"
          :description="importStatus.description"
          :closable="false"
          show-icon
        />
      </div>

      <!-- 解析结果预览 -->
      <div v-if="parsedData.length > 0" class="preview-section">
        <div class="preview-header">
          <span>解析结果预览 (共 {{ parsedData.length }} 条记录)</span>
          <el-tag :type="dataType === 'quote' ? 'success' : 'warning'">
            {{ dataType === 'quote' ? '基础行情数据' : '技术指标数据' }}
          </el-tag>
        </div>
        <el-table
          :data="parsedData.slice(0, 10)"
          border
          stripe
          max-height="300"
          style="width: 100%"
        >
          <el-table-column
            v-for="column in previewColumns"
            :key="column.key"
            :prop="column.key"
            :label="column.label"
            :width="column.width"
            show-overflow-tooltip
          />
        </el-table>
        <div v-if="parsedData.length > 10" class="preview-more">
          还有 {{ parsedData.length - 10 }} 条记录未显示...
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import DataParser from '../utils/dataParser'
import {
  upsertStock,
  upsertDailyQuote,
  upsertTechnicalIndicator,
  deleteDataByDate
} from '../database/operations'

// 状态数据
const selectedDate = ref('')
const importMethod = ref('paste')
const pasteText = ref('')
const importing = ref(false)
const uploadRef = ref(null)
const selectedFile = ref(null)

const importStatus = reactive({
  show: false,
  title: '',
  type: 'info',
  description: ''
})

const parsedData = ref([])
const dataType = ref('')

// 预览表格列配置
const previewColumns = computed(() => {
  if (dataType.value === 'quote') {
    return [
      { key: 'code', label: '代码', width: '100' },
      { key: 'name', label: '名称', width: '120' },
      { key: 'price', label: '现价', width: '80' },
      { key: 'change_percent', label: '涨幅%', width: '80' },
      { key: 'turnover_rate', label: '换手率', width: '80' },
      { key: 'amount', label: '成交额', width: '100' }
    ]
  } else {
    return [
      { key: 'name', label: '名称', width: '120' },
      { key: 'ma5', label: 'MA5', width: '80' },
      { key: 'ma10', label: 'MA10', width: '80' },
      { key: 'ma20', label: 'MA20', width: '80' },
      { key: 'macd', label: 'MACD', width: '80' },
      { key: 'rsi6', label: 'RSI6', width: '80' }
    ]
  }
})

// 文件选择处理
const handleFileChange = (file) => {
  selectedFile.value = file.raw
}

// 清空操作
const handleClear = () => {
  pasteText.value = ''
  selectedFile.value = null
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
  parsedData.value = []
  importStatus.show = false
}

// 导入处理
const handleImport = async () => {
  // 验证日期
  if (!selectedDate.value) {
    ElMessage.warning('请选择数据日期')
    return
  }

  // 验证数据源
  if (importMethod.value === 'paste' && !pasteText.value.trim()) {
    ElMessage.warning('请粘贴数据文本')
    return
  }

  if (importMethod.value === 'file' && !selectedFile.value) {
    ElMessage.warning('请选择文件')
    return
  }

  importing.value = true
  importStatus.show = false

  try {
    let parseResult

    if (importMethod.value === 'paste') {
      // 解析粘贴文本
      const format = DataParser.detectFormat(pasteText.value)
      console.log('检测到数据格式:', format)

      if (format === 'table') {
        parseResult = DataParser.parseTableText(pasteText.value)
      } else if (format === 'csv') {
        parseResult = await DataParser.parseCSV(pasteText.value)
      } else {
        throw new Error('无法识别的数据格式')
      }
    } else {
      // 解析文件
      const fileBuffer = await readFileAsBuffer(selectedFile.value)
      parseResult = DataParser.parseExcel(fileBuffer)
    }

    if (parseResult.type === 'error') {
      throw new Error(parseResult.message || '数据解析失败')
    }

    if (!parseResult.data || parseResult.data.length === 0) {
      throw new Error('未找到有效数据')
    }

    // 清洗和转换数据
    const { stocks, quotes, indicators } = DataParser.cleanAndConvertData(parseResult, selectedDate.value)

    // 删除同日期的旧数据
    deleteDataByDate(selectedDate.value)

    // 保存数据到数据库
    let successCount = 0
    let errorCount = 0

    if (stocks && stocks.length > 0) {
      stocks.forEach(stock => {
        try {
          upsertStock(stock)
          successCount++
        } catch (error) {
          console.error('保存股票信息失败:', error)
          errorCount++
        }
      })
    }

    if (quotes && quotes.length > 0) {
      quotes.forEach(quote => {
        try {
          upsertDailyQuote(quote)
          successCount++
        } catch (error) {
          console.error('保存行情数据失败:', error)
          errorCount++
        }
      })
    }

    if (indicators && indicators.length > 0) {
      indicators.forEach(indicator => {
        try {
          upsertTechnicalIndicator(indicator)
          successCount++
        } catch (error) {
          console.error('保存技术指标失败:', error)
          errorCount++
        }
      })
    }

    // 显示导入结果
    dataType.value = parseResult.type
    parsedData.value = parseResult.data

    if (errorCount === 0) {
      importStatus.title = '导入成功'
      importStatus.type = 'success'
      importStatus.description = `成功导入 ${successCount} 条记录`
    } else {
      importStatus.title = '导入完成（部分失败）'
      importStatus.type = 'warning'
      importStatus.description = `成功 ${successCount} 条，失败 ${errorCount} 条`
    }
    importStatus.show = true

    ElMessage.success('数据导入完成')

  } catch (error) {
    console.error('导入失败:', error)
    importStatus.title = '导入失败'
    importStatus.type = 'error'
    importStatus.description = error.message || '未知错误'
    importStatus.show = true
    ElMessage.error('数据导入失败: ' + error.message)
  } finally {
    importing.value = false
  }
}

// 读取文件为Buffer
const readFileAsBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target.result)
    }
    reader.onerror = (e) => {
      reject(new Error('文件读取失败'))
    }
    reader.readAsArrayBuffer(file)
  })
}
</script>

<style scoped>
.import-view {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.import-card {
  height: 100%;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

.form-section {
  margin-bottom: 20px;
}

.paste-section {
  margin-bottom: 20px;
}

.file-section {
  margin-bottom: 20px;
}

.upload-demo {
  width: 100%;
}

.button-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.status-section {
  margin-bottom: 20px;
}

.preview-section {
  margin-top: 20px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: bold;
}

.preview-more {
  text-align: center;
  color: #909399;
  padding: 10px;
  font-size: 14px;
}
</style>
