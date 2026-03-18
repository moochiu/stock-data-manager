const Papa = require('papaparse')
const XLSX = require('xlsx')

// 数据格式识别和解析器
class DataParser {
  // 检测数据格式
  static detectFormat(data) {
    if (!data || data.trim() === '') {
      return 'unknown'
    }

    // 检查是否是Excel文件（二进制数据）
    if (data instanceof ArrayBuffer || data instanceof Buffer) {
      return 'excel'
    }

    // 检查是否是CSV格式
    const lines = data.trim().split('\n')
    if (lines.length > 0) {
      const firstLine = lines[0]
      // CSV通常包含逗号分隔符
      if (firstLine.includes(',')) {
        return 'csv'
      }
      // 表格文本通常包含制表符或多个空格
      if (firstLine.includes('\t') || /\s{2,}/.test(firstLine)) {
        return 'table'
      }
    }

    return 'text'
  }

  // 解析表格文本数据
  static parseTableText(text) {
    const lines = text.trim().split('\n').filter(line => line.trim())
    if (lines.length < 2) return { type: 'unknown', data: [] }

    // 判断是基础行情数据还是技术指标数据
    const firstLine = lines[0]
    const isTechnicalData = firstLine.includes('MA5') || firstLine.includes('MACD') ||
                           firstLine.includes('RSI') || firstLine.includes('KDJ')

    if (isTechnicalData) {
      return this.parseTechnicalTableText(lines)
    } else {
      return this.parseQuoteTableText(lines)
    }
  }

  // 解析基础行情表格文本
  static parseQuoteTableText(lines) {
    try {
      // 查找表头行
      let headerIndex = -1
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('代码') && lines[i].includes('名称')) {
          headerIndex = i
          break
        }
      }

      if (headerIndex === -1) {
        return { type: 'unknown', data: [] }
      }

      // 解析表头
      const header = this.parseTableRow(lines[headerIndex])
      const data = []

      // 解析数据行
      for (let i = headerIndex + 1; i < lines.length; i++) {
        const row = this.parseTableRow(lines[i])
        if (row.length >= 2) { // 至少有代码和名称
          const rowData = {}
          header.forEach((key, index) => {
            rowData[key] = row[index] || null
          })
          data.push(rowData)
        }
      }

