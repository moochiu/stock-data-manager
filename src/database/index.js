// 使用sqlite3进行本地数据库存储
// 数据保存在程序目录下的stock_data.db文件

const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')

let db = null

// 获取数据库文件路径
const getDatabasePath = () => {
  const exePath = process.env.PORTABLE_EXECUTABLE_DIR
    ? path.dirname(process.execPath)
    : __dirname
  return path.join(exePath, 'stock_data.db')
}

// 初始化数据库
export async function initDatabase() {
  try {
    const dbPath = getDatabasePath()
    console.log('数据库路径:', dbPath)

    // 创建数据库连接
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('数据库连接失败:', err)
        throw err
      }
      console.log('数据库连接成功')
    })

    // 创建表结构
    await createTables()

    console.log('数据库初始化完成')
    return db
  } catch (error) {
    console.error('数据库初始化失败:', error)
    throw error
  }
}

// 创建表结构
function createTables() {
  return new Promise((resolve, reject) => {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS stocks (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        industry TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

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
        UNIQUE(code, date)
      );

      CREATE TABLE IF NOT EXISTS indicators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        date TEXT NOT NULL,
        ma5 REAL,
        ma10 REAL,
        ma20 REAL,
        ma30 REAL,
        ma60 REAL,
        macd REAL,
        macd_diff REAL,
        macd_dea REAL,
        macd_signal REAL,
        macd_hist REAL,
        rsi6 REAL,
        rsi12 REAL,
        rsi24 REAL,
        kdj_k REAL,
        kdj_d REAL,
        kdj_j REAL,
        UNIQUE(code, date)
      );

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
      );

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
      );
    `

    db.exec(createTableSQL, (err) => {
      if (err) {
        console.error('创建表失败:', err)
        reject(err)
      } else {
        console.log('表结构创建完成')
        resolve()
      }
    })
  })
}

// 插入或更新股票基础信息
export async function upsertStock(stock) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO stocks (code, name, industry, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(code) DO UPDATE SET
        name = excluded.name,
        industry = excluded.industry,
        updated_at = datetime('now')
    `
    db.run(sql, [stock.code, stock.name, stock.industry || ''], (err) => {
      if (err) {
        console.error('插入股票信息失败:', err)
        reject({ success: false, error: err.message })
      } else {
        resolve({ success: true })
      }
    })
  })
}

// 批量插入股票基础信息
export async function batchInsertStocks(stocks) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO stocks (code, name, industry, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(code) DO UPDATE SET
        name = excluded.name,
        industry = excluded.industry,
        updated_at = datetime('now')
    `

    db.serialize(() => {
      const stmt = db.prepare(sql)
      stocks.forEach(stock => {
        stmt.run(stock.code, stock.name, stock.industry || '')
      })
      stmt.finalize((err) => {
        if (err) {
          console.error('批量插入股票信息失败:', err)
          reject({ success: false, error: err.message })
        } else {
          resolve({ success: true })
        }
      })
    })
  })
}

// 批量插入行情数据
export async function batchInsertQuotes(quotes) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO quotes (
        code, date, price, change_percent, change_value, turnover_rate,
        open_price, close_yesterday, amount, pe_ratio, main_net_amount,
        low_price, high_price, rise_5d, rise_10d, rise_20d,
        total_market_cap, circulation_market_cap
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(code, date) DO UPDATE SET
        price = excluded.price,
        change_percent = excluded.change_percent,
        change_value = excluded.change_value,
        turnover_rate = excluded.turnover_rate,
        open_price = excluded.open_price,
        close_yesterday = excluded.close_yesterday,
        amount = excluded.amount,
        pe_ratio = excluded.pe_ratio,
        main_net_amount = excluded.main_net_amount,
        low_price = excluded.low_price,
        high_price = excluded.high_price,
        rise_5d = excluded.rise_5d,
        rise_10d = excluded.rise_10d,
        rise_20d = excluded.rise_20d,
        total_market_cap = excluded.total_market_cap,
        circulation_market_cap = excluded.circulation_market_cap
    `

    db.serialize(() => {
      const stmt = db.prepare(sql)
      quotes.forEach(quote => {
        stmt.run(
          quote.code, quote.date, quote.price, quote.change_percent, quote.change_value,
          quote.turnover_rate, quote.open_price, quote.close_yesterday, quote.amount,
          quote.pe_ratio, quote.main_net_amount, quote.low_price, quote.high_price,
          quote.rise_5d, quote.rise_10d, quote.rise_20d,
          quote.total_market_cap, quote.circulation_market_cap
        )
      })
      stmt.finalize((err) => {
        if (err) {
          console.error('批量插入行情数据失败:', err)
          reject({ success: false, error: err.message })
        } else {
          resolve({ success: true })
        }
      })
    })
  })
}

