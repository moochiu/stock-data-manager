const db = require('./init')

// 插入或更新股票基础信息
function upsertStock(stockData) {
  const stmt = db.prepare(`
    INSERT INTO stocks (code, name, industry)
    VALUES (@code, @name, @industry)
    ON CONFLICT(code) DO UPDATE SET
      name = @name,
      industry = @industry
  `)
  return stmt.run(stockData)
}

// 插入或更新每日行情数据
function upsertDailyQuote(quoteData) {
  const stmt = db.prepare(`
    INSERT INTO daily_quotes (
      code, date, price, change_percent, change_value, turnover_rate,
      open_price, close_yesterday, amount, pe_ratio, main_net_amount,
      low_price, high_price, rise_5d, rise_10d, rise_20d,
      total_market_cap, circulation_market_cap
    )
    VALUES (
      @code, @date, @price, @change_percent, @change_value, @turnover_rate,
      @open_price, @close_yesterday, @amount, @pe_ratio, @main_net_amount,
      @low_price, @high_price, @rise_5d, @rise_10d, @rise_20d,
      @total_market_cap, @circulation_market_cap
    )
    ON CONFLICT(code, date) DO UPDATE SET
      price = @price,
      change_percent = @change_percent,
      change_value = @change_value,
      turnover_rate = @turnover_rate,
      open_price = @open_price,
      close_yesterday = @close_yesterday,
      amount = @amount,
      pe_ratio = @pe_ratio,
      main_net_amount = @main_net_amount,
      low_price = @low_price,
      high_price = @high_price,
      rise_5d = @rise_5d,
      rise_10d = @rise_10d,
      rise_20d = @rise_20d,
      total_market_cap = @total_market_cap,
      circulation_market_cap = @circulation_market_cap,
      updated_at = CURRENT_TIMESTAMP
  `)
  return stmt.run(quoteData)
}

// 插入或更新技术指标数据
function upsertTechnicalIndicator(indicatorData) {
  const stmt = db.prepare(`
    INSERT INTO technical_indicators (
      code, date, ma5, ma10, ma20, ma30,
      macd, macd_diff, macd_dea,
      rsi6, rsi12, rsi24,
      kdj_k, kdj_d, kdj_j
    )
    VALUES (
      @code, @date, @ma5, @ma10, @ma20, @ma30,
      @macd, @macd_diff, @macd_dea,
      @rsi6, @rsi12, @rsi24,
      @kdj_k, @kdj_d, @kdj_j
    )
    ON CONFLICT(code, date) DO UPDATE SET
      ma5 = @ma5, ma10 = @ma10, ma20 = @ma20, ma30 = @ma30,
      macd = @macd, macd_diff = @macd_diff, macd_dea = @macd_dea,
      rsi6 = @rsi6, rsi12 = @rsi12, rsi24 = @rsi24,
      kdj_k = @kdj_k, kdj_d = @kdj_d, kdj_j = @kdj_j,
      updated_at = CURRENT_TIMESTAMP
  `)
  return stmt.run(indicatorData)
}

// 查询股票列表
function getStockList() {
  const stmt = db.prepare('SELECT code, name, industry FROM stocks ORDER BY code')
  return stmt.all()
}

// 查询每日行情数据
function getDailyQuotes(filters = {}) {
  let query = `
    SELECT q.*, s.name, s.industry
    FROM daily_quotes q
    JOIN stocks s ON q.code = s.code
    WHERE 1=1
  `
  const params = []

  if (filters.startDate) {
    query += ' AND q.date >= ?'
    params.push(filters.startDate)
  }
  if (filters.endDate) {
    query += ' AND q.date <= ?'
    params.push(filters.endDate)
  }
  if (filters.code) {
    query += ' AND q.code LIKE ?'
    params.push(`%${filters.code}%`)
  }
  if (filters.name) {
    query += ' AND s.name LIKE ?'
    params.push(`%${filters.name}%`)
  }
  if (filters.industry) {
    query += ' AND s.industry = ?'
    params.push(filters.industry)
  }

  query += ' ORDER BY q.date DESC, q.code'

  const stmt = db.prepare(query)
  return stmt.all(...params)
}

// 查询技术指标数据
function getTechnicalIndicators(filters = {}) {
  let query = `
    SELECT t.*, s.name
    FROM technical_indicators t
    JOIN stocks s ON t.code = s.code
    WHERE 1=1
  `
  const params = []

  if (filters.startDate) {
    query += ' AND t.date >= ?'
    params.push(filters.startDate)
  }
  if (filters.endDate) {
    query += ' AND t.date <= ?'
    params.push(filters.endDate)
  }
  if (filters.code) {
    query += ' AND t.code = ?'
    params.push(filters.code)
  }

  query += ' ORDER BY t.date DESC, t.code'

  const stmt = db.prepare(query)
  return stmt.all(...params)
}

// 查询股票完整数据（行情+技术指标）
function getStockCompleteData(code, date) {
  const quoteStmt = db.prepare(`
    SELECT q.*, s.name, s.industry
    FROM daily_quotes q
    JOIN stocks s ON q.code = s.code
    WHERE q.code = ? AND q.date = ?
  `)
  const quote = quoteStmt.get(code, date)

  const indicatorStmt = db.prepare(`
    SELECT * FROM technical_indicators
    WHERE code = ? AND date = ?
  `)
  const indicator = indicatorStmt.get(code, date)

  return { quote, indicator }
}

// 获取所有行业
function getIndustries() {
  const stmt = db.prepare('SELECT DISTINCT industry FROM stocks WHERE industry IS NOT NULL ORDER BY industry')
  return stmt.all().map(row => row.industry)
}

// 获取数据库统计信息
function getDatabaseStats() {
  const stockCount = db.prepare('SELECT COUNT(*) as count FROM stocks').get().count
  const quoteCount = db.prepare('SELECT COUNT(*) as count FROM daily_quotes').get().count
  const indicatorCount = db.prepare('SELECT COUNT(*) as count FROM technical_indicators').get().count
  const dateRange = db.prepare(`
    SELECT MIN(date) as min_date, MAX(date) as max_date FROM daily_quotes
  `).get()

  return {
    stockCount,
    quoteCount,
    indicatorCount,
    dateRange
  }
}

// 删除指定日期的数据
function deleteDataByDate(date) {
  const deleteQuotes = db.prepare('DELETE FROM daily_quotes WHERE date = ?')
  const deleteIndicators = db.prepare('DELETE FROM technical_indicators WHERE date = ?')

  deleteQuotes.run(date)
  deleteIndicators.run(date)
}

module.exports = {
  upsertStock,
  upsertDailyQuote,
  upsertTechnicalIndicator,
  getStockList,
  getDailyQuotes,
  getTechnicalIndicators,
  getStockCompleteData,
  getIndustries,
  getDatabaseStats,
  deleteDataByDate
}
