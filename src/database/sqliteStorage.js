const Database = require('better-sqlite3')
const path = require('path')
const { app } = require('electron')

// 数据库路径
let dbPath = null
let db = null

// 获取数据库路径
function getDatabasePath() {
  if (!dbPath) {
    // 在Electron环境中使用userData目录
    if (app) {
      dbPath = path.join(app.getPath('userData'), 'stock_data.db')
    } else {
      // 在浏览器环境中使用临时路径
      dbPath = path.join(process.cwd(), 'stock_data.db')
    }
  }
  return dbPath
}

// 初始化数据库
export async function initDatabase() {
  try {
    db = new Database(getDatabasePath())
    db.pragma('journal_mode = WAL')

    // 创建股票基础信息表
    db.exec(`
      CREATE TABLE IF NOT EXISTS stocks (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        industry TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 创建行情数据表
    db.exec(`
      CREATE TABLE IF NOT EXISTS quotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        date TEXT NOT NULL,
        price REAL,
        change_percent REAL,
        change_value REAL,
        turnover_rate REAL,
        open_price REAL,
        close_yesterday REAL,
        amount REAL,
        pe_ratio REAL,
        main_net_amount REAL,
        low_price REAL,
        high_price REAL,
        rise_5d REAL,
        rise_10d REAL,
        rise_20d REAL,
        total_market_cap REAL,
        circulation_market_cap REAL,
        UNIQUE(code, date),
        FOREIGN KEY (code) REFERENCES stocks(code)
      )
    `)

    // 创建技术指标表
    db.exec(`
      CREATE TABLE IF NOT EXISTS indicators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        date TEXT NOT NULL,
        ma5 REAL,
        ma10 REAL,
        ma20 REAL,
        ma30 REAL,
        macd REAL,
        macd_diff REAL,
        macd_dea REAL,
        rsi6 REAL,
        rsi12 REAL,
        rsi24 REAL,
        kdj_k REAL,
        kdj_d REAL,
        kdj_j REAL,
        UNIQUE(code, date),
        FOREIGN KEY (code) REFERENCES stocks(code)
      )
    `)

    // 创建行业板块数据表
    db.exec(`
      CREATE TABLE IF NOT EXISTS sectors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        index_value REAL,
        change_percent REAL,
        inflow_amount REAL,
        outflow_amount REAL,
        net_amount REAL,
        company_count INTEGER,
        leading_stock TEXT,
        leading_stock_change REAL,
        leading_stock_price REAL,
        UNIQUE(name, date)
      )
    `)

    // 创建概念板块数据表
    db.exec(`
      CREATE TABLE IF NOT EXISTS concepts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        index_value REAL,
        change_percent REAL,
        inflow_amount REAL,
        outflow_amount REAL,
        net_amount REAL,
        company_count INTEGER,
        leading_stock TEXT,
        leading_stock_change REAL,
        leading_stock_price REAL,
        UNIQUE(name, date)
      )
    `)

    // 创建索引
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_quotes_code ON quotes(code);
      CREATE INDEX IF NOT EXISTS idx_quotes_date ON quotes(date);
      CREATE INDEX IF NOT EXISTS idx_quotes_code_date ON quotes(code, date);
      CREATE INDEX IF NOT EXISTS idx_indicators_code ON indicators(code);
      CREATE INDEX IF NOT EXISTS idx_indicators_date ON indicators(date);
      CREATE INDEX IF NOT EXISTS idx_indicators_code_date ON indicators(code, date);
      CREATE INDEX IF NOT EXISTS idx_sectors_name ON sectors(name);
      CREATE INDEX IF NOT EXISTS idx_sectors_date ON sectors(date);
      CREATE INDEX IF NOT EXISTS idx_concepts_name ON concepts(name);
      CREATE INDEX IF NOT EXISTS idx_concepts_date ON concepts(date);
    `)

    console.log('SQLite数据库初始化成功:', getDatabasePath())
    return true
  } catch (error) {
    console.error('SQLite数据库初始化失败:', error)
    throw error
  }
}

// 插入或更新股票基础信息
export function upsertStock(stockData) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO stocks (code, name, industry, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `)
  stmt.run(stockData.code, stockData.name, stockData.industry)
  return { changes: 1 }
}

// 批量插入股票数据
export function batchInsertStocks(stocks) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO stocks (code, name, industry, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `)

  const transaction = db.transaction((stockList) => {
    for (const stock of stockList) {
      stmt.run(stock.code, stock.name, stock.industry)
    }
  })

  transaction(stocks)
  return { changes: stocks.length }
}

