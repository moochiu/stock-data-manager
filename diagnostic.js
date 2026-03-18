// 诊断脚本 - 在浏览器控制台中运行

console.log('=== 开始诊断 ===');

// 1. 检查浏览器环境
console.log('1. 浏览器环境:');
console.log('   - User Agent:', navigator.userAgent);
console.log('   - Platform:', navigator.platform);
console.log('   - 是否支持 WebAssembly:', typeof WebAssembly !== 'undefined');

// 2. 检查localStorage
console.log('2. LocalStorage:');
console.log('   - 可用:', typeof localStorage !== 'undefined');
console.log('   - stock_data_db存在:', localStorage.getItem('stock_data_db') ? '是' : '否');

// 3. 检查全局变量
console.log('3. 全局变量:');
console.log('   - window.require存在:', typeof window.require !== 'undefined');

// 4. 测试sql.js导入
console.log('4. 测试sql.js导入:');
import initSqlJs from 'sql.js/dist/sql-wasm.js'
  .then(initSqlJs => {
    console.log('   ✅ sql.js导入成功');
    console.log('   - initSqlJs类型:', typeof initSqlJs);
    console.log('   - initSqlJs:', initSqlJs);

    // 测试初始化
    return initSqlJs({
      locateFile: (file) => {
        console.log(`   - 请求WASM文件: ${file}`);
        return `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`;
      }
    });
  })
  .then(SQL => {
    console.log('   ✅ SQL.js初始化成功');
    console.log('   - SQL类型:', typeof SQL);

    const db = new SQL.Database();
    console.log('   ✅ 数据库创建成功');

    db.run('CREATE TABLE test (id INTEGER, name TEXT)');
    db.run('INSERT INTO test VALUES (1, "测试")');
    const result = db.exec('SELECT * FROM test');
    console.log('   ✅ 查询成功:', result);

    console.log('=== 诊断完成 - 所有测试通过 ===');
  })
  .catch(error => {
    console.error('   ❌ 错误:', error.message);
    console.error('   - 错误堆栈:', error.stack);
    console.log('=== 诊断完成 - 发现错误 ===');
  });