// 批量插入技术指标数据
export async function batchInsertIndicators(indicators) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO indicators (
        code, date, ma5, ma10, ma20, ma30, ma60,
        macd, macd_diff, macd_dea, macd_signal, macd_hist,
        rsi6, rsi12, rsi24, kdj_k, kdj_d, kdj_j
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(code, date) DO UPDATE SET
        ma5 = excluded.ma5,
        ma10 = excluded.ma10,
        ma20 = excluded.ma20,
        ma30 = excluded.ma30,
        ma60 = excluded.ma60,
        macd = excluded.macd,
        macd_diff = excluded.macd_diff,
        macd_dea = excluded.macd_dea,
        macd_signal = excluded.macd_signal,
        macd_hist = excluded.macd_hist,
        rsi6 = excluded.rsi6,
        rsi12 = excluded.rsi12,
        rsi24 = excluded.rsi24,
        kdj_k = excluded.kdj_k,
        kdj_d = excluded.kdj_d,
        kdj_j = excluded.kdj_j
    `

    db.serialize(() => {
      const stmt = db.prepare(sql)
      indicators.forEach(indicator => {
        stmt.run(
          indicator.code, indicator.date,
          indicator.ma5, indicator.ma10, indicator.ma20, indicator.ma30, indicator.ma60,
          indicator.macd, indicator.macd_diff, indicator.macd_dea, indicator.macd_signal, indicator.macd_hist,
          indicator.rsi6, indicator.rsi12, indicator.rsi24,
          indicator.kdj_k, indicator.kdj_d, indicator.kdj_j
        )
      })
      stmt.finalize((err) => {
        if (err) {
          console.error('批量插入技术指标数据失败:', err)
          reject({ success: false, error: err.message })
        } else {
          resolve({ success: true })
        }
      })
    })
  })
}

// 批量插入行业板块数据
export async function batchInsertSectors(sectors) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO sectors (
        name, date, index_value, change_percent, inflow_amount, outflow_amount,
        net_amount, company_count, leading_stock, leading_stock_change, leading_stock_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(name, date) DO UPDATE SET
        index_value = excluded.index_value,
        change_percent = excluded.change_percent,
        inflow_amount = excluded.inflow_amount,
        outflow_amount = excluded.outflow_amount,
        net_amount = excluded.net_amount,
        company_count = excluded.company_count,
        leading_stock = excluded.leading_stock,
        leading_stock_change = excluded.leading_stock_change,
        leading_stock_price = excluded.leading_stock_price
    `

    db.serialize(() => {
      const stmt = db.prepare(sql)
      sectors.forEach(sector => {
        stmt.run(
          sector.name, sector.date, sector.index_value, sector.change_percent,
          sector.inflow_amount, sector.outflow_amount, sector.net_amount,
          sector.company_count, sector.leading_stock, sector.leading_stock_change, sector.leading_stock_price
        )
      })
      stmt.finalize((err) => {
        if (err) {
          console.error('批量插入行业板块数据失败:', err)
          reject({ success: false, error: err.message })
        } else {
          resolve({ success: true })
        }
      })
    })
  })
}

