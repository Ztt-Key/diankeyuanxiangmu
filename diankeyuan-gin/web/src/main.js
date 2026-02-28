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

// 预加载节能模块数据（后端未启动时静默跳过，避免控制台刷屏）
async function preloadEnergySavingData() {
  const buildings = ['A', 'B', 'C', 'D']
  const timeTypes = ['daily', 'monthly', 'yearly']
  const resultsCache = {}

  const isNetworkError = (e) => {
    if (!e) return false
    if (e?.code === 'ECONNREFUSED') return true
    if (e?.name === 'AggregateError' && e?.errors?.some?.(err => err?.code === 'ECONNREFUSED')) return true
    if (e?.name === 'TypeError' && typeof e?.message === 'string' && e.message.includes('fetch')) return true
    return false
  }

  try {
    const priorityResponse = await fetch(`/express/energy-saving/chart?building=A&timeType=daily`)
    const priorityResult = await priorityResponse.json()
    
    if (priorityResult.success && priorityResult.data) {
      resultsCache['A_daily'] = priorityResult.data
      sessionStorage.setItem('energySavingData_A_daily', JSON.stringify(priorityResult.data))
    }

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const usageResponse = await fetch(`/express/energy-saving/usage-distribution?building=A&timeType=day&date=${yesterdayStr}`)
    const usageResult = await usageResponse.json()

    if (usageResult.success && usageResult.data) {
      resultsCache['A_usage_day'] = usageResult.data
      sessionStorage.setItem('energySavingData_A_usage_day', JSON.stringify(usageResult.data))
    }

    setTimeout(async () => {
      try {
        const promises = []

        for (const building of buildings) {
          for (const timeType of timeTypes) {
            if (building === 'A' && timeType === 'daily') continue

            const promise = fetch(`/express/energy-saving/chart?building=${building}&timeType=${timeType}`)
              .then(response => response.json())
              .then(result => {
                if (result.success && result.data) {
                  const key = `${building}_${timeType}`
                  resultsCache[key] = result.data
                  sessionStorage.setItem(`energySavingData_${key}`, JSON.stringify(result.data))
                }
              })
              .catch(() => {})

            promises.push(promise)
          }
        }

        await Promise.allSettled(promises)
        
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
            .catch(() => {})

          const monthPromise = fetch(`/express/energy-saving/usage-distribution?building=${building}&timeType=month&date=${currentMonth}`)
            .then(response => response.json())
            .then(result => {
              if (result.success && result.data) {
                const key = `${building}_usage_month`
                resultsCache[key] = result.data
                sessionStorage.setItem(`energySavingData_${key}`, JSON.stringify(result.data))
              }
            })
            .catch(() => {})

          usagePromises.push(dayPromise, monthPromise)
        }

        await Promise.allSettled(usagePromises)

        if (store && store.energySaving) {
          store.energySaving.isDataPreloaded = true
        }
      } catch (_) {}
    }, 100)

    return resultsCache
  } catch (error) {
    if (isNetworkError(error)) return null
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
