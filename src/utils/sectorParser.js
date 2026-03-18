import * as XLSX from 'xlsx'
import Papa from 'papaparse'

// 解析行业/概念板块数据
export function parseSectorConceptData(file, type, manualDate = null) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target.result
        let result = []

        // 从文件名提取日期(格式: 2026-03-12 或 20260312)
        let extractedDate = null
        if (!manualDate) {
          const dateMatch = file.name.match(/(\d{4})[-_]?(\d{2})[-_]?(\d{2})/)
          if (dateMatch) {
            extractedDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
          }
        }

        // 使用手动日期或提取的日期,默认为今天
        const date = manualDate || extractedDate || new Date().toISOString().split('T')[0]

        // 判断文件类型
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // Excel文件
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const json = XLSX.utils.sheet_to_json(worksheet, { raw: false })

          result = parseExcelData(json, type, date)
        } else if (file.name.endsWith('.csv')) {
          // CSV文件
          Papa.parse(file, {
            complete: (results) => {
              const csvData = results.data
              result = parseCSVData(csvData, type, date)
              resolve(result)
            },
            error: (error) => {
              reject(error)
            }
          })
          return
        } else {
          reject(new Error('不支持的文件格式'))
          return
        }

        resolve(result)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.readAsBinaryString(file)
    } else {
      reader.readAsText(file)
    }
  })
}

// 解析Excel数据
function parseExcelData(data, type, date) {
  if (!data || data.length === 0) return []

  const result = []

  // 跳过标题行,从第二行开始
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (!row || Object.keys(row).length === 0) continue

    try {
      const item = {
        type: type, // 'sector' 或 'concept'
        date: date,
        serial_number: parseNumber(row['序号']),
        name: row['行业']?.trim() || '',
        index_value: parseNumber(row['行业指数']),
        change_percent: parsePercent(row['涨跌幅']),
        inflow_amount: parseNumber(row['流入资金(亿)']),
        outflow_amount: parseNumber(row['流出资金(亿)']),
        net_amount: parseNumber(row['净额(亿)']),
        company_count: parseNumber(row['公司家数']),
        leading_stock: row['领涨股']?.trim() || '',
        leading_stock_change: parsePercent(row['涨跌幅.1']),
        leading_stock_price: parseNumber(row['当前价(元)'])
      }

      if (item.name) {
        result.push(item)
      }
    } catch (error) {
      console.error(`解析第${i + 1}行数据失败:`, error)
    }
  }

  return result
}

// 解析CSV数据
function parseCSVData(data, type, date) {
  if (!data || data.length < 2) return []

  const result = []

  // 第一行是标题
  const headers = data[0].map(h => h.trim())

  // 创建字段映射
  const fieldMap = {}
  headers.forEach((h, index) => {
    if (h === '序号') fieldMap.serial_number = index
    else if (h === '行业') fieldMap.name = index
    else if (h === '行业指数') fieldMap.index_value = index
    else if (h === '涨跌幅') fieldMap.change_percent = index
    else if (h === '流入资金(亿)') fieldMap.inflow_amount = index
    else if (h === '流出资金(亿)') fieldMap.outflow_amount = index
    else if (h === '净额(亿)') fieldMap.net_amount = index
    else if (h === '公司家数') fieldMap.company_count = index
    else if (h === '领涨股') fieldMap.leading_stock = index
    else if (h === '涨跌幅.1') fieldMap.leading_stock_change = index
    else if (h === '当前价(元)') fieldMap.leading_stock_price = index
  })

  // 从第二行开始解析数据
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length === 0) continue

    try {
      const item = {
        type: type,
        date: date,
        serial_number: parseNumber(row[fieldMap.serial_number]),
        name: row[fieldMap.name]?.trim() || '',
        index_value: parseNumber(row[fieldMap.index_value]),
        change_percent: parsePercent(row[fieldMap.change_percent]),
        inflow_amount: parseNumber(row[fieldMap.inflow_amount]),
        outflow_amount: parseNumber(row[fieldMap.outflow_amount]),
        net_amount: parseNumber(row[fieldMap.net_amount]),
        company_count: parseNumber(row[fieldMap.company_count]),
        leading_stock: row[fieldMap.leading_stock]?.trim() || '',
        leading_stock_change: parsePercent(row[fieldMap.leading_stock_change]),
        leading_stock_price: parseNumber(row[fieldMap.leading_stock_price])
      }

      if (item.name) {
        result.push(item)
      }
    } catch (error) {
      console.error(`解析第${i + 1}行数据失败:`, error)
    }
  }

  return result
}

// 解析数字
function parseNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }
  const num = parseFloat(value.toString().replace(/,/g, ''))
  return isNaN(num) ? null : num
}

// 解析百分比
function parsePercent(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }
  const str = value.toString().replace('%', '').trim()
  const num = parseFloat(str)
  return isNaN(num) ? null : num
}