// 批量插入行情数据
export function batchInsertQuotes(quotes) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO quotes (
      code, date, price, change_percent, change_value, turnover_rate,
      open_price, close_yesterday, amount, pe_ratio, main_net_amount,
      low_price, high_price, rise_5d, rise_10d, rise_20d,
      total_market_cap, circulation_market_cap
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction((quoteList) => {
    for (const quote of quoteList) {
      stmt.run(
        quote.code, quote.date, quote.price, quote.change_percent, quote.change_value,
        quote.turnover_rate, quote.open_price, quote.close_yesterday, quote.amount,
        quote.pe_ratio, quote.main_net_amount, quote.low_price, quote.high_price,
        quote.rise_5d, quote.rise_10d, quote.rise_20d, quote.total_market_cap,
        quote.circulation_market_cap
      )
    }
  })

  transaction(quotes)
  return { changes: quotes.length }
}

// 批量插入技术指标数据
export function batchInsertIndicators(indicators) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO indicators (
      code, date, ma5, ma10, ma20, ma30, macd, macd_diff, macd_dea,
      rsi6, rsi12, rsi24, kdj_k, kdj_d, kdj_j
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction((indicatorList) => {
    for (const indicator of indicatorList) {
      stmt.run(
        indicator.code, indicator.date, indicator.ma5, indicator.ma10,
        indicator.ma20, indicator.ma30, indicator.macd, indicator.macd_diff,
        indicator.macd_dea, indicator.rsi6, indicator.rsi12, indicator.rsi24,
        indicator.kdj_k, indicator.kdj_d, indicator.kdj_j
      )
    }
  })

  transaction(indicators)
  return { changes: indicators.length }
}

// 批量插入行业板块数据
export function batchInsertSectors(sectors) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO sectors (
      name, date, index_value, change_percent, inflow_amount, outflow_amount,
      net_amount, company_count, leading_stock, leading_stock_change, leading_stock_price
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction((sectorList) => {
    for (const sector of sectorList) {
      stmt.run(
        sector.name, sector.date, sector.index_value, sector.change_percent,
        sector.inflow_amount, sector.outflow_amount, sector.net_amount,
        sector.company_count, sector.leading_stock, sector.leading_stock_change,
        sector.leading_stock_price
      )
    }
  })

  transaction(sectors)
  return { changes: sectors.length }
}

// 批量插入概念板块数据
export function batchInsertConcepts(concepts) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO concepts (
      name, date, index_value, change_percent, inflow_amount, outflow_amount,
      net_amount, company_count, leading_stock, leading_stock_change, leading_stock_price
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction((conceptList) => {
    for (const concept of conceptList) {
      stmt.run(
        concept.name, concept.date, concept.index_value, concept.change_percent,
        concept.inflow_amount, concept.outflow_amount, concept.net_amount,
        concept.company_count, concept.leading_stock, concept.leading_stock_change,
        concept.leading_stock_price
      )
    }
  })

  transaction(concepts)
  return { changes: concepts.length }
}

// 查询股票列表
export function getStockList() {
  const stmt = db.prepare('SELECT * FROM stocks ORDER BY code')
  return stmt.all()
}

// 查询每日行情数据
export function getDailyQuotes(filters = {}) {
  let sql = `
    SELECT q.*, s.name, s.industry
    FROM quotes q
    LEFT JOIN stocks s ON q.code = s.code
    WHERE 1=1
  `
  const params = []

  if (filters.startDate) {
    sql += ' AND q.date >= ?'
    params.push(filters.startDate)
  }

  if (filters.endDate) {
    sql += ' AND q.date <= ?'
    params.push(filters.endDate)
  }

  if (filters.code) {
    sql += ' AND q.code LIKE ?'
    params.push(`%${filters.code}%`)
  }

  if (filters.name) {
    sql += ' AND s.name LIKE ?'
    params.push(`%${filters.name}%`)
  }

  if (filters.industry) {
    sql += ' AND s.industry = ?'
    params.push(filters.industry)
  }

  if (filters.codes && filters.codes.length > 0) {
    const placeholders = filters.codes.map(() => '?').join(',')
    sql += ` AND q.code IN (${placeholders})`
    params.push(...filters.codes)
  }

  sql += ' ORDER BY q.date DESC, q.code'

  const stmt = db.prepare(sql)
  return stmt.all(...params)
}

// 查询技术指标数据
export function getTechnicalIndicators(code, date) {
  const stmt = db.prepare('SELECT * FROM indicators WHERE code = ? AND date = ?')
  return stmt.get(code, date)
}