// 批量插入概念板块数据
export async function batchInsertConcepts(concepts) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO concepts (
        name, date, index_value, change_percent, inflow_amount, outflow_amount,
        net_amount, company_count, leading_stock, leading_stock_change, leading_stock_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(name, date) DO UPDATE SET
        index_value = excluded.index_value,
        change_percent = excluded.change_percent,
        inflow_amount = excluded.inflow_amount,
        outflow_amount = excluded.outflow_amount,
        net_amount = excluded.net_amount,
        company_count = excluded.company_count,
        leading_stock = excluded.leading_stock,
        leading_stock_change = excluded.leading_stock_change,
        leading_stock_price = excluded.leading_stock_price
    `

    db.serialize(() => {
      const stmt = db.prepare(sql)
      concepts.forEach(concept => {
        stmt.run(
          concept.name, concept.date, concept.index_value, concept.change_percent,
          concept.inflow_amount, concept.outflow_amount, concept.net_amount,
          concept.company_count, concept.leading_stock, concept.leading_stock_change, concept.leading_stock_price
        )
      })
      stmt.finalize((err) => {
        if (err) {
          console.error('批量插入概念板块数据失败:', err)
          reject({ success: false, error: err.message })
        } else {
          resolve({ success: true })
        }
      })
    })
  })
}

// 查询股票数据
export async function getStockData(params = {}) {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM quotes WHERE 1=1'
    const queryParams = []

    if (params.code) {
      sql += ' AND code = ?'
      queryParams.push(params.code)
    }

    if (params.date) {
      sql += ' AND date = ?'
      queryParams.push(params.date)
    }

    if (params.startDate && params.endDate) {
      sql += ' AND date BETWEEN ? AND ?'
      queryParams.push(params.startDate, params.endDate)
    }

    if (params.sortBy) {
      const sortOrder = params.sortOrder || 'DESC'
      sql += ` ORDER BY ${params.sortBy} ${sortOrder}`
    }

    if (params.limit) {
      sql += ` LIMIT ${params.limit}`
    }

    db.all(sql, queryParams, (err, results) => {
      if (err) {
        console.error('查询股票数据失败:', err)
        reject({ success: false, error: err.message })
      } else {
        resolve({ success: true, data: results })
      }
    })
  })
}

// 查询技术指标数据
export async function getIndicatorData(params = {}) {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM indicators WHERE 1=1'
    const queryParams = []

    if (params.code) {
      sql += ' AND code = ?'
      queryParams.push(params.code)
    }

    if (params.date) {
      sql += ' AND date = ?'
      queryParams.push(params.date)
    }

    if (params.startDate && params.endDate) {
      sql += ' AND date BETWEEN ? AND ?'
      queryParams.push(params.startDate, params.endDate)
    }

    if (params.sortBy) {
      const sortOrder = params.sortOrder || 'DESC'
      sql += ` ORDER BY ${params.sortBy} ${sortOrder}`
    }

    db.all(sql, queryParams, (err, results) => {
      if (err) {
        console.error('查询技术指标数据失败:', err)
        reject({ success: false, error: err.message })
      } else {
        resolve({ success: true, data: results })
      }
    })
  })
}

// 查询行业概念数据
export async function getSectorData(params = {}) {
  return new Promise((resolve, reject) => {
    const tableName = params.type === 'concept' ? 'concepts' : 'sectors'
    let sql = `SELECT * FROM ${tableName} WHERE 1=1`
    const queryParams = []

    if (params.date) {
      sql += ' AND date = ?'
      queryParams.push(params.date)
    }

    if (params.startDate && params.endDate) {
      sql += ' AND date BETWEEN ? AND ?'
      queryParams.push(params.startDate, params.endDate)
    }

    if (params.name) {
      if (Array.isArray(params.name)) {
        const placeholders = params.name.map(() => '?').join(',')
        sql += ` AND name IN (${placeholders})`
        queryParams.push(...params.name)
      } else {
        sql += ' AND name = ?'
        queryParams.push(params.name)
      }
    }

    if (params.sortBy) {
      const sortOrder = params.sortOrder || 'DESC'
      sql += ` ORDER BY ${params.sortBy} ${sortOrder}`
    }

    db.all(sql, queryParams, (err, results) => {
      if (err) {
        console.error('查询行业概念数据失败:', err)
        reject({ success: false, error: err.message })
      } else {
        resolve({ success: true, data: results })
      }
    })
  })
}

// 获取所有股票代码
export async function getAllStockCodes() {
  return new Promise((resolve, reject) => {
    db.all('SELECT DISTINCT code FROM stocks ORDER BY code', (err, results) => {
      if (err) {
        console.error('获取股票代码失败:', err)
        reject({ success: false, error: err.message })
      } else {
        resolve({ success: true, data: results.map(r => r.code) })
      }
    })
  })
}

// 获取所有行业名称
export async function getAllSectorNames() {
  return new Promise((resolve, reject) => {
    db.all('SELECT DISTINCT name FROM sectors ORDER BY name', (err, results) => {
      if (err) {
        console.error('获取行业名称失败:', err)
        reject({ success: false, error: err.message })
      } else {
        resolve({ success: true, data: results.map(r => r.name) })
      }
    })
  })
}

// 获取所有概念名称
export async function getAllConceptNames() {
  return new Promise((resolve, reject) => {
    db.all('SELECT DISTINCT name FROM concepts ORDER BY name', (err, results) => {
      if (err) {
        console.error('获取概念名称失败:', err)
        reject({ success: false, error: err.message })
      } else {
        resolve({ success: true, data: results.map(r => r.name) })
      }
    })
  })
}

// 获取所有日期
export async function getAllDates() {
  return new Promise((resolve, reject) => {
    db.all('SELECT DISTINCT date FROM quotes ORDER BY date DESC', (err, results) => {
      if (err) {
        console.error('获取日期失败:', err)
        reject({ success: false, error: err.message })
      } else {
        resolve({ success: true, data: results.map(r => r.date) })
      }
    })
  })
}

// 删除指定日期的数据
export async function deleteDataByDate(date, dataType = 'all') {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      if (dataType === 'all' || dataType === 'quotes') {
        db.run('DELETE FROM quotes WHERE date = ?', [date])
      }

      if (dataType === 'all' || dataType === 'indicators') {
        db.run('DELETE FROM indicators WHERE date = ?', [date])
      }

      if (dataType === 'all' || dataType === 'sectors') {
        db.run('DELETE FROM sectors WHERE date = ?', [date])
      }

      if (dataType === 'all' || dataType === 'concepts') {
        db.run('DELETE FROM concepts WHERE date = ?', [date])
      }

      resolve({ success: true })
    })
  })
}

// 获取记录数量
export async function getRecordCount() {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM quotes', (err, quoteResult) => {
      if (err) {
        reject({ success: false, error: err.message })
        return
      }

      db.get('SELECT COUNT(*) as count FROM indicators', (err, indicatorResult) => {
        if (err) {
          reject({ success: false, error: err.message })
          return
        }

        db.get('SELECT COUNT(*) as count FROM sectors', (err, sectorResult) => {
          if (err) {
            reject({ success: false, error: err.message })
            return
          }

          db.get('SELECT COUNT(*) as count FROM concepts', (err, conceptResult) => {
            if (err) {
              reject({ success: false, error: err.message })
              return
            }

            db.get('SELECT COUNT(*) as count FROM stocks', (err, stockResult) => {
              if (err) {
                reject({ success: false, error: err.message })
                return
              }

              resolve({
                success: true,
                data: {
                  total: quoteResult.count + indicatorResult.count + sectorResult.count + conceptResult.count,
                  quotes: quoteResult.count,
                  indicators: indicatorResult.count,
                  sectors: sectorResult.count,
                  concepts: conceptResult.count,
                  stocks: stockResult.count
                }
              })
            })
          })
        })
      })
    })
  })
}

// 获取股票列表
export async function getStockList() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM stocks ORDER BY code', (err, results) => {
      if (err) {
        console.error('获取股票列表失败:', err)
        reject({ success: false, error: err.message })
      } else {
        resolve({ success: true, data: results })
      }
    })
  })
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
  return new Promise((resolve, reject) => {
    db.all('SELECT DISTINCT industry FROM stocks WHERE industry IS NOT NULL AND industry != "" ORDER BY industry', (err, results) => {
      if (err) {
        console.error('获取行业列表失败:', err)
        reject({ success: false, error: err.message })
      } else {
        resolve({ success: true, data: results.map(r => r.industry) })
      }
    })
  })
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
  if (db) {
    db.close()
    db = null
  }
}
