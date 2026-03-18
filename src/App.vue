<template>
  <div id="app">
    <div class="header">
      <h2>数据管理系统</h2>
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
      <span>数据库: localStorage</span>
      <span style="margin-left: 20px;">总记录数: {{ totalRecords }}</span>
      <span style="margin-left: 20px;">版本: v1.0</span>
      <span style="margin-left: auto;">
        <button class="help-button" @click="showHelp = true">帮助</button>
        <button class="version-button" @click="showVersion = true">版本信息</button>
      </span>
    </div>

    <!-- 版本信息对话框 -->
    <el-dialog v-model="showVersion" title="版本信息" width="500px">
      <div class="version-info">
        <h3>股票数据管理系统</h3>
        <p><strong>版本:</strong> v1.1.0</p>
        <p><strong>设计人:</strong> CKN</p>
        <p><strong>开发日期:</strong> 2026-03-12</p>
        <p><strong>最后更新:</strong> 2026-03-17</p>
        <p><strong>技术栈:</strong></p>
        <ul>
          <li>Electron v15.0.0</li>
          <li>Vue 3.4.0</li>
          <li>Element Plus 2.5.0</li>
          <li>Vite v5.0.0</li>
          <li>sql.js + IndexedDB (数据存储)</li>
        </ul>
        <p><strong>功能特性:</strong></p>
        <ul>
          <li>✅ 支持股票数据导入(制表符/中文顿号/英文逗号)</li>
          <li>✅ 支持技术指标数据导入(Markdown表格/表格格式)</li>
          <li>✅ 支持行业板块数据导入(Excel/CSV)</li>
          <li>✅ 支持概念板块数据导入(Excel/CSV)</li>
          <li>✅ 数据持久化存储(sql.js + IndexedDB)</li>
          <li>✅ 多条件数据查询(支持表头排序)</li>
          <li>✅ 数据导出(Excel/CSV, 支持路径选择)</li>
          <li>✅ 智能文件名识别(自动提取日期)</li>
          <li>✅ 按日期数据管理(自动覆盖更新)</li>
          <li>✅ 数据删除功能(支持恢复确认)</li>
        </ul>
        <p><strong>v1.1.0 更新内容:</strong></p>
        <ul>
          <li>🔧 修复数据库字段映射问题</li>
          <li>🔧 修复SQL参数化查询兼容性问题</li>
          <li>🔧 修复技术指标数据解析和存储问题</li>
          <li>🔧 修复行业概念查询数据缺失问题</li>
          <li>🔧 添加文件导出路径选择功能</li>
          <li>🔧 支持更多数据格式(表格/Markdown)</li>
          <li>🔧 优化数据导入解析逻辑</li>
        </ul>
      </div>
    </el-dialog>

    <!-- 帮助信息对话框 -->
    <el-dialog v-model="showHelp" title="帮助文档" width="900px">
      <div class="help-content">
        <h3>数据格式说明</h3>

        <h4>1. 股票数据格式</h4>
        <p>支持以下3种分隔符:</p>

        <div class="format-example">
          <p><strong>中文顿号分隔 (推荐):</strong></p>
          <pre>代码、名称、现价、涨幅%、涨跌、换手%、开盘、昨收、成交额(亿)、市盈(动)、主力净额(亿)、最低、最高、5日涨幅%、10日涨幅%、20日涨幅%、总市值(亿)、流通市值(亿)、所属行业
300520、科大国创、43.80、+2.67%、1.14、7.21%、43.58、42.66、8.71、亏损、+0.84、42.85、43.91、7.62%、-1.53%、6.99%、127.91、127.77、软件开发</pre>
        </div>

        <div class="format-example">
          <p><strong>制表符分隔 (TSV):</strong></p>
          <pre>代码	名称	现价	涨幅%	...
300520	科大国创	43.80	+2.67%	...</pre>
        </div>

        <div class="format-example">
          <p><strong>英文逗号分隔 (CSV):</strong></p>
          <pre>代码,名称,现价,涨幅%,...