      return { type: 'quote', data, headers: header }
    } catch (error) {
      console.error('解析基础行情数据失败:', error)
      return { type: 'error', message: error.message }
    }
  }

  // 解析技术指标表格文本
  static parseTechnicalTableText(lines) {
    try {
      // 查找表头行
      let headerIndex = -1
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('MA5') || lines[i].includes('MACD')) {
          headerIndex = i
          break
        }
      }

      if (headerIndex === -1) {
        return { type: 'unknown', data: [] }
      }

      // 解析表头
      const header = this.parseTableRow(lines[headerIndex])
      const data = []

      // 解析数据行
      for (let i = headerIndex + 1; i < lines.length; i++) {
        const row = this.parseTableRow(lines[i])
        if (row.length >= 2) { // 至少有名称和第一个指标
          const rowData = {}
          header.forEach((key, index) => {
            rowData[key] = row[index] || null
          })
          data.push(rowData)
        }
      }

      return { type: 'technical', data, headers: header }
    } catch (error) {
      console.error('解析技术指标数据失败:', error)
      return { type: 'error', message: error.message }
    }
  }

  // 解析单行表格数据
  static parseTableRow(line) {
    // 移除表格边框字符
    let cleanLine = line.replace(/[│|├┼┤┌┐└┘─]/g, '')
    // 处理Markdown表格格式
    cleanLine = cleanLine.replace(/^\||\|$/g, '')
    // 分割列
    return cleanLine.split('|').map(cell => cell.trim()).filter(cell => cell !== '')
  }

  // 解析CSV数据
  static parseCSV(csvText) {
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || []
          const data = results.data
          resolve({ type: 'csv', data, headers })
        },
        error: (error) => {
          reject({ type: 'error', message: error.message })
        }
      })
    })
  }

  // 解析Excel数据
  static parseExcel(buffer) {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]

      // 转换为JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      if (jsonData.length < 2) {
        return { type: 'unknown', data: [] }
      }

      const headers = jsonData[0]
      const data = []

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i]
        if (row.length > 0) {
          const rowData = {}
          headers.forEach((key, index) => {
            rowData[key] = row[index] || null
          })
          data.push(rowData)
        }
      }

      // 判断数据类型
      const hasTechnicalFields = headers.some(h =>
        h.includes('MA') || h.includes('MACD') || h.includes('RSI') || h.includes('KDJ')
      )

      return {
        type: hasTechnicalFields ? 'technical' : 'quote',
        data,
        headers
      }
    } catch (error) {
      console.error('解析Excel数据失败:', error)
      return { type: 'error', message: error.message }
    }
  }

  // 清洗和转换数据
  static cleanAndConvertData(parsedData, date) {
    const { type, data, headers } = parsedData

    if (type === 'quote') {
      return this.cleanQuoteData(data, date)
    } else if (type === 'technical') {
      return this.cleanTechnicalData(data, date)
    } else {
      return { stocks: [], quotes: [], indicators: [] }
    }
  }

  // 清洗基础行情数据
  static cleanQuoteData(data, date) {
    const stocks = []
    const quotes = []

    data.forEach(item => {
      // 提取股票代码和名称
      let code = item['代码'] || item['code'] || item['Code']
      let name = item['名称'] || item['name'] || item['Name']

      if (!code || !name) return

      // 清洗代码（移除特殊字符）
      code = code.toString().trim().replace(/[^0-9]/g, '')
      name = name.toString().trim()

      // 股票基础信息
      stocks.push({
        code,
        name,
        industry: item['所属行业'] || item['industry'] || null
      })

      // 清洗数值数据
      const cleanNumber = (value) => {
        if (value === null || value === undefined || value === '' || value === 'None') return null
        if (typeof value === 'number') return value
        const str = value.toString().trim()
        if (str === '' || str === '-' || str === 'None' || str === '亏损') return null
        // 移除百分号和其他符号
        const cleaned = str.replace(/[%,\s\u4e00-\u9fa5]/g, '')
        const num = parseFloat(cleaned)
        return isNaN(num) ? null : num
      }

      quotes.push({
        code,
        date,
        price: cleanNumber(item['现价'] || item['price']),
        change_percent: cleanNumber(item['涨幅%'] || item['涨幅']),
        change_value: cleanNumber(item['涨跌'] || item['change']),
        turnover_rate: cleanNumber(item['换手%'] || item['换手率']),
        open_price: cleanNumber(item['开盘'] || item['open']),
        close_yesterday: cleanNumber(item['昨收'] || item['昨收']),
        amount: this.cleanAmount(item['成交额(亿)'] || item['成交额']),
        pe_ratio: cleanNumber(item['市盈(动)'] || item['市盈率']),
        main_net_amount: cleanNumber(item['主力净额(亿)'] || item['主力净额']),
        low_price: cleanNumber(item['最低'] || item['low']),
        high_price: cleanNumber(item['最高'] || item['high']),
        rise_5d: cleanNumber(item['5日涨幅%'] || item['5日涨幅']),
        rise_10d: cleanNumber(item['10日涨幅%'] || item['10日涨幅']),
        rise_20d: cleanNumber(item['20日涨幅%'] || item['20日涨幅']),
        total_market_cap: cleanNumber(item['总市值(亿)'] || item['总市值']),
        circulation_market_cap: cleanNumber(item['流通市值(亿)'] || item['流通市值'])
      })
    })

    return { stocks, quotes }
  }

  // 清洗技术指标数据
  static cleanTechnicalData(data, date) {
    const indicators = []

    data.forEach(item => {
      // 提取股票名称或代码
      let code = item['代码'] || item['code'] || item['Code']
      let name = item['名称'] || item['name'] || item['Name']

      if (!name) return

      // 如果只有名称，需要通过名称查找代码（这里简化处理）
      if (!code) {
        // 实际应用中需要通过名称映射查找代码
        code = name // 临时使用名称作为标识
      }

      code = code.toString().trim()

      // 清洗数值数据
      const cleanNumber = (value) => {
        if (value === null || value === undefined || value === '' || value === 'None') return null
        if (typeof value === 'number') return value
        const str = value.toString().trim()
        if (str === '' || str === '-' || str === 'None') return null
        const num = parseFloat(str)
        return isNaN(num) ? null : num
      }

      indicators.push({
        code,
        name,
        date,
        ma5: cleanNumber(item['MA5']),
        ma10: cleanNumber(item['MA10']),
        ma20: cleanNumber(item['MA20']),
        ma30: cleanNumber(item['MA30']),
        macd: cleanNumber(item['MACD']),
        macd_diff: cleanNumber(item['DIFF']),
        macd_dea: cleanNumber(item['DEA']),
        rsi6: cleanNumber(item['RSI6']),
        rsi12: cleanNumber(item['RSI12']),
        rsi24: cleanNumber(item['RSI24']),
        kdj_k: cleanNumber(item['KDJ_K']),
        kdj_d: cleanNumber(item['KDJ_D']),
        kdj_j: cleanNumber(item['KDJ_J'])
      })
    })

    return { indicators }
  }

  // 清洗成交额（处理"亿"、"万"等单位）
  static cleanAmount(value) {
    if (value === null || value === undefined || value === '' || value === 'None') return null
    if (typeof value === 'number') return value

    const str = value.toString().trim()
    if (str === '' || str === '-' || str === 'None') return null

    let numStr = str.replace(/[,\s]/g, '')

    if (numStr.includes('亿')) {
      numStr = numStr.replace('亿', '')
      const num = parseFloat(numStr)
      return isNaN(num) ? null : num * 100000000
    } else if (numStr.includes('万')) {
      numStr = numStr.replace('万', '')
      const num = parseFloat(numStr)
      return isNaN(num) ? null : num * 10000
    } else {
      const num = parseFloat(numStr)
      return isNaN(num) ? null : num
    }
  }
}

module.exports = DataParser
