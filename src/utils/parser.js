import Papa from 'papaparse'
import * as XLSX from 'xlsx'

// 解析百分比字符串为数字
export function parsePercent(value) {
  if (!value || value === 'None' || value === '亏损') return null
  if (typeof value === 'number') return value
  const str = String(value).trim().replace('%', '').replace('+', '')
  const num = parseFloat(str)
  return isNaN(num) ? null : num
}

// 解析金额字符串为数字(亿)
export function parseAmount(value) {
  if (!value || value === 'None') return null
  if (typeof value === 'number') return value
  const str = String(value).trim()
  if (str.includes('亿')) {
    return parseFloat(str.replace('亿', ''))
  } else if (str.includes('万')) {
    return parseFloat(str.replace('万', '')) / 10000
  }
  return parseFloat(str)
}

// 智能识别数据格式
export function detectDataFormat(text) {
  const lines = text.trim().split('\n')

  // 检查是否为Excel/CSV格式(包含制表符、逗号或中文逗号)
  if (lines.length > 1 && (lines[0].includes('\t') || lines[0].includes(',') || lines[0].includes('、'))) {
    return 'table'
  }

  // 检查是否为Markdown表格
  if (lines.some(line => line.includes('|') && line.includes('---'))) {
    return 'markdown'
  }

  // 检查是否为键值对格式
  if (lines.some(line => line.includes('：') || line.includes(':'))) {
    return 'keyvalue'
  }

  return 'unknown'
}

// 解析表格格式数据(CSV/TSV/中文顿号)
function parseTableData(text, date) {
  const lines = text.trim().split('\n')
  
  // 检测分隔符:制表符、逗号或中文顿号
  let separator = '\t'
  if (lines[0].includes('、')) {
    separator = '、'
  } else if (lines[0].includes(',')) {
    separator = ','
  }

  // 中文顿号需要手动分割,PapaParse不支持
  let data
  if (separator === '、') {
    data = lines.map(line => line.split('、').map(item => item.trim()))
  } else {
    // 使用PapaParse解析其他分隔符
    const result = Papa.parse(text, {
      separator: separator,
      skipEmptyLines: true,
      header: false
    })
    data = result.data
  }

  if (!data || data.length < 2) return null

  const headers = data[0].map(h => h.trim())
  const rows = data.slice(1)

  // 判断是基础行情数据还是技术指标数据
  const isQuoteData = headers.some(h =>
    ['代码', '现价', '涨幅%', '成交额'].some(keyword => h.includes(keyword))
  )

  const isIndicatorData = headers.some(h =>
    ['MA5', 'MA10', 'MA20', 'MACD', 'RSI', 'KDJ'].some(keyword => h.includes(keyword))
  )

  if (isQuoteData) {
    return parseQuoteTable(headers, rows, date)
  } else if (isIndicatorData) {
    return parseIndicatorTable(headers, rows, date)
  } else {
    console.warn('无法识别的表格数据类型')
    return null
  }
}

