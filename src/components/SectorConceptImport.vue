<template>
  <div class="sector-concept-import">
    <el-card class="import-card">
      <template #header>
        <div class="card-header">
          <span>行业概念数据导入</span>
        </div>
      </template>

      <el-form :model="importForm" label-width="120px">
        <el-form-item label="数据类型">
          <el-radio-group v-model="importForm.dataType">
            <el-radio label="sector">行业板块</el-radio>
            <el-radio label="concept">概念板块</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="数据日期">
          <el-date-picker
            v-model="importForm.importDate"
            type="date"
            placeholder="自动从文件名读取,也可手动选择"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
          <div class="form-tip">默认自动从文件名提取日期,也可手动选择</div>
        </el-form-item>

        <el-form-item label="选择文件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :limit="10"
            multiple
            accept=".xlsx,.xls,.csv"
            drag
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 Excel (.xlsx, .xls) 和 CSV 格式文件,可同时上传多个文件
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleImport" :loading="importing" :icon="Upload">
            {{ importing ? '导入中...' : '导入数据' }}
          </el-button>
          <el-button type="danger" @click="handleDelete" :loading="deleting" :icon="Delete">
            删除该日期数据
          </el-button>
          <el-button @click="resetForm" :icon="RefreshLeft">重置</el-button>
        </el-form-item>
      </el-form>

      <el-divider />

      <div v-if="importResult" class="import-result">
        <el-alert
          :title="importResult.success ? '导入成功' : '导入失败'"
          :type="importResult.success ? 'success' : 'error'"
          :description="importResult.message"
          show-icon
          :closable="false"
        />
        <div v-if="importResult.details" class="result-details">
          <h4>导入详情</h4>
          <p>成功导入: {{ importResult.details.successCount }} 条</p>
          <p>失败: {{ importResult.details.failCount }} 条</p>
          <p v-if="importResult.details.errors.length > 0">
            错误信息:
            <ul>
              <li v-for="(error, index) in importResult.details.errors" :key="index">
                {{ error }}
              </li>
            </ul>
          </p>
        </div>
      </div>

      <el-divider />

      <div class="import-tips">
        <h4>使用说明</h4>
        <ul>
          <li>选择数据类型: 行业板块 或 概念板块</li>
          <li>上传对应类型的Excel或CSV文件</li>
          <li>文件必须包含以下字段: 序号、行业、行业指数、涨跌幅、流入资金(亿)、流出资金(亿)、净额(亿)、公司家数、领涨股、涨跌幅.1、当前价(元)</li>
          <li>每个行业/概念名称作为独立存储单元</li>
          <li>相同日期的数据会自动覆盖</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, RefreshLeft, UploadFilled, Delete } from '@element-plus/icons-vue'
import { parseSectorConceptData } from '../utils/sectorParser'
import { batchInsertSectors, batchInsertConcepts, deleteDataByDate } from '../database'

const importing = ref(false)
const deleting = ref(false)
const uploadRef = ref(null)
const importResult = ref(null)

const importForm = reactive({
  dataType: 'sector',
  importDate: new Date().toISOString().split('T')[0],
  selectedFiles: []
})

// 文件选择变化
function handleFileChange(file, fileList) {
  importForm.selectedFiles = fileList.map(f => f.raw)
  importResult.value = null
}

// 移除文件
function handleFileRemove(file, fileList) {
  importForm.selectedFiles = fileList.map(f => f.raw)
  importResult.value = null
}

// 处理导入
async function handleImport() {
  if (!importForm.selectedFiles || importForm.selectedFiles.length === 0) {
    ElMessage.warning('请先选择文件')
    return
  }

  importing.value = true
  importResult.value = null

  try {
    console.log('开始解析文件:', importForm.selectedFiles.length, '个')
    console.log('数据类型:', importForm.dataType)

    let allData = []
    let successCount = 0
    let failCount = 0
    const errors = []

    // 解析所有文件
    for (const file of importForm.selectedFiles) {
      try {
        console.log('解析文件:', file.name)

        // 根据文件名自动识别数据类型
        let detectedType = importForm.dataType
        if (file.name.includes('行业')) {
          detectedType = 'sector'
          console.log('自动识别为行业板块数据')
        } else if (file.name.includes('概念')) {
          detectedType = 'concept'
          console.log('自动识别为概念板块数据')
        }

        const data = await parseSectorConceptData(file, detectedType, importForm.importDate)
        console.log('文件解析成功,数据条数:', data.length)

        if (data.length > 0) {
          allData = allData.concat(data)
          successCount += data.length
        }
      } catch (error) {
        console.error('文件解析失败:', file.name, error)
        failCount++
        errors.push(`${file.name}: ${error.message}`)
      }
    }

    console.log('所有文件解析完成,总数据条数:', allData.length)

    if (allData.length === 0) {
      ElMessage.warning('文件中没有有效数据')
      importResult.value = {
        success: false,
        message: '文件中没有有效数据',
        details: {
          successCount,
          failCount,
          errors
        }
      }
      return
    }

    // 插入数据库
    let result
    if (importForm.dataType === 'sector') {
      result = batchInsertSectors(allData)
    } else {
      result = batchInsertConcepts(allData)
    }

    console.log('数据库插入成功:', result.changes, '条')

    importResult.value = {
      success: true,
      message: `成功导入 ${result.changes} 条数据`,
      details: {
        successCount,
        failCount,
        errors
      }
    }

    ElMessage.success(`导入成功,共导入 ${result.changes} 条数据`)

  } catch (error) {
    console.error('导入失败:', error)
    importResult.value = {
      success: false,
      message: '导入失败: ' + error.message,
      details: {
        successCount: 0,
        failCount: importForm.selectedFiles.length,
        errors: [error.message]
      }
    }
    ElMessage.error('导入失败: ' + error.message)
  } finally {
    importing.value = false
  }
}

// 重置表单
function resetForm() {
  importForm.dataType = 'sector'
  importForm.selectedFiles = []
  importResult.value = null
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

// 处理删除
async function handleDelete() {
  if (!importForm.importDate) {
    ElMessage.warning('请选择日期')
    return
  }

  const dataType = importForm.dataType === 'sector' ? '行业板块' : '概念板块'

  try {
    await ElMessageBox.confirm(
      `确定要删除 ${importForm.importDate} 的所有${dataType}数据吗?此操作不可恢复!`,
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
    const result = await deleteDataByDate(importForm.importDate)

    const dataTypeKey = importForm.dataType === 'sector' ? 'sectors' : 'concepts'
    const deletedCount = result.deletedItems[dataTypeKey]

    const message = `
      成功删除 ${importForm.importDate} 的${dataType}数据: ${deletedCount} 条
    `

    ElMessage.success(message)
    importResult.value = {
      success: true,
      message: '数据删除成功',
      details: {
        successCount: deletedCount,
        failCount: 0,
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
.sector-concept-import {
  padding: 20px;
}

.import-card {
  max-width: 900px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.import-result {
  margin-top: 20px;
}

.result-details {
  margin-top: 15px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.result-details h4 {
  margin-bottom: 10px;
  color: #303133;
}

.result-details p {
  margin: 5px 0;
  color: #606266;
}

.result-details ul {
  margin: 5px 0;
  padding-left: 20px;
}

.result-details li {
  margin: 3px 0;
  color: #f56c6c;
}

.import-tips {
  margin-top: 20px;
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

.form-tip {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
}
</style>