300520,科大国创,43.80,+2.67%,...</pre>
        </div>

        <p class="note">注意: 股票数据字段顺序可以不同,解析器会自动识别字段名</p>

        <h4>2. 技术指标数据格式</h4>
        <p>支持以下2种格式:</p>

        <div class="format-example">
          <p><strong>Markdown表格格式 (推荐):</strong></p>
          <pre>| 代码 | 日期 | MA5 | MA10 | MA20 | MACD | DIF | DEA | KDJ_K | KDJ_D | KDJ_J | RSI(6) | RSI(12) | RSI(24) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 002439 | 2026-03-11 | 13.82 | 14.15 | 14.25 | 0.15 | 0.12 | 0.10 | 75.2 | 70.5 | 84.6 | 68.3 | 62.1 | 58.9 |</pre>
        </div>

        <div class="format-example">
          <p><strong>表格格式 (制表符/逗号/顿号):</strong></p>
          <pre>股票名称	MA5	MA10	MA20	MA30	MACD	DIFF	DEA	RSI6	RSI12	RSI24	KDJ_K	KDJ_D	KDJ_J
启明星辰	13.82	14.15	14.25	14.46	0.133	-0.198	-0.132	46.44	44.21	45.16	20.39	21.60	17.99</pre>
        </div>

        <p class="note">注意: 技术指标数据必须包含"股票名称"字段用于与行情数据匹配</p>

        <h4>3. 行业概念数据格式</h4>
        <p>支持Excel和CSV格式,必须包含以下字段:</p>

        <div class="format-example">
          <p><strong>Excel/CSV字段:</strong></p>
          <pre>序号、行业、行业指数、涨跌幅、流入资金(亿)、流出资金(亿)、净额(亿)、公司家数、领涨股、涨跌幅.1、当前价(元)</pre>
        </div>

        <div class="format-example">
          <p><strong>文件命名规则:</strong></p>
          <pre>建议格式: 行业板块_2026-03-12.xlsx 或 概念板块_2026-03-12.csv
系统会自动从文件名中提取日期(格式: 2026-03-12 或 20260312)
也可手动选择日期覆盖自动识别的日期</pre>
        </div>

        <p class="note">注意: 行业和概念数据通过数据类型选择器区分,文件名可选包含日期</p>

        <h4>4. 使用说明</h4>
        <h5>股票数据导入:</h5>
        <ul>
          <li>分别在两个输入框中粘贴行情数据和技术指标数据</li>
          <li>点击"解析并导入"按钮</li>
          <li>系统会自动合并相同股票的数据</li>
          <li>输入框数据会自动保存,刷新页面后不会丢失</li>
          <li><strong>删除功能:</strong> 选择日期后点击"删除该日期数据"按钮,可删除该日期的所有股票数据(包括行情和技术指标)</li>
          <li><strong>删除确认:</strong> 删除操作需要二次确认,删除后数据无法恢复,请谨慎操作</li>
        </ul>

        <h5>股票数据查询:</h5>
        <ul>
          <li>支持按日期、股票代码、名称、行业进行查询</li>
          <li>点击"详情"按钮查看完整技术指标信息</li>
          <li>点击表头可以按该列排序(默认按成交额降序)</li>
        </ul>

        <h5>股票数据导出:</h5>
        <ul>
          <li>支持导出为Excel或CSV格式</li>
          <li>可选择日期范围和股票</li>
          <li>导出文件名规则: 单个股票使用"代码_名称",多个股票使用代码列表</li>
          <li>✅ 支持选择保存路径(打包后应用)</li>
        </ul>

        <h5>行业概念数据导入:</h5>
        <ul>
          <li>先选择数据类型(行业板块/概念板块)</li>
          <li>选择数据日期(默认自动从文件名提取,也可手动选择)</li>
          <li>上传Excel或CSV文件(支持同时上传多个文件)</li>
          <li>点击"导入数据"按钮</li>
          <li><strong>删除功能:</strong> 选择数据类型和日期后点击"删除该日期数据"按钮,可删除该日期的所有行业或概念数据</li>
          <li><strong>删除确认:</strong> 删除操作需要二次确认,删除后数据无法恢复,请谨慎操作</li>
        </ul>

        <h5>行业概念数据查询:</h5>
        <ul>
          <li>先选择数据类型(行业板块/概念板块)</li>
          <li>选择日期查看该日期的历史数据</li>
          <li>选择具体的行业名称或概念名称(支持多选)</li>
          <li>点击表头可以按该列排序(默认按净额降序)</li>
        </ul>

        <h5>行业概念数据导出:</h5>
        <ul>
          <li>先选择数据类型(行业板块/概念板块)</li>
          <li>选择日期范围</li>
          <li>选择导出方式:合并导出(一个文件)或分别导出(每个行业/概念一个文件)</li>
          <li>导出文件名规则: 单个行业/概念使用名称,多个使用名称列表</li>
          <li>✅ 支持选择保存路径(打包后应用)</li>
        </ul>

        <h4>5. 常见问题</h4>
        <ul>
          <li><strong>解析失败?</strong> 检查数据格式是否符合上述要求,特别是字段名称</li>
          <li><strong>数据丢失?</strong> 数据保存在localStorage中,清除浏览器缓存会删除数据</li>
          <li><strong>导出失败?</strong> 确保已安装xlsx和papaparse依赖</li>
          <li><strong>日期识别错误?</strong> 可以手动选择日期覆盖自动识别的日期</li>
          <li><strong>多文件导入?</strong> 行业概念数据支持同时上传多个文件,最多10个</li>
          <li><strong>如何删除数据?</strong> 在导入页面选择日期后,点击"删除该日期数据"按钮,确认后即可删除该日期的所有数据</li>
          <li><strong>删除的数据能恢复吗?</strong> 删除操作不可恢复,请谨慎操作,建议在删除前先导出备份</li>
          <li><strong>删除了错误的数据怎么办?</strong> 只能重新导入正确日期的数据,已删除的数据无法恢复</li>
          <li><strong>删除会删除哪些数据?</strong> 股票数据删除会删除该日期的行情和技术指标;行业概念删除会根据选择删除该日期的行业或概念数据</li>
          <li><strong>导出文件如何选择保存路径?</strong> 在开发模式下文件会下载到浏览器默认目录;打包后的应用会弹出文件保存对话框,可以选择任意路径</li>
          <li><strong>路径选择功能在开发模式下能用吗?</strong> 不能,路径选择只在打包后的Electron应用中可用,开发模式使用浏览器默认下载</li>
        </ul>

        <h4>6. 数据说明</h4>
        <ul>
          <li><strong>股票数据:</strong> 包含股票行情数据和技术指标数据</li>
          <li><strong>行业板块数据:</strong> 包含行业指数、涨跌幅、资金流向、领涨股等信息</li>
          <li><strong>概念板块数据:</strong> 包含概念指数、涨跌幅、资金流向、领涨股等信息</li>
          <li><strong>数据日期:</strong> 每个数据记录都包含日期字段,支持历史数据查询</li>
          <li><strong>数据覆盖:</strong> 相同日期和代码的数据会自动覆盖</li>
          <li><strong>数据删除:</strong> 支持按日期删除数据,删除操作不可恢复</li>
          <li><strong>数据存储:</strong> 使用sql.js + IndexedDB实现浏览器端数据库,支持大容量数据存储</li>
        </ul>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElDialog } from 'element-plus'
