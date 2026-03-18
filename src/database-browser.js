// 浏览器版本数据库 - 使用LocalStorage模拟
// 用于测试功能，数据保存在浏览器本地

const DB_KEY = 'stock_data_manager_db'

// 数据结构
const db = {
  stocks: [],
  quotes: [],
  indicators: [],
  sectors: [],
  concepts: []
}

// 加载数据
function loadDB() {
  try {
    const data = localStorage.getItem(DB_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      db.stocks = parsed.stocks || []
      db.quotes = parsed.quotes || []
      db.indicators = parsed.indicators || []
      db.sectors = parsed.sectors || []
      db.concepts = parsed.concepts || []
    }
    console.log('数据库已加载:', db)
  } catch (error) {
    console.error('加载数据库失败:', error)
  }
}

// 保存数据
function saveDB() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
    console.log('数据库已保存')
  } catch (error) {
    console.error('保存数据库失败:', error)
  }
}

// 初始化数据库
export async function initDatabase() {
  try {
    loadDB()
    console.log('数据库初始化完成')
    return db
  } catch (error) {
    console.error('数据库初始化失败:', error)
    throw error
  }
}

// 插入或更新股票基础信息
export async function upsertStock(stock) {
  try {
    const index = db.stocks.findIndex(s => s.code === stock.code)
    if (index >= 0) {
      db.stocks[index] = { ...db.stocks[index], ...stock }
    } else {
      db.stocks.push(stock)
    }
    saveDB()
    return { success: true }
  } catch (error) {
    console.error('插入股票信息失败:', error)
    return { success: false, error: error.message }
  }
}

// 批量插入股票基础信息
export async function batchInsertStocks(stocks) {
  try {
    stocks.forEach(stock => {
      const index = db.stocks.findIndex(s => s.code === stock.code)
      if (index >= 0) {
        db.stocks[index] = { ...db.stocks[index], ...stock }
      } else {
        db.stocks.push(stock)
      }
    })
    saveDB()
    return { success: true }
  } catch (error) {
    console.error('批量插入股票信息失败:', error)
    return { success: false, error: error.message }
  }
}

// 批量插入行情数据
export async function batchInsertQuotes(quotes) {
  try {
    quotes.forEach(quote => {
      const index = db.quotes.findIndex(q => q.code === quote.code && q.date === quote.date)
      if (index >= 0) {
        db.quotes[index] = { ...db.quotes[index], ...quote }
      } else {
        db.quotes.push(quote)
      }
    })
    saveDB()
    return { success: true }
  } catch (error) {
    console.error('批量插入行情数据失败:', error)
    return { success: false, error: error.message }
  }
}

// 批量插入技术指标数据
export async function batchInsertIndicators(indicators) {
  try {
    indicators.forEach(indicator => {
      const index = db.indicators.findIndex(i => i.code === indicator.code && i.date === indicator.date)
      if (index >= 0) {
        db.indicators[index] = { ...db.indicators[index], ...indicator }
      } else {
        db.indicators.push(indicator)
      }
    })
    saveDB()
    return { success: true }
  } catch (error) {
    console.error('批量插入技术指标数据失败:', error)
    return { success: false, error: error.message }
  }
}

// 批量插入行业板块数据
export async function batchInsertSectors(sectors) {
  try {
    sectors.forEach(sector => {
      const index = db.sectors.findIndex(s => s.name === sector.name && s.date === sector.date)
      if (index >= 0) {
        db.sectors[index] = { ...db.sectors[index], ...sector }
      } else {
        db.sectors.push(sector)
      }
    })
    saveDB()
    return { success: true }
  } catch (error) {
    console.error('批量插入行业板块数据失败:', error)
    return { success: false, error: error.message }
  }
}

// 批量插入概念板块数据
export async function batchInsertConcepts(concepts) {
  try {
    concepts.forEach(concept => {
      const index = db.concepts.findIndex(c => c.name === concept.name && c.date === concept.date)
      if (index >= 0) {
        db.concepts[index] = { ...db.concepts[index], ...concept }
      } else {
        db.concepts.push(concept)
      }
    })
    saveDB()
    return { success: true }
  } catch (error) {
    console.error('批量插入概念板块数据失败:', error)
    return { success: false, error: error.message }
  }
}

// 查询股票数据
export async function getStockData(params = {}) {
  try {
    let results = [...db.quotes]

    if (params.code) {
      results = results.filter(q => q.code === params.code)
    }

    if (params.date) {
      results = results.filter(q => q.date === params.date)
    }

    if (params.startDate && params.endDate) {
      results = results.filter(q => q.date >= params.startDate && q.date <= params.endDate)
    }

    if (params.sortBy) {
      const sortOrder = params.sortOrder === 'ASC' ? 1 : -1
      results.sort((a, b) => {
        if (a[params.sortBy] < b[params.sortBy]) return -1 * sortOrder
        if (a[params.sortBy] > b[params.sortBy]) return 1 * sortOrder
        return 0
      })
    }

    if (params.limit) {
      results = results.slice(0, params.limit)
    }

    return { success: true, data: results }
  } catch (error) {
    console.error('查询股票数据失败:', error)
    return { success: false, error: error.message }
  }
}

