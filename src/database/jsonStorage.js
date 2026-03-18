let dataDir = null
let stocksData = {}
let quotesData = {}
let indicatorsData = {}
let sectorData = {}    // 行业板块数据
let conceptData = {}   // 概念板块数据

// 获取数据目录
function getDataDir() {
  if (!dataDir) {
    // 在浏览器环境中使用localStorage
    dataDir = 'stock-data-manager'
  }
  return dataDir
}

// 初始化数据库(加载JSON文件)
export async function initDatabase() {
  try {
    // 从localStorage加载数据
    const stocksStr = localStorage.getItem('stocks')
    if (stocksStr) {
      stocksData = JSON.parse(stocksStr)
    }

    const quotesStr = localStorage.getItem('quotes')
    if (quotesStr) {
      quotesData = JSON.parse(quotesStr)
    }

    const indicatorsStr = localStorage.getItem('indicators')
    if (indicatorsStr) {
      indicatorsData = JSON.parse(indicatorsStr)
    }

    const sectorStr = localStorage.getItem('sectors')
    if (sectorStr) {
      sectorData = JSON.parse(sectorStr)
    }

    const conceptStr = localStorage.getItem('concepts')
    if (conceptStr) {
      conceptData = JSON.parse(conceptStr)
    }

    console.log('JSON数据存储初始化成功')
    return true
  } catch (error) {
    console.error('JSON数据存储初始化失败:', error)
    throw error
  }
}

// 保存数据到localStorage
function saveData() {
  try {
    localStorage.setItem('stocks', JSON.stringify(stocksData))
    localStorage.setItem('quotes', JSON.stringify(quotesData))
    localStorage.setItem('indicators', JSON.stringify(indicatorsData))
    localStorage.setItem('sectors', JSON.stringify(sectorData))
    localStorage.setItem('concepts', JSON.stringify(conceptData))
  } catch (error) {
    console.error('保存数据失败:', error)
    throw error
  }
}

// 插入或更新股票基础信息
export function upsertStock(stockData) {
  stocksData[stockData.code] = {
    code: stockData.code,
    name: stockData.name,
    industry: stockData.industry
  }
  saveData()
  return { changes: 1 }
}

// 插入或更新每日行情数据
export function upsertDailyQuote(quoteData) {
  const key = `${quoteData.code}_${quoteData.date}`
  quotesData[key] = quoteData
  saveData()
  return { changes: 1 }
}

// 插入或更新技术指标数据
export function upsertTechnicalIndicator(indicatorData) {
  const key = `${indicatorData.code}_${indicatorData.date}`
  indicatorsData[key] = indicatorData
  saveData()
  return { changes: 1 }
}

// 批量插入股票数据
export function batchInsertStocks(stocks) {
  stocks.forEach(stock => {
    stocksData[stock.code] = stock
  })
  saveData()
  return { changes: stocks.length }
}

// 批量插入行情数据
export function batchInsertQuotes(quotes) {
  quotes.forEach(quote => {
    const key = `${quote.code}_${quote.date}`
    quotesData[key] = quote
  })
  saveData()
  return { changes: quotes.length }
}

// 批量插入技术指标数据
export function batchInsertIndicators(indicators) {
  indicators.forEach(indicator => {
    const key = `${indicator.code}_${indicator.date}`
    indicatorsData[key] = indicator
  })
  saveData()
  return { changes: indicators.length }
}

// 查询股票列表
export function getStockList() {
  return Object.values(stocksData)
}

// 查询每日行情数据
export function getDailyQuotes(filters = {}) {
  let results = Object.values(quotesData).map(q => ({
    ...q,
    name: stocksData[q.code]?.name || '',
    industry: stocksData[q.code]?.industry || ''
  }))

  // 按日期筛选
  if (filters.startDate) {
    results = results.filter(q => q.date >= filters.startDate)
  }

  if (filters.endDate) {
    results = results.filter(q => q.date <= filters.endDate)
  }

  // 按股票代码筛选
  if (filters.code) {
    results = results.filter(q => q.code.includes(filters.code))
  }

  // 按股票名称筛选
  if (filters.name) {
    results = results.filter(q => q.name.includes(filters.name))
  }

  // 按行业筛选
  if (filters.industry) {
    results = results.filter(q => q.industry === filters.industry)
  }

  // 按多个股票代码筛选
  if (filters.codes && filters.codes.length > 0) {
    results = results.filter(q => filters.codes.includes(q.code))
  }

  // 排序
  results.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date)
    }
    return a.code.localeCompare(b.code)
  })

  return results
}

// 查询技术指标数据
export function getTechnicalIndicators(code, date) {
  const key = `${code}_${date}`
  return indicatorsData[key] || null
}

// 获取所有日期
export function getAllDates() {
  const dates = new Set()
  Object.values(quotesData).forEach(q => dates.add(q.date))
  return Array.from(dates).sort((a, b) => b.localeCompare(a))
}

