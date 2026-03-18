const Database = require('better-sqlite3')
const path = require('path')
const { app } = require('electron')

// 数据库路径
const dbPath = path.join(app.getPath('userData'), 'stock_data.db')

// 创建数据库连接
const db = new Database(dbPath)

// 启用外键约束
db.pragma('foreign_keys = ON')

// 创建股票基础信息表
db.exec(`
  CREATE TABLE IF NOT EXISTS stocks (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    industry VARCHAR(50)
  )
`)

// 创建每日行情数据表
db.exec(`
  CREATE TABLE IF NOT EXISTS daily_quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    price DECIMAL(10,2),
    change_percent DECIMAL(8,4),
    change_value DECIMAL(10,2),
    turnover_rate DECIMAL(8,4),
    open_price DECIMAL(10,2),
    close_yesterday DECIMAL(10,2),
    amount DECIMAL(15,2),
    pe_ratio DECIMAL(10,2),
    main_net_amount DECIMAL(15,2),
    low_price DECIMAL(10,2),
    high_price DECIMAL(10,2),
    rise_5d DECIMAL(8,4),
    rise_10d DECIMAL(8,4),
    rise_20d DECIMAL(8,4),
    total_market_cap DECIMAL(15,2),
    circulation_market_cap DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(code, date),
    FOREIGN KEY (code) REFERENCES stocks(code) ON DELETE CASCADE
  )
`)

// 创建技术指标表
db.exec(`
  CREATE TABLE IF NOT EXISTS technical_indicators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    ma5 DECIMAL(10,2),
    ma10 DECIMAL(10,2),
    ma20 DECIMAL(10,2),
    ma30 DECIMAL(10,2),
    macd DECIMAL(10,4),
    macd_diff DECIMAL(10,4),
    macd_dea DECIMAL(10,4),
    rsi6 DECIMAL(8,2),
    rsi12 DECIMAL(8,2),
    rsi24 DECIMAL(8,2),
    kdj_k DECIMAL(8,2),
    kdj_d DECIMAL(8,2),
    kdj_j DECIMAL(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(code, date),
    FOREIGN KEY (code) REFERENCES stocks(code) ON DELETE CASCADE
  )
`)

// 创建索引
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_daily_quotes_date ON daily_quotes(date);
  CREATE INDEX IF NOT EXISTS idx_daily_quotes_code ON daily_quotes(code);
  CREATE INDEX IF NOT EXISTS idx_technical_indicators_date ON technical_indicators(date);
  CREATE INDEX IF NOT EXISTS idx_technical_indicators_code ON technical_indicators(code);
`)

console.log('数据库初始化完成')

module.exports = db
