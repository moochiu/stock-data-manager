import * as XLSX from 'xlsx'
import Papa from 'papaparse'

// 导出为Excel (支持Electron文件保存对话框)
export async function exportToExcel(data, fileName) {
  try {
    // 创建工作簿
    const workbook = XLSX.utils.book_new()

    // 如果数据包含行情数据
    if (data.quotes && data.quotes.length > 0) {
      const quoteSheet = XLSX.utils.json_to_sheet(data.quotes)
      XLSX.utils.book_append_sheet(workbook, quoteSheet, '行情数据')
    }

    // 如果数据包含技术指标数据
    if (data.indicators && data.indicators.length > 0) {
      const indicatorSheet = XLSX.utils.json_to_sheet(data.indicators)
      XLSX.utils.book_append_sheet(workbook, indicatorSheet, '技术指标')
    }

    // 如果数据是合并的完整数据
    if (data.merged && data.merged.length > 0) {
      const mergedSheet = XLSX.utils.json_to_sheet(data.merged)
      XLSX.utils.book_append_sheet(workbook, mergedSheet, '完整数据')
    }

    // 检查是否在Electron环境中
    if (window.electronAPI && window.electronAPI.saveFile) {
      // 使用Electron的文件保存对话框
      console.log('使用Electron文件保存对话框')
      const result = await window.electronAPI.saveFile(fileName)
      console.log('文件保存对话框结果:', result)
      
      if (!result.canceled && result.filePath) {
        // 在Electron环境中，需要使用Node.js的fs模块写入文件
        const fs = window.nodeRequire ? window.nodeRequire.fs : null
        if (fs) {
          // 将workbook转换为buffer
          const buffer = XLSX.write(workbook, { type: 'buffer' })
          fs.writeFileSync(result.filePath, buffer)
          console.log('Excel文件保存成功:', result.filePath)
          return true
        }
      } else {
        console.log('用户取消了保存')
      }
      return false
    } else {
      // 在浏览器环境中，使用默认下载
      console.log('使用浏览器默认下载')
      XLSX.writeFile(workbook, fileName)
      return true
    }
  } catch (error) {
    console.error('Excel导出失败:', error)
    throw error
  }
}

// 导出为CSV (支持Electron文件保存对话框)
export async function exportToCSV(data, fileName) {
  try {
    let csvContent = ''

    // 如果数据包含行情数据
    if (data.quotes && data.quotes.length > 0) {
      const quoteCSV = Papa.unparse(data.quotes)
      csvContent += '行情数据\n' + quoteCSV + '\n\n'
    }

    // 如果数据包含技术指标数据
    if (data.indicators && data.indicators.length > 0) {
      const indicatorCSV = Papa.unparse(data.indicators)
      csvContent += '技术指标数据\n' + indicatorCSV + '\n\n'
    }

    // 如果数据是合并的完整数据
    if (data.merged && data.merged.length > 0) {
      const mergedCSV = Papa.unparse(data.merged)
      csvContent += '完整数据\n' + mergedCSV
    }

    // 检查是否在Electron环境中
    if (window.electronAPI && window.electronAPI.saveFile) {
      // 使用Electron的文件保存对话框
      console.log('使用Electron文件保存对话框')
      const result = await window.electronAPI.saveFile(fileName)
      console.log('文件保存对话框结果:', result)
      
      if (!result.canceled && result.filePath) {
        // 在Electron环境中，需要使用Node.js的fs模块写入文件
        const fs = window.nodeRequire ? window.nodeRequire.fs : null
        if (fs) {
          fs.writeFileSync(result.filePath, csvContent, 'utf-8')
          console.log('CSV文件保存成功:', result.filePath)
          return true
        }
      } else {
        console.log('用户取消了保存')
      }
      return false
    } else {
      // 在浏览器环境中,使用Blob下载
      console.log('使用浏览器默认下载')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', fileName)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      return true
    }
  } catch (error) {
    console.error('CSV导出失败:', error)
    throw error
  }
}

// 格式化导出数据
export function formatExportData(quotes, indicators = null) {
  const formattedQuotes = quotes.map(q => ({
    '股票代码': q.code,
    '股票名称': q.name,
    '日期': q.date,
    '现价': q.price,
    '涨幅%': q.change_percent ? `${q.change_percent}%` : '',
    '涨跌': q.change_value,
    '换手率%': q.turnover_rate ? `${q.turnover_rate}%` : '',
    '开盘价': q.open_price,
    '昨收价': q.close_yesterday,
    '成交额(亿)': q.amount,
    '市盈率(动态)': q.pe_ratio,
    '主力净额(亿)': q.main_net_amount,
    '最低价': q.low_price,
    '最高价': q.high_price,
    '5日涨幅%': q.rise_5d ? `${q.rise_5d}%` : '',
    '10日涨幅%': q.rise_10d ? `${q.rise_10d}%` : '',
    '20日涨幅%': q.rise_20d ? `${q.rise_20d}%` : '',
    '总市值(亿)': q.total_market_cap,
    '流通市值(亿)': q.circulation_market_cap,
    '所属行业': q.industry
  }))

  let formattedIndicators = []
  let mergedData = []

  if (indicators && indicators.length > 0) {
    formattedIndicators = indicators.map(i => ({
      '股票代码': i.code,
      '日期': i.date,
      'MA5': i.ma5,
      'MA10': i.ma10,
      'MA20': i.ma20,
      'MA30': i.ma30,
      'MACD': i.macd,
      'MACD.DIFF': i.macd_diff,
      'MACD.DEA': i.macd_dea,
      'RSI6': i.rsi6,
      'RSI12': i.rsi12,
      'RSI24': i.rsi24,
      'KDJ_K': i.kdj_k,
      'KDJ_D': i.kdj_d,
      'KDJ_J': i.kdj_j
    }))

    // 合并数据
    mergedData = quotes.map(q => {
      const indicator = indicators.find(i => i.code === q.code && i.date === q.date)
      return {
        ...formattedQuotes.find(fq => fq['股票代码'] === q.code),
        ...(indicator ? formattedIndicators.find(fi => fi['股票代码'] === q.code) : {})
      }
    })
  }

  return {
    quotes: formattedQuotes,
    indicators: formattedIndicators,
    merged: mergedData
  }
}

// 按股票分组导出
export function exportByStock(quotes, indicators = null) {
  const stockMap = new Map()

  // 按股票分组行情数据
  quotes.forEach(q => {
    if (!stockMap.has(q.code)) {
      stockMap.set(q.code, {
        code: q.code,
        name: q.name,
        industry: q.industry,
        quotes: [],
        indicators: []
      })
    }
    stockMap.get(q.code).quotes.push(q)
  })

  // 按股票分组技术指标数据
  if (indicators) {
    indicators.forEach(i => {
      if (stockMap.has(i.code)) {
        stockMap.get(i.code).indicators.push(i)
      }
    })
  }

  return Array.from(stockMap.values())
}

// 生成导出文件名
export function generateFileName(prefix, dateRange = null) {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-')

  let fileName = `${prefix}_${dateStr}_${timeStr}`

  if (dateRange && dateRange.start && dateRange.end) {
    fileName += `_${dateRange.start}_to_${dateRange.end}`
  }

  return fileName
}
