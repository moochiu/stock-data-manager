// IndexedDB持久化存储模块
// 用于将sql.js的数据库数据持久化到IndexedDB

import { openDB } from 'idb'

const DB_NAME = 'StockDataManagerDB'
const DB_VERSION = 1
const STORE_NAME = 'database'

// 打开IndexedDB
export async function openIndexedDB() {
  return await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 创建数据库存储对象
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

// 保存数据库到IndexedDB
export async function saveDatabaseToIndexedDB(db) {
  try {
    const idb = await openIndexedDB()
    
    // 导出sql.js数据库为二进制数组
    const data = db.export()
    const binaryArray = new Uint8Array(data)
    
    // 保存到IndexedDB
    await idb.put(STORE_NAME, binaryArray, 'main')
    
    console.log('数据库已保存到IndexedDB,大小:', (binaryArray.length / 1024 / 1024).toFixed(2), 'MB')
    
    await idb.close()
    return true
  } catch (error) {
    console.error('保存数据库到IndexedDB失败:', error)
    return false
  }
}

// 从IndexedDB加载数据库
export async function loadDatabaseFromIndexedDB(SQL) {
  try {
    const idb = await openIndexedDB()
    
    // 从IndexedDB读取数据
    const data = await idb.get(STORE_NAME, 'main')
    
    await idb.close()
    
    if (!data) {
      console.log('IndexedDB中没有保存的数据库')
      return null
    }
    
    console.log('从IndexedDB加载数据库,大小:', (data.length / 1024 / 1024).toFixed(2), 'MB')

    // sql.js直接从二进制数据创建数据库
    const db = new SQL.Database(new Uint8Array(data))

    return db
  } catch (error) {
    console.error('从IndexedDB加载数据库失败:', error)
    return null
  }
}

// 检查IndexedDB中是否有保存的数据库
export async function hasSavedDatabase() {
  try {
    const idb = await openIndexedDB()
    const data = await idb.get(STORE_NAME, 'main')
    await idb.close()
    return data !== undefined
  } catch (error) {
    console.error('检查IndexedDB失败:', error)
    return false
  }
}

// 删除IndexedDB中的数据库
export async function clearDatabaseFromIndexedDB() {
  try {
    const idb = await openIndexedDB()
    await idb.delete(STORE_NAME, 'main')
    await idb.close()
    console.log('已删除IndexedDB中的数据库')
    return true
  } catch (error) {
    console.error('删除IndexedDB中的数据库失败:', error)
    return false
  }
}

// 获取数据库大小
export async function getDatabaseSize() {
  try {
    const idb = await openIndexedDB()
    const data = await idb.get(STORE_NAME, 'main')
    await idb.close()
    
    if (!data) return 0
    
    return data.length
  } catch (error) {
    console.error('获取数据库大小失败:', error)
    return 0
  }
}