// 解析行情表格
function parseQuoteTable(headers, rows, date) {
  console.log('parseQuoteTable - headers:', headers)
  console.log('parseQuoteTable - rows count:', rows.length)

  const quotes = []
  const stocks = []

  // 创建字段映射(使用精确匹配)
  const fieldMap = {}
  headers.forEach((h, index) => {
    const header = h.trim()
    if (header === '代码') fieldMap.code = index
    else if (header === '名称') fieldMap.name = index
    else if (header === '现价') fieldMap.price = index
    else if (header === '涨幅%') fieldMap.change_percent = index
    else if (header === '涨跌') fieldMap.change_value = index
    else if (header === '换手%') fieldMap.turnover_rate = index
    else if (header === '开盘') fieldMap.open_price = index
    else if (header === '昨收') fieldMap.close_yesterday = index
    else if (header === '成交额(亿)') fieldMap.amount = index
    else if (header === '市盈(动)') fieldMap.pe_ratio = index
    else if (header === '主力净额(亿)') fieldMap.main_net_amount = index
    else if (header === '最低') fieldMap.low_price = index
    else if (header === '最高') fieldMap.high_price = index
    else if (header === '5日涨幅%') fieldMap.rise_5d = index
    else if (header === '10日涨幅%') fieldMap.rise_10d = index
    else if (header === '20日涨幅%') fieldMap.rise_20d = index
    else if (header === '总市值(亿)') fieldMap.total_market_cap = index
    else if (header === '流通市值(亿)') fieldMap.circulation_market_cap = index
    else if (header === '所属行业') fieldMap.industry = index
    // 兼容不精确匹配
    else if (header.includes('代码') && !fieldMap.code) fieldMap.code = index
    else if (header.includes('名称') && !fieldMap.name) fieldMap.name = index
    else if (header.includes('现价') && !fieldMap.price) fieldMap.price = index
    else if (header.includes('涨幅%') && !fieldMap.change_percent && !fieldMap.rise_5d && !fieldMap.rise_10d && !fieldMap.rise_20d) fieldMap.change_percent = index
  })

  console.log('parseQuoteTable - fieldMap:', fieldMap)

  rows.forEach(row => {
    const code = row[fieldMap.code]?.trim()
    const name = row[fieldMap.name]?.trim()
    const industry = row[fieldMap.industry]?.trim()

    if (!code || !name) return

    // 股票基础信息
    stocks.push({
      code,
      name,
      industry
    })

    // 行情数据(包含name字段用于合并)
    quotes.push({
      code,
      name, // 添加name字段
      date,
      price: parsePercent(row[fieldMap.price]),
      change_percent: parsePercent(row[fieldMap.change_percent]),
      change_value: parsePercent(row[fieldMap.change_value]),
      turnover_rate: parsePercent(row[fieldMap.turnover_rate]),
      open_price: parsePercent(row[fieldMap.open_price]),
      close_yesterday: parsePercent(row[fieldMap.close_yesterday]),
      amount: parseAmount(row[fieldMap.amount]),
      pe_ratio: parsePercent(row[fieldMap.pe_ratio]),
      main_net_amount: parseAmount(row[fieldMap.main_net_amount]),
      low_price: parsePercent(row[fieldMap.low_price]),
      high_price: parsePercent(row[fieldMap.high_price]),
      rise_5d: parsePercent(row[fieldMap.rise_5d]),
      rise_10d: parsePercent(row[fieldMap.rise_10d]),
      rise_20d: parsePercent(row[fieldMap.rise_20d]),
      total_market_cap: parseAmount(row[fieldMap.total_market_cap]),
      circulation_market_cap: parseAmount(row[fieldMap.circulation_market_cap])
    })
  })

  return { stocks, quotes }
}

// 解析技术指标表格
function parseIndicatorTable(headers, rows, date) {
  const indicators = []

  // 创建字段映射
  const fieldMap = {}
  headers.forEach((h, index) => {
    if (h.includes('名称') && !h.includes('MA')) fieldMap.name = index
    else if (h.includes('MA5')) fieldMap.ma5 = index
    else if (h.includes('MA10')) fieldMap.ma10 = index
    else if (h.includes('MA20')) fieldMap.ma20 = index
    else if (h.includes('MA30')) fieldMap.ma30 = index
    else if (h.includes('MACD') && !h.includes('DIFF') && !h.includes('DEA')) fieldMap.macd = index
    else if (h.includes('DIFF')) fieldMap.macd_diff = index
    else if (h.includes('DEA')) fieldMap.macd_dea = index
    else if (h.includes('RSI6')) fieldMap.rsi6 = index
    else if (h.includes('RSI12')) fieldMap.rsi12 = index
    else if (h.includes('RSI24')) fieldMap.rsi24 = index
    else if (h.includes('KDJ_K')) fieldMap.kdj_k = index
    else if (h.includes('KDJ_D')) fieldMap.kdj_d = index
    else if (h.includes('KDJ_J')) fieldMap.kdj_j = index
  })

  // 需要股票名称到代码的映射
  const nameToCode = {} // 这个需要从数据库查询

  rows.forEach(row => {
    const name = row[fieldMap.name]?.trim()
    if (!name) return

    // 这里需要通过名称查找代码,暂时跳过
    // 实际使用时需要从数据库查询股票代码
    indicators.push({
      code: '', // 需要通过名称查找代码
      date,
      ma5: parsePercent(row[fieldMap.ma5]),
      ma10: parsePercent(row[fieldMap.ma10]),
      ma20: parsePercent(row[fieldMap.ma20]),
      ma30: parsePercent(row[fieldMap.ma30]),
      macd: parsePercent(row[fieldMap.macd]),
      macd_diff: parsePercent(row[fieldMap.macd_diff]),
      macd_dea: parsePercent(row[fieldMap.macd_dea]),
      rsi6: parsePercent(row[fieldMap.rsi6]),
      rsi12: parsePercent(row[fieldMap.rsi12]),
      rsi24: parsePercent(row[fieldMap.rsi24]),
      kdj_k: parsePercent(row[fieldMap.kdj_k]),
      kdj_d: parsePercent(row[fieldMap.kdj_d]),
      kdj_j: parsePercent(row[fieldMap.kdj_j]),
      name // 临时保存名称
    })
  })

  return { indicators }
}