import DataImport from './components/DataImport.vue'
import DataQuery from './components/DataQuery.vue'
import DataExport from './components/DataExport.vue'
import SectorConceptImport from './components/SectorConceptImport.vue'
import SectorConceptQuery from './components/SectorConceptQuery.vue'
import SectorConceptExport from './components/SectorConceptExport.vue'
import { initDatabase, getRecordCount } from './database'

const activeTab = ref('stock-import')
const totalRecords = ref(0)
const showVersion = ref(false)
const showHelp = ref(false)

onMounted(async () => {
  console.log('完整版本App已挂载')
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

.help-button,
.version-button {
  padding: 5px 12px;
  margin-left: 10px;
  border: 1px solid #dcdfe6;
  background-color: white;
  color: #606266;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.help-button:hover,
.version-button:hover {
  color: #409EFF;
  border-color: #c6e2ff;
  background-color: #ecf5ff;
}

.version-info h3,
.help-content h3 {
  color: #303133;
  margin-bottom: 15px;
  border-bottom: 2px solid #409EFF;
  padding-bottom: 10px;
}

.version-info h4,
.help-content h4 {
  color: #606266;
  margin: 20px 0 10px 0;
}

.version-info p,
.help-content p {
  color: #606266;
  line-height: 1.6;
  margin: 8px 0;
}

.version-info ul,
.help-content ul {
  color: #606266;
  margin: 8px 0;
  padding-left: 20px;
}

.version-info li,
.help-content li {
  margin: 5px 0;
}

.format-example {
  background-color: #f5f7fa;
  border-left: 4px solid #409EFF;
  padding: 10px 15px;
  margin: 10px 0;
  border-radius: 4px;
}

.format-example p {
  margin: 0 0 8px 0;
  font-weight: bold;
  color: #409EFF;
}

.format-example pre {
  margin: 0;
  padding: 10px;
  background-color: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
}

.note {
  color: #E6A23C !important;
  font-style: italic;
  margin: 10px 0 !important;
}
</style>
