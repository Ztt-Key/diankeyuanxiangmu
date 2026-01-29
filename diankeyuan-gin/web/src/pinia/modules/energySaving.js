import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { debounce } from 'lodash'

export const useEnergySavingStore = defineStore('energySaving', () => {
  const chartData = ref(null)
  const usageDistribution = ref(null)
  const aiSummary = ref('')
  const aiLoading = ref(true)
  const currentAIRequest = ref(null)
  const isDataPreloaded = ref(false)
  const buildings = ['A', 'B', 'C', 'D']
  // 首先尝试从sessionStorage获取已预加载的数据
  const loadCachedData = () => {
    try {
      console.log('检查sessionStorage中预加载的数据...')
      // 尝试加载A楼栋的日视图图表数据
      const cachedChartData = sessionStorage.getItem('energySavingData_A_daily')
      if (cachedChartData) {
        const parsedData = JSON.parse(cachedChartData)
        chartData.value = parsedData
        console.log('从缓存加载图表数据成功')
      }

      // 尝试加载A楼栋的用电占比数据
      const cachedUsageData = sessionStorage.getItem('energySavingData_A_usage_day')
      if (cachedUsageData) {
        const parsedData = JSON.parse(cachedUsageData)
        usageDistribution.value = parsedData
        console.log('从缓存加载用电占比数据成功')
      }

      // 根据是否成功加载数据设置预加载状态
      if (chartData.value && usageDistribution.value) {
        isDataPreloaded.value = true
        console.log('从缓存中成功加载全部预加载数据')
        
        // 如果数据已加载，触发AI分析
        debouncedUpdateAI(chartData.value)
        return true
      }
    } catch (error) {
      console.error('从缓存加载数据失败:', error)
    }
    return false
  }

  // 优化的预加载策略 - 预加载所有楼栋的数据
  const preloadAllBuildingsData = async () => {
    console.time('预加载总耗时')
    // 首先尝试从缓存加载数据
    if (loadCachedData()) {
      console.log('使用缓存数据，无需重新预加载')
      console.timeEnd('预加载总耗时')
      return
    }
    
    if (isDataPreloaded.value) {
      console.log('数据已预加载，跳过')
      console.timeEnd('预加载总耗时')
      return
    }
    
    console.log('缓存中无数据，开始预加载节能分析数据...')
    isDataPreloaded.value = true
    
    try {
      // 优先加载当前视图需要的关键数据，确保界面快速显示
      console.log('第一阶段：加载关键数据')
      console.time('关键数据加载耗时')
      
      // 并行加载A楼栋的日视图和用电占比数据
      const [chartResult, usageResult] = await Promise.all([
        preloadBuildingChartData('A', 'daily'),
        preloadUsageDistribution('A', 'day', null)
      ])
      
      console.timeEnd('关键数据加载耗时')
      
      // 在浏览器空闲时间加载次要数据
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          loadSecondaryData()
        }, { timeout: 5000 })
      } else {
        // 兼容不支持requestIdleCallback的浏览器
        setTimeout(() => {
          loadSecondaryData()
        }, 2000)
      }
      
      console.log('关键数据加载完成，界面可以开始渲染')
    } catch (error) {
      console.error('预加载数据失败:', error)
      isDataPreloaded.value = false
    }
  }
  
  // 异步加载次要数据
  const loadSecondaryData = async () => {
    console.log('第二阶段：加载次要数据')
    console.time('次要数据加载耗时')
    
    try {
      // 预加载每个楼栋的所有视图类型数据
      for (const building of buildings) {
        // 跳过已加载的A楼栋-日视图组合
        if (building === 'A') {
          // 只加载A楼栋的月视图和年视图
          await Promise.all([
            preloadBuildingChartData('A', 'monthly'), 
            preloadBuildingChartData('A', 'yearly')
          ])
        } else {
          // 对其他楼栋，并行加载所有视图类型
          await Promise.all([
            preloadBuildingChartData(building, 'daily'),
            preloadBuildingChartData(building, 'monthly'),
            preloadBuildingChartData(building, 'yearly')
          ])
        }
        
        // 加载用电占比数据
        if (building !== 'A') {
          await Promise.all([
            preloadUsageDistribution(building, 'day', null),
            preloadUsageDistribution(building, 'month', null),
            preloadUsageDistribution(building, 'year', null)
          ])
        } else {
          // A楼栋的日视图已加载，只加载月视图和年视图
          await Promise.all([
            preloadUsageDistribution('A', 'month', null),
            preloadUsageDistribution('A', 'year', null)
          ])
        }
      }
      
      console.log('所有数据预加载完成')
    } catch (error) {
      console.error('次要数据加载失败:', error)
    } finally {
      console.timeEnd('次要数据加载耗时')
      console.timeEnd('预加载总耗时')
    }
  }
  
  // 优化预加载单个楼栋的图表数据
  const preloadBuildingChartData = async (building, timeType) => {
    try {
      // 首先尝试从sessionStorage中获取数据
      const cachedKey = `energySavingData_${building}_${timeType}`
      const cachedData = sessionStorage.getItem(cachedKey)
      
      if (cachedData) {
        console.log(`使用缓存数据: ${cachedKey}`)
        const parsedData = JSON.parse(cachedData)
        
        if (building === 'A' && timeType === 'daily') {
          chartData.value = parsedData
          console.log('初始图表数据已从缓存加载')
        }
        
        return { success: true, data: parsedData }
      }
      
      console.log(`预加载 ${building} 楼栋 ${timeType} 视图数据...`)
      
      // 使用带超时的请求，避免单个请求阻塞整个加载过程
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
      
      const params = new URLSearchParams({
        building,
        timeType
      })
      
      const response = await fetch(`/express/energy-saving/chart?${params}`, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      const result = await response.json()
      
      if (result.success) {
        // 优化：数据预处理后再存入缓存
        const processedData = preprocessChartData(result.data)
        sessionStorage.setItem(cachedKey, JSON.stringify(processedData))
        
        if (building === 'A' && timeType === 'daily') {
          chartData.value = processedData
          console.log('初始图表数据已加载')
        }
        
        // 返回处理后的数据
        return { success: true, data: processedData }
      }
      
      return result
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`预加载 ${building} 楼栋 ${timeType} 视图数据超时`)
      } else {
        console.error(`预加载 ${building} 楼栋数据失败:`, error)
      }
      return { success: false, error: error.message }
    }
  }
  
  // 预处理图表数据，优化格式，提高渲染性能
  const preprocessChartData = (data) => {
    if (!data || !data.dates || !data.values) {
      return data
    }
    
    try {
      // 数据验证
      const isAllZero = data.values.every(v => v === 0)
      
      // 如果数据过多，可以进行抽样
      if (data.dates.length > 60) {
        const step = Math.ceil(data.dates.length / 60)
        const sampledDates = []
        const sampledValues = []
        
        for (let i = 0; i < data.dates.length; i += step) {
          sampledDates.push(data.dates[i])
          sampledValues.push(data.values[i])
        }
        
        // 确保包含最后一个数据点
        if (!sampledDates.includes(data.dates[data.dates.length - 1])) {
          sampledDates.push(data.dates[data.dates.length - 1])
          sampledValues.push(data.values[data.values.length - 1])
        }
        
        return {
          dates: sampledDates,
          values: sampledValues,
          isAllZero
        }
      }
      
      return {
        ...data,
        isAllZero
      }
    } catch (err) {
      console.error('数据预处理错误:', err)
      return data
    }
  }
  
  // 优化预加载用电占比数据
  const preloadUsageDistribution = async (building, timeType, date) => {
    try {
      const actualDate = date || (timeType === 'day' ? getYesterday() : getCurrentMonth())
      
      // 尝试从缓存加载
      const cachedKey = `energySavingData_${building}_usage_${timeType}`
      const cachedData = sessionStorage.getItem(cachedKey)
      
      if (cachedData) {
        console.log(`使用缓存用电占比数据: ${cachedKey}`)
        const parsedData = JSON.parse(cachedData)
        
        if (building === 'A' && timeType === 'day') {
          usageDistribution.value = parsedData
          console.log('初始用电占比数据已从缓存加载')
        }
        
        return { success: true, data: parsedData }
      }
      
      console.log(`预加载 ${building} 楼栋用电占比数据...`)
      
      // 使用带超时的请求
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
      
      const params = new URLSearchParams({
        building,
        timeType,
        date: actualDate
      })
      
      const response = await fetch(`/express/energy-saving/usage-distribution?${params}`, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      const result = await response.json()
      
      if (result.success) {
        // 优化：预处理数据
        const processedData = preprocessPieData(result.data)
        sessionStorage.setItem(cachedKey, JSON.stringify(processedData))
        
        if (building === 'A' && timeType === 'day') {
          usageDistribution.value = processedData
          console.log('初始用电占比数据已加载')
        }
        
        return { success: true, data: processedData }
      }
      
      return result
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`预加载 ${building} 楼栋用电占比数据超时`)
      } else {
        console.error(`预加载 ${building} 楼栋用电占比数据失败:`, error)
      }
      return { success: false, error: error.message }
    }
  }
  
  // 预处理饼图数据
  const preprocessPieData = (data) => {
    if (!data || !Array.isArray(data)) {
      return data
    }
    
    // 过滤掉占比为0的数据，减少渲染负担
    return data.filter(item => item.value > 0)
  }
  
  // 获取昨天的日期字符串 YYYY-MM-DD
  const getYesterday = () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0]
  }
  
  // 获取当月字符串 YYYY-MM
  const getCurrentMonth = () => {
    return new Date().toISOString().slice(0, 7)
  }

  // 更新用电占比数据
  const updateUsageDistribution = async (building, timeType, date) => {
    try {
      const params = new URLSearchParams({
        building,
        timeType,
        date
      })
      const response = await fetch(`/express/energy-saving/usage-distribution?${params}`)
      const result = await response.json()
      if (result.success) {
        usageDistribution.value = result.data
        // 更新缓存
        const cachedKey = `energySavingData_${building}_usage_${timeType}`
        sessionStorage.setItem(cachedKey, JSON.stringify(result.data))
      }
      return result
    } catch (error) {
      console.error('获取用电占比数据失败:', error)
      throw error
    }
  }

  // 更新AI分析
  const debouncedUpdateAI = debounce(async (data) => {
    if (!data || !data.dates || !data.values) return
    if (!usageDistribution.value) return
    
    try {
      // 如果有正在进行的请求，则取消它
      if (currentAIRequest.value) {
        currentAIRequest.value.abort()
      }
      
      aiLoading.value = true
      aiSummary.value = ''

      // 创建 AbortController
      const controller = new AbortController()
      currentAIRequest.value = controller

      const response = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen2.5:14b',
          prompt: `请根据以下用电数据生成一份节能建议报告:
                  时间序列用电趋势:
                  时间: ${JSON.stringify(data.dates)}
                  用电量: ${JSON.stringify(data.values)}
                  
                  各类用电占比:
                  ${JSON.stringify(usageDistribution.value)}
                  
                  请分析以下几点：
                  1. 用电趋势分析
                  2. 用电结构分析
                  3. 节能建议
                  需要注意的是请从专业的角度分析，不要过多提及购买新设备，而是从现有的设备出发，例如削峰填谷，提出节能建议。如果比例合理得当，也不需要过多的建议。
                  `,
          stream: false
        }),
        signal: controller.signal // 添加 signal
      })

      const result = await response.json()
      if (result.response) {
        aiSummary.value = result.response
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('AI分析请求被取消')
        return
      }
      console.error('获取AI分析失败:', error)
      aiSummary.value = '获取AI分析失败，请稍后重试'
    } finally {
      currentAIRequest.value = null
      aiLoading.value = false
    }
  }, 1000) // 1秒的防抖时间

  // 在Store创建后立即尝试从缓存加载数据
  loadCachedData()

  // 监听数据变化
  watch([() => chartData.value, () => usageDistribution.value], ([newChartData, newUsageData]) => {
    if (newChartData && newUsageData) {
      debouncedUpdateAI(newChartData)
    }
  }, { deep: true })

  return {
    chartData,
    usageDistribution,
    aiSummary,
    aiLoading,
    isDataPreloaded,
    updateUsageDistribution,
    updateAISummary: debouncedUpdateAI,
    preloadAllBuildingsData
  }
}) 