// 解析Markdown表格
function parseMarkdownTable(text, date) {
  const lines = text.trim().split('\n')
  const tableLines = lines.filter(line => line.includes('|'))

  if (tableLines.length < 3) return null

  // 提取表头
  const headers = tableLines[0].split('|').map(h => h.trim()).filter(h => h)
  const rows = tableLines.slice(2).map(line =>
    line.split('|').map(cell => cell.trim()).filter(cell => cell)
  )

  // 判断是行情数据还是技术指标数据
  const isIndicatorData = headers.some(h =>
    ['MA5', 'MA10', 'MA20', 'MACD', 'RSI', 'KDJ'].some(keyword => h.includes(keyword))
  )

  const isQuoteData = headers.some(h =>
    ['代码', '现价', '涨幅%', '成交额'].some(keyword => h.includes(keyword))
  )

  if (isIndicatorData) {
    return parseIndicatorTable(headers, rows, date)
  } else if (isQuoteData) {
    return parseQuoteTable(headers, rows, date)
  } else {
    console.warn('无法识别的Markdown表格数据类型')
    return null
  }
}

// 解析键值对格式
function parseKeyValueData(text, date) {
  const lines = text.trim().split('\n')
  const data = {}

  lines.forEach(line => {
    const parts = line.split(/[：:]/)
    if (parts.length === 2) {
      const key = parts[0].trim()
      const value = parts[1].trim()
      data[key] = value
    }
  })

  return data
}

// 解析Excel文件
function parseExcelFile(buffer, date) {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

  if (!data || data.length < 2) return null

  const headers = data[0]
  const rows = data.slice(1)

  return parseQuoteTable(headers, rows, date)
}

// 解析CSV文件
function parseCSVFile(content, date) {
  const result = Papa.parse(content, {
    skipEmptyLines: true,
    header: false
  })

  const data = result.data
  if (!data || data.length < 2) return null

  const headers = data[0].map(h => h.trim())
  const rows = data.slice(1)

  return parseQuoteTable(headers, rows, date)
}

// 主解析函数
export function parseStockData(text, date, fileType = 'text') {
  try {
    console.log('parseStockData - 输入文本长度:', text.length)
    console.log('parseStockData - 检测格式...')

    let result = {
      stocks: [],
      quotes: [],
      indicators: []
    }

    if (fileType === 'excel') {
      result = parseExcelFile(text, date)
    } else if (fileType === 'csv') {
      result = parseCSVFile(text, date)
    } else {
      // 检查是否包含混合数据(TSV表格 + Markdown表格)
      if (text.includes('\t') && text.includes('|') && text.includes('---')) {
        console.log('检测到混合数据格式')
        // 混合数据:分别解析两部分
        const parts = text.split(/需要我帮你把这份数据按主力净额为正或涨幅为正再筛选一次吗？/i)

        // 解析第一部分(TSV表格 - 行情数据)
        if (parts.length > 0 && parts[0].trim()) {
          console.log('解析第一部分(TSV表格)')
          const quoteResult = parseTableData(parts[0].trim(), date)
          console.log('第一部分解析结果:', quoteResult)
          if (quoteResult) {
            result.stocks = result.stocks.concat(quoteResult.stocks || [])
            result.quotes = result.quotes.concat(quoteResult.quotes || [])
          }
        }

        // 解析第二部分(Markdown表格 - 技术指标)
        if (parts.length > 1 && parts[1].trim()) {
          console.log('解析第二部分(Markdown表格)')
          const indicatorResult = parseMarkdownTable(parts[1].trim(), date)
          console.log('第二部分解析结果:', indicatorResult)
          if (indicatorResult && indicatorResult.indicators) {
            result.indicators = result.indicators.concat(indicatorResult.indicators)
          }
        }
      } else {
        // 单一格式数据
        const format = detectDataFormat(text)
        console.log('检测到格式:', format)

        switch (format) {
          case 'table':
            console.log('使用表格解析')
            result = parseTableData(text, date)
            console.log('表格解析结果:', result)
            break
          case 'markdown':
            console.log('使用Markdown解析')
            const mdResult = parseMarkdownTable(text, date)
            console.log('Markdown解析结果:', mdResult)
            result = {
              stocks: [],
              quotes: [],
              indicators: mdResult.indicators || []
            }
            break
          case 'keyvalue':
            console.log('使用键值对解析')
            result = parseKeyValueData(text, date)
            break
          default:
            console.warn('无法识别的数据格式')
            return null
        }
      }
    }

    console.log('parseStockData - 最终结果:', result)
    return result
  } catch (error) {
    console.error('数据解析错误:', error)
    throw error
  }
}

// 合并技术指标数据到行情数据
export function mergeIndicatorsWithQuotes(quotes, indicators) {
  // 创建名称到代码的映射
  const nameToCode = {}
  quotes.forEach(q => {
    nameToCode[q.name] = q.code
  })

  // 为指标数据添加代码
  indicators.forEach(ind => {
    if (ind.name && nameToCode[ind.name]) {
      ind.code = nameToCode[ind.name]
      delete ind.name
    }
  })

  return indicators.filter(ind => ind.code)
}