// 查询技术指标数据
export async function getIndicatorData(params = {}) {
  try {
    let results = [...db.indicators]

    if (params.code) {
      results = results.filter(i => i.code === params.code)
    }

    if (params.date) {
      results = results.filter(i => i.date === params.date)
    }

    if (params.startDate && params.endDate) {
      results = results.filter(i => i.date >= params.startDate && i.date <= params.endDate)
    }

    if (params.sortBy) {
      const sortOrder = params.sortOrder === 'ASC' ? 1 : -1
      results.sort((a, b) => {
        if (a[params.sortBy] < b[params.sortBy]) return -1 * sortOrder
        if (a[params.sortBy] > b[params.sortBy]) return 1 * sortOrder
        return 0
      })
    }

    return { success: true, data: results }
  } catch (error) {
    console.error('查询技术指标数据失败:', error)
    return { success: false, error: error.message }
  }
}

// 查询行业概念数据
export async function getSectorData(params = {}) {
  try {
    const sourceData = params.type === 'concept' ? db.concepts : db.sectors
    let results = [...sourceData]

    if (params.date) {
      results = results.filter(s => s.date === params.date)
    }

    if (params.startDate && params.endDate) {
      results = results.filter(s => s.date >= params.startDate && s.date <= params.endDate)
    }

    if (params.name) {
      if (Array.isArray(params.name)) {
        results = results.filter(s => params.name.includes(s.name))
      } else {
        results = results.filter(s => s.name === params.name)
      }
    }

    if (params.sortBy) {
      const sortOrder = params.sortOrder === 'ASC' ? 1 : -1
      results.sort((a, b) => {
        if (a[params.sortBy] < b[params.sortBy]) return -1 * sortOrder
        if (a[params.sortBy] > b[params.sortBy]) return 1 * sortOrder
        return 0
      })
    }

    return { success: true, data: results }
  } catch (error) {
    console.error('查询行业概念数据失败:', error)
    return { success: false, error: error.message }
  }
}

// 获取所有股票代码
export async function getAllStockCodes() {
  try {
    const codes = [...new Set(db.stocks.map(s => s.code))].sort()
    return { success: true, data: codes }
  } catch (error) {
    console.error('获取股票代码失败:', error)
    return { success: false, error: error.message }
  }
}

// 获取所有行业名称
export async function getAllSectorNames() {
  try {
    const names = [...new Set(db.sectors.map(s => s.name))].sort()
    return { success: true, data: names }
  } catch (error) {
    console.error('获取行业名称失败:', error)
    return { success: false, error: error.message }
  }
}

// 获取所有概念名称
export async function getAllConceptNames() {
  try {
    const names = [...new Set(db.concepts.map(c => c.name))].sort()
    return { success: true, data: names }
  } catch (error) {
    console.error('获取概念名称失败:', error)
    return { success: false, error: error.message }
  }
}

// 获取所有日期
export async function getAllDates() {
  try {
    const dates = [...new Set(db.quotes.map(q => q.date))].sort().reverse()
    return { success: true, data: dates }
  } catch (error) {
    console.error('获取日期失败:', error)
    return { success: false, error: error.message }
  }
}

// 删除指定日期的数据
export async function deleteDataByDate(date, dataType = 'all') {
  try {
    if (dataType === 'all' || dataType === 'quotes') {
      db.quotes = db.quotes.filter(q => q.date !== date)
    }

    if (dataType === 'all' || dataType === 'indicators') {
      db.indicators = db.indicators.filter(i => i.date !== date)
    }

    if (dataType === 'all' || dataType === 'sectors') {
      db.sectors = db.sectors.filter(s => s.date !== date)
    }

    if (dataType === 'all' || dataType === 'concepts') {
      db.concepts = db.concepts.filter(c => c.date !== date)
    }

    saveDB()
    return { success: true }
  } catch (error) {
    console.error('删除数据失败:', error)
    return { success: false, error: error.message }
  }
}

// 获取数据库统计信息
export async function getDatabaseStats() {
  try {
    return {
      success: true,
      data: {
        quoteCount: db.quotes.length,
        indicatorCount: db.indicators.length,
        sectorCount: db.sectors.length,
        conceptCount: db.concepts.length
      }
    }
  } catch (error) {
    console.error('获取数据库统计信息失败:', error)
    return { success: false, error: error.message }
  }
}

// 获取记录数量
export async function getRecordCount() {
  try {
    return {
      success: true,
      data: {
        total: db.quotes.length + db.indicators.length + db.sectors.length + db.concepts.length,
        quotes: db.quotes.length,
        indicators: db.indicators.length,
        sectors: db.sectors.length,
        concepts: db.concepts.length,
        stocks: db.stocks.length
      }
    }
  } catch (error) {
    console.error('获取记录数量失败:', error)
    return { success: false, error: error.message }
  }
}

// 获取股票列表
export async function getStockList() {
  try {
    return { success: true, data: [...db.stocks] }
  } catch (error) {
    console.error('获取股票列表失败:', error)
    return { success: false, error: error.message }
  }
}

// 获取每日行情
export async function getDailyQuotes(params = {}) {
  return getStockData(params)
}

// 获取技术指标
export async function getTechnicalIndicators(params = {}) {
  return getIndicatorData(params)
}

// 获取所有行业
export async function getAllIndustries() {
  try {
    const industries = [...new Set(db.stocks.map(s => s.industry).filter(i => i))].sort()
    return { success: true, data: industries }
  } catch (error) {
    console.error('获取行业列表失败:', error)
    return { success: false, error: error.message }
  }
}

// 获取行业列表
export async function getSectorList() {
  return getAllSectorNames()
}

// 获取概念列表
export async function getConceptList() {
  return getAllConceptNames()
}

// 获取概念数据
export async function getConceptData(params = {}) {
  return getSectorData({ ...params, type: 'concept' })
}

// 关闭数据库连接
export function closeDatabase() {
  saveDB()
}
