<template>
  <div id="app">
    <div class="header">
      <h2>数据管理系统 (浏览器测试版)</h2>
    </div>

    <div class="tabs">
      <button
        :class="['tab-button', { active: activeTab === 'stock-import' }]"
        @click="activeTab = 'stock-import'"
      >
        股票数据导入
      </button>
      <button
        :class="['tab-button', { active: activeTab === 'stock-query' }]"
        @click="activeTab = 'stock-query'"
      >
        股票数据查询
      </button>
      <button
        :class="['tab-button', { active: activeTab === 'stock-export' }]"
        @click="activeTab = 'stock-export'"
      >
        股票数据导出
      </button>
      <button
        :class="['tab-button', { active: activeTab === 'sector-import' }]"
        @click="activeTab = 'sector-import'"
      >
        行业概念数据导入
      </button>
      <button
        :class="['tab-button', { active: activeTab === 'sector-query' }]"
        @click="activeTab = 'sector-query'"
      >
        行业概念数据查询
      </button>
      <button
        :class="['tab-button', { active: activeTab === 'sector-export' }]"
        @click="activeTab = 'sector-export'"
      >
        行业概念数据导出
      </button>
    </div>

    <div class="content">
      <DataImport v-if="activeTab === 'stock-import'" />
      <DataQuery v-if="activeTab === 'stock-query'" />
      <DataExport v-if="activeTab === 'stock-export'" />
      <SectorConceptImport v-if="activeTab === 'sector-import'" />
      <SectorConceptQuery v-if="activeTab === 'sector-query'" />
      <SectorConceptExport v-if="activeTab === 'sector-export'" />
    </div>

    <div class="footer">
      <span>数据库: localStorage (浏览器测试版)</span>
      <span style="margin-left: 20px;">总记录数: {{ totalRecords }}</span>
      <span style="margin-left: 20px;">版本: v1.2.0 (测试)</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DataImport from './components/DataImport.vue'
import DataQuery from './components/DataQuery.vue'
import DataExport from './components/DataExport.vue'
import SectorConceptImport from './components/SectorConceptImport.vue'
import SectorConceptQuery from './components/SectorConceptQuery.vue'
import SectorConceptExport from './components/SectorConceptExport.vue'
import { initDatabase, getRecordCount } from './database-browser'

const activeTab = ref('stock-import')
const totalRecords = ref(0)

onMounted(async () => {
  console.log('浏览器版本App已挂载')
  try {
    console.log('开始初始化数据库...')
    await initDatabase()
    console.log('数据库初始化成功')

    const recordCount = await getRecordCount()
    totalRecords.value = recordCount.data?.total || 0
    console.log('记录统计:', recordCount)
    console.log('数据库初始化完成,记录数:', totalRecords.value)
  } catch (error) {
    console.error('数据库初始化失败:', error)
    console.error('错误详情:', error.message)
    console.error('错误堆栈:', error.stack)
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  height: 760px;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: #409EFF;
  color: white;
  padding: 0 20px;
  height: 50px;
  display: flex;
  align-items: center;
}

.header h2 {
  margin: 0;
  font-size: 18px;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #ddd;
  background-color: #f5f5f5;
}

.tab-button {
  padding: 12px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.tab-button:hover {
  background-color: #e8e8e8;
}

.tab-button.active {
  color: #409EFF;
  border-bottom-color: #409EFF;
  background-color: white;
  font-weight: bold;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.footer {
  background-color: #f5f5f5;
  padding: 10px 20px;
  font-size: 12px;
  color: #666;
  border-top: 1px solid #ddd;
  height: 40px;
  display: flex;
  align-items: center;
}
</style>