// 获取所有行业
export function getAllIndustries() {
  const industries = new Set()
  Object.values(stocksData).forEach(s => {
    if (s.industry) {
      industries.add(s.industry)
    }
  })
  return Array.from(industries).sort()
}

// 删除指定日期的数据
export function deleteDataByDate(date) {
  let count = 0
  const deletedItems = {
    quotes: 0,
    indicators: 0,
    stocks: [],
    sectors: 0,
    concepts: 0
  }

  // 删除行情数据
  Object.keys(quotesData).forEach(key => {
    if (key.endsWith(`_${date}`)) {
      deletedItems.stocks.push(key.split('_')[0])
      delete quotesData[key]
      deletedItems.quotes++
      count++
    }
  })

  // 删除技术指标数据
  Object.keys(indicatorsData).forEach(key => {
    if (key.endsWith(`_${date}`)) {
      delete indicatorsData[key]
      deletedItems.indicators++
      count++
    }
  })

  // 删除行业板块数据
  Object.keys(sectorData).forEach(key => {
    if (key.endsWith(`_${date}`)) {
      delete sectorData[key]
      deletedItems.sectors++
      count++
    }
  })

  // 删除概念板块数据
  Object.keys(conceptData).forEach(key => {
    if (key.endsWith(`_${date}`)) {
      delete conceptData[key]
      deletedItems.concepts++
      count++
    }
  })

  saveData()
  return { count, deletedItems }
}

// 关闭数据库连接
export function closeDatabase() {
  saveData()
  stocksData = {}
  quotesData = {}
  indicatorsData = {}
  sectorData = {}
  conceptData = {}
}

// ==================== 行业板块数据操作 ====================

// 批量插入行业板块数据
export function batchInsertSectors(sectors) {
  sectors.forEach(sector => {
    const key = `${sector.name}_${sector.date}`
    sectorData[key] = sector
  })
  saveData()
  return { changes: sectors.length }
}

// 查询行业板块列表
export function getSectorList() {
  const names = new Set()
  Object.values(sectorData).forEach(sector => {
    names.add(sector.name)
  })
  return Array.from(names).sort()
}

// 查询行业板块数据
export function getSectorData(filters = {}) {
  let results = Object.values(sectorData)

  // 按日期筛选
  if (filters.startDate) {
    results = results.filter(s => s.date >= filters.startDate)
  }

  if (filters.endDate) {
    results = results.filter(s => s.date <= filters.endDate)
  }

  // 按行业名称筛选
  if (filters.name) {
    results = results.filter(s => s.name === filters.name)
  }

  // 按多个行业名称筛选
  if (filters.names && filters.names.length > 0) {
    results = results.filter(s => filters.names.includes(s.name))
  }

  return results
}

// 删除指定日期的行业数据
export function deleteSectorDataByDate(date) {
  let count = 0
  Object.keys(sectorData).forEach(key => {
    if (key.endsWith(`_${date}`)) {
      delete sectorData[key]
      count++
    }
  })
  saveData()
  return count
}

// ==================== 概念板块数据操作 ====================

// 批量插入概念板块数据
export function batchInsertConcepts(concepts) {
  concepts.forEach(concept => {
    const key = `${concept.name}_${concept.date}`
    conceptData[key] = concept
  })
  saveData()
  return { changes: concepts.length }
}

// 查询概念板块列表
export function getConceptList() {
  const names = new Set()
  Object.values(conceptData).forEach(concept => {
    names.add(concept.name)
  })
  return Array.from(names).sort()
}

// 查询概念板块数据
export function getConceptData(filters = {}) {
  let results = Object.values(conceptData)

  // 按日期筛选
  if (filters.startDate) {
    results = results.filter(c => c.date >= filters.startDate)
  }

  if (filters.endDate) {
    results = results.filter(c => c.date <= filters.endDate)
  }

  // 按概念名称筛选
  if (filters.name) {
    results = results.filter(c => c.name === filters.name)
  }

  // 按多个概念名称筛选
  if (filters.names && filters.names.length > 0) {
    results = results.filter(c => filters.names.includes(c.name))
  }

  return results
}

// 删除指定日期的概念数据
export function deleteConceptDataByDate(date) {
  let count = 0
  Object.keys(conceptData).forEach(key => {
    if (key.endsWith(`_${date}`)) {
      delete conceptData[key]
      count++
    }
  })
  saveData()
  return count
}

// 更新记录总数统计
export function getRecordCount() {
  return {
    stocks: Object.keys(stocksData).length,
    quotes: Object.keys(quotesData).length,
    indicators: Object.keys(indicatorsData).length,
    sectors: Object.keys(sectorData).length,
    concepts: Object.keys(conceptData).length,
    total: Object.keys(stocksData).length +
           Object.keys(quotesData).length +
           Object.keys(indicatorsData).length +
           Object.keys(sectorData).length +
           Object.keys(conceptData).length
  }
}