// 查询行业板块列表
export function getSectorList() {
  const stmt = db.prepare('SELECT DISTINCT name FROM sectors ORDER BY name')
  const results = stmt.all()
  return results.map(r => r.name)
}

// 查询行业板块数据
export function getSectorData(filters = {}) {
  let sql = 'SELECT * FROM sectors WHERE 1=1'
  const params = []

  if (filters.startDate) {
    sql += ' AND date >= ?'
    params.push(filters.startDate)
  }

  if (filters.endDate) {
    sql += ' AND date <= ?'
    params.push(filters.endDate)
  }

  if (filters.name) {
    sql += ' AND name = ?'
    params.push(filters.name)
  }

  if (filters.names && filters.names.length > 0) {
    const placeholders = filters.names.map(() => '?').join(',')
    sql += ` AND name IN (${placeholders})`
    params.push(...filters.names)
  }

  sql += ' ORDER BY date DESC, name'

  const stmt = db.prepare(sql)
  return stmt.all(...params)
}

// 查询概念板块列表
export function getConceptList() {
  const stmt = db.prepare('SELECT DISTINCT name FROM concepts ORDER BY name')
  const results = stmt.all()
  return results.map(r => r.name)
}

// 查询概念板块数据
export function getConceptData(filters = {}) {
  let sql = 'SELECT * FROM concepts WHERE 1=1'
  const params = []

  if (filters.startDate) {
    sql += ' AND date >= ?'
    params.push(filters.startDate)
  }

  if (filters.endDate) {
    sql += ' AND date <= ?'
    params.push(filters.endDate)
  }

  if (filters.name) {
    sql += ' AND name = ?'
    params.push(filters.name)
  }

  if (filters.names && filters.names.length > 0) {
    const placeholders = filters.names.map(() => '?').join(',')
    sql += ` AND name IN (${placeholders})`
    params.push(...filters.names)
  }

  sql += ' ORDER BY date DESC, name'

  const stmt = db.prepare(sql)
  return stmt.all(...params)
}

// 删除指定日期的数据
export function deleteDataByDate(date) {
  let count = 0
  const deletedItems = {
    quotes: 0,
    indicators: 0,
    sectors: 0,
    concepts: 0
  }

  // 删除行情数据
  const quoteStmt = db.prepare('DELETE FROM quotes WHERE date = ?')
  const quoteResult = quoteStmt.run(date)
  deletedItems.quotes = quoteResult.changes
  count += quoteResult.changes

  // 删除技术指标数据
  const indicatorStmt = db.prepare('DELETE FROM indicators WHERE date = ?')
  const indicatorResult = indicatorStmt.run(date)
  deletedItems.indicators = indicatorResult.changes
  count += indicatorResult.changes

  // 删除行业板块数据
  const sectorStmt = db.prepare('DELETE FROM sectors WHERE date = ?')
  const sectorResult = sectorStmt.run(date)
  deletedItems.sectors = sectorResult.changes
  count += sectorResult.changes

  // 删除概念板块数据
  const conceptStmt = db.prepare('DELETE FROM concepts WHERE date = ?')
  const conceptResult = conceptStmt.run(date)
  deletedItems.concepts = conceptResult.changes
  count += conceptResult.changes

  return { count, deletedItems }
}

// 获取所有日期
export function getAllDates() {
  const stmt = db.prepare('SELECT DISTINCT date FROM quotes ORDER BY date DESC')
  const results = stmt.all()
  return results.map(r => r.date)
}

// 获取所有行业
export function getAllIndustries() {
  const stmt = db.prepare('SELECT DISTINCT industry FROM stocks WHERE industry IS NOT NULL ORDER BY industry')
  const results = stmt.all()
  return results.map(r => r.industry)
}

// 获取记录总数统计
export function getRecordCount() {
  const stockCount = db.prepare('SELECT COUNT(*) as count FROM stocks').get().count
  const quoteCount = db.prepare('SELECT COUNT(*) as count FROM quotes').get().count
  const indicatorCount = db.prepare('SELECT COUNT(*) as count FROM indicators').get().count
  const sectorCount = db.prepare('SELECT COUNT(*) as count FROM sectors').get().count
  const conceptCount = db.prepare('SELECT COUNT(*) as count FROM concepts').get().count

  return {
    stocks: stockCount,
    quotes: quoteCount,
    indicators: indicatorCount,
    sectors: sectorCount,
    concepts: conceptCount,
    total: stockCount + quoteCount + indicatorCount + sectorCount + conceptCount
  }
}

// 关闭数据库连接
export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}
