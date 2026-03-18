import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'

console.log('开始初始化Vue应用...')

try {
  const app = createApp(App)
  console.log('Vue应用创建成功')

  app.use(ElementPlus)
  console.log('ElementPlus注册成功')

  // 注册所有图标
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }
  console.log('图标注册成功')

  app.mount('#app')
  console.log('Vue应用挂载成功')
} catch (error) {
  console.error('初始化失败:', error)
}
