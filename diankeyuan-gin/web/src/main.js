import './style/element_visiable.scss'
import 'element-plus/theme-chalk/dark/css-vars.css'
import { createApp } from 'vue'
import ElementPlus from 'element-plus'

import 'element-plus/dist/index.css'
// 引入gin-vue-admin前端初始化相关内容
import './core/gin-vue-admin'
// 引入封装的router
import router from '@/router/index'
import '@/permission'
import run from '@/core/gin-vue-admin.js'
import auth from '@/directive/auth'
import { store } from '@/pinia'
import App from './App.vue'
// 消除警告
import 'default-passive-events'

// 预加载节能模块数据
async function preloadEnergySavingData() {
  console.log('开始在应用挂载前预加载节能分析数据...')
  
  // 定义所有需要预加载的数据
  const buildings = ['A', 'B', 'C', 'D']
  const timeTypes = ['daily', 'monthly', 'yearly']
  const resultsCache = {}
  
  try {
    // 首先加载最重要的A楼栋日视图数据（用户首次看到的数据）
    const priorityResponse = await fetch(`/express/energy-saving/chart?building=A&timeType=daily`)
    const priorityResult = await priorityResponse.json()
    
    if (priorityResult.success && priorityResult.data) {
      resultsCache['A_daily'] = priorityResult.data
      // 存储到sessionStorage以便快速访问
      sessionStorage.setItem('energySavingData_A_daily', JSON.stringify(priorityResult.data))
      console.log('A楼栋日视图数据预加载完成')
    }
    
    // 同时加载A楼栋的用电占比数据
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    const usageResponse = await fetch(`/express/energy-saving/usage-distribution?building=A&timeType=day&date=${yesterdayStr}`)
    const usageResult = await usageResponse.json()
    
    if (usageResult.success && usageResult.data) {
      resultsCache['A_usage_day'] = usageResult.data
      // 存储到sessionStorage
      sessionStorage.setItem('energySavingData_A_usage_day', JSON.stringify(usageResult.data))
      console.log('A楼栋用电占比数据预加载完成')
    }
    
    // 在后台异步加载其他数据，不阻塞应用启动
    setTimeout(async () => {
      try {
        const promises = []
        
        // 添加其他楼栋图表数据的加载请求
        for (const building of buildings) {
          for (const timeType of timeTypes) {
            // 跳过已加载的A楼栋日视图
            if (building === 'A' && timeType === 'daily') continue
            
            const promise = fetch(`/express/energy-saving/chart?building=${building}&timeType=${timeType}`)
              .then(response => response.json())
              .then(result => {
                if (result.success && result.data) {
                  const key = `${building}_${timeType}`
                  resultsCache[key] = result.data
                  sessionStorage.setItem(`energySavingData_${key}`, JSON.stringify(result.data))
                  console.log(`${building}楼栋${timeType}视图数据预加载完成`)
                }
              })
              .catch(error => console.error(`预加载${building}楼栋${timeType}视图数据失败:`, error))
            
            promises.push(promise)
          }
        }
        
        // 批量处理所有请求
        await Promise.allSettled(promises)
        console.log('所有楼栋图表数据预加载完成')
        
        // 预加载剩余的用电占比数据
        const currentMonth = new Date().toISOString().slice(0, 7)
        const usagePromises = []
        
        for (const building of buildings) {
          // 跳过已加载的A楼栋日视图
          if (building === 'A') continue
          
          // 日视图用电占比
          const dayPromise = fetch(`/express/energy-saving/usage-distribution?building=${building}&timeType=day&date=${yesterdayStr}`)
            .then(response => response.json())
            .then(result => {
              if (result.success && result.data) {
                const key = `${building}_usage_day`
                resultsCache[key] = result.data
                sessionStorage.setItem(`energySavingData_${key}`, JSON.stringify(result.data))
              }
            })
            .catch(error => console.error(`预加载${building}楼栋日视图用电占比数据失败:`, error))
          
          // 月视图用电占比
          const monthPromise = fetch(`/express/energy-saving/usage-distribution?building=${building}&timeType=month&date=${currentMonth}`)
            .then(response => response.json())
            .then(result => {
              if (result.success && result.data) {
                const key = `${building}_usage_month`
                resultsCache[key] = result.data
                sessionStorage.setItem(`energySavingData_${key}`, JSON.stringify(result.data))
              }
            })
            .catch(error => console.error(`预加载${building}楼栋月视图用电占比数据失败:`, error))
          
          usagePromises.push(dayPromise, monthPromise)
        }
        
        await Promise.allSettled(usagePromises)
        console.log('所有用电占比数据预加载完成')
        
        // 通知store预加载已完成
        if (store && store.energySaving) {
          store.energySaving.isDataPreloaded = true
        }
      } catch (error) {
        console.error('后台数据预加载过程中发生错误:', error)
      }
    }, 100) // 短暂延迟后开始后台预加载，不阻塞应用启动
    
    console.log('主要节能数据预加载完成，可以挂载应用')
    return resultsCache
  } catch (error) {
    console.error('节能数据预加载失败:', error)
    return null
  }
}

// 预加载数据并启动应用
preloadEnergySavingData().then(() => {
  const app = createApp(App)
  app.config.productionTip = false

  app.use(run).use(ElementPlus).use(store).use(auth).use(router).mount('#app')
})
