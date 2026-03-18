<template>
  <div id="app">
    <h1>测试页面</h1>
    <p>如果你能看到这个页面，说明Vue加载成功</p>
    <el-button type="primary">测试按钮</el-button>
    <hr>
    <h2>测试DataImport组件</h2>
    <DataImport />
  </div>
</template>

<script setup>
import DataImport from './components/DataImport.vue'
console.log('测试页面已加载')
</script>

<style>
#app {
  padding: 20px;
}
</style>
