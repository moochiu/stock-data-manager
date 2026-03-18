// 初始化数据库
export function initDatabase() {
  // 数据库在Electron主进程中初始化,这里不需要额外操作
  console.log('SQLite数据库已准备就绪(通过IPC通信)')
  return true
}

// 批量插入股票基础信息
export async function batchInsertStocks(stocks) {
  const operations = stocks.map(stock => ({
    sql: `INSERT OR REPLACE INTO stocks (code, name, industry, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
    params: [stock.code, stock.name, stock.industry || '']
  }))

  const result = await window.electronAPI.dbTransaction(operations)
  if (!result.success) {
    throw new Error(result.error)
  }
  return { changes: stocks.length }
}

// 批量插入行情数据
export async function batchInsertQuotes(quotes) {
  const operations = quotes.map(quote => ({
    sql: `INSERT OR REPLACE INTO quotes (
      code, date, price, change_percent, change_value, turnover_rate,
      open_price, close_yesterday, amount, pe_ratio, main_net_amount,
      low_price, high_price, rise_5d, rise_10d, rise_20d,
      total_market_cap, circulation_market_cap
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    params: [
      quote.code,
      quote.date,
      quote.price,
      quote.change_percent,
      quote.change_value,
      quote.turnover_rate,
      quote.open_price,
      quote.close_yesterday,
      quote.amount,
      quote.pe_ratio,
      quote.main_net_amount,
      quote.low_price,
      quote.high_price,
      quote.rise_5d,
      quote.rise_10d,
      quote.rise_20d,
      quote.total_market_cap,
      quote.circulation_market_cap
    ]
  }))

  const result = await window.electronAPI.dbTransaction(operations)
  if (!result.success) {
    throw new Error(result.error)
  }
  return { changes: quotes.length }
}

// 批量插入技术指标数据
export async function batchInsertIndicators(indicators) {
  const operations = indicators.map(indicator => ({
    sql: `INSERT OR REPLACE INTO indicators (
      code, date, ma5, ma10, ma20, ma30,
      macd, macd_diff, macd_dea,
      rsi6, rsi12, rsi24,
      kdj_k, kdj_d, kdj_j
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    params: [
      indicator.code,
      indicator.date,
      indicator.ma5,
      indicator.ma10,
      indicator.ma20,
      indicator.ma30,
      indicator.macd,
      indicator.macd_diff,
      indicator.macd_dea,
      indicator.rsi6,
      indicator.rsi12,
      indicator.rsi24,
      indicator.kdj_k,
      indicator.kdj_d,
      indicator.kdj_j
    ]
  }))

  const result = await window.electronAPI.dbTransaction(operations)
  if (!result.success) {
    throw new Error(result.error)
  }
  return { changes: indicators.length }
}

// 查询股票列表
export async function getStockList() {
  const result = await window.electronAPI.dbQuery('SELECT * FROM stocks ORDER BY code', [])
  if (!result.success) {
    throw new Error(result.error)
  }
  return result.data
}

// 查询每日行情数据
export async function getDailyQuotes(filters = {}) {
  let sql = `
    SELECT q.*, s.name, s.industry
    FROM quotes q
    LEFT JOIN stocks s ON q.code = s.code
    WHERE 1=1
  `
  const params = []

  // 按日期筛选
  if (filters.startDate) {
    sql += ' AND q.date >= ?'
    params.push(filters.startDate)
  }

  if (filters.endDate) {
    sql += ' AND q.date <= ?'
    params.push(filters.endDate)
  }

  // 按股票代码筛选
  if (filters.code) {
    sql += ' AND q.code LIKE ?'
    params.push(`%${filters.code}%`)
  }

  // 按股票名称筛选
  if (filters.name) {
    sql += ' AND s.name LIKE ?'
    params.push(`%${filters.name}%`)
  }

  // 按行业筛选
  if (filters.industry) {
    sql += ' AND s.industry = ?'
    params.push(filters.industry)
  }

  // 按多个股票代码筛选
  if (filters.codes && filters.codes.length > 0) {
    const placeholders = filters.codes.map(() => '?').join(',')
    sql += ` AND q.code IN (${placeholders})`
    params.push(...filters.codes)
  }

  sql += ' ORDER BY q.date DESC, q.code'

  const result = await window.electronAPI.dbQuery(sql, params)
  if (!result.success) {
    throw new Error(result.error)
  }
  return result.data
}

// 查询技术指标数据
export async function getTechnicalIndicators(code, date) {
  const sql = `SELECT * FROM indicators WHERE code = ? AND date = ?`
  const result = await window.electronAPI.dbQuery(sql, [code, date])
  if (!result.success) {
    throw new Error(result.error)
  }
  return result.data.length > 0 ? result.data[0] : null
}

// 删除指定日期的数据
export async function deleteDataByDate(date) {
  const operations = [
    { sql: 'DELETE FROM quotes WHERE date = ?', params: [date] },
    { sql: 'DELETE FROM indicators WHERE date = ?', params: [date] }
  ]

  const result = await window.electronAPI.dbTransaction(operations)
  if (!result.success) {
    throw new Error(result.error)
  }
  return { success: true }
}

// 获取记录总数
export async function getRecordCount() {
  const quoteResult = await window.electronAPI.dbQuery('SELECT COUNT(*) as count FROM quotes', [])
  const indicatorResult = await window.electronAPI.dbQuery('SELECT COUNT(*) as count FROM indicators', [])
  const stockResult = await window.electronAPI.dbQuery('SELECT COUNT(*) as count FROM stocks', [])

  if (!quoteResult.success || !indicatorResult.success || !stockResult.success) {
    throw new Error('获取记录数失败')
  }

  return {
    stocks: stockResult.data[0].count,
    quotes: quoteResult.data[0].count,
    indicators: indicatorResult.data[0].count,
    total: stockResult.data[0].count + quoteResult.data[0].count + indicatorResult.data[0].count
  }
}

// 获取数据库文件大小
export async function getDatabaseSize() {
  const result = await window.electronAPI.getDbSize()
  return result.size
}
