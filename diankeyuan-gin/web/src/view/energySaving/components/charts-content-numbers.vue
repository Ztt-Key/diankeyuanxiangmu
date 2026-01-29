<!--
    本组件参考 arco-pro 的实现 将 ts 改为 js 写法
    https://github.com/arco-design/arco-design-pro-vue/blob/main/arco-design-pro-vite/src/views/dashboard/workplace/components/content-chart.vue
    @auther: bypanghu<bypanghu@163.com>
    @date: 2024/5/8
!-->

<template>
  <div>
    <div class="mb-4">
      <el-radio-group v-model="timeType" size="small">
        <el-radio-button label="daily">日视图</el-radio-button>
        <el-radio-button label="monthly">月视图</el-radio-button>
        <el-radio-button label="yearly">年视图</el-radio-button>
      </el-radio-group>
      <!-- <span v-if="isFullyLoaded" class="preload-status">预加载完成</span> -->
    </div>
    
    <!-- 添加无数据提示 -->
    <div v-if="noDataMessage" class="no-data-message">
      <el-alert type="warning" :title="noDataMessage" :closable="false" />
    </div>
    
    <div class="chart-container" :style="{ height }">
      <div 
        v-loading="loading"
        element-loading-text="加载中..."
        element-loading-background="rgba(0, 0, 0, 0.1)"
      >
        <div ref="chartRef" :style="{ height: '100%', width: '100%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, onUnmounted, computed } from 'vue'
import * as echarts from 'echarts'
import { useEnergySavingStore } from '@/pinia/modules/energySaving'
const props = defineProps({
  height: {
    type: String,
    default: '100%'
  },
  building: {
    type: String,
    default: 'A'
  }
})
const store = useEnergySavingStore()
const chartRef = ref(null)
const timeType = ref('daily')
const loading = ref(false)
let chart = null
const emit = defineEmits(['dataUpdate'])

// 添加无数据消息状态
const noDataMessage = ref('')

// 添加缓存数据的对象
const cachedData = ref({
  daily: null,
  monthly: null,
  yearly: null
})

// 添加数据加载状态标记
const loadingState = ref({
  daily: false,
  monthly: false,
  yearly: false
})

// 获取图表数据
const fetchChartData = async () => {
  try {
    loading.value = true
    // 重置无数据消息
    noDataMessage.value = ''
    
    // 检查是否有缓存数据
    if (cachedData.value[timeType.value]) {
      console.log(`使用缓存的${timeType.value}视图数据`)
      const chartData = cachedData.value[timeType.value]
      
      // 检查缓存数据是否为空或全部为0
      if (chartData.isAllZero || (chartData.values && 
          chartData.values.length > 0 && 
          chartData.values.every(v => v === 0 || v === null || v === undefined))) {
        noDataMessage.value = `${getBuildingLabel()}在${getViewLabel()}视图中暂无用电数据`
      } else {
        // 有数据时确保清空提示消息
        noDataMessage.value = ''
      }
      
      // 使用缓存数据更新图表
      initChart(chartData)
      
      // 更新 store 中的数据
      store.$patch({
        chartData: chartData
      })
      
      // 发送数据更新事件
      emit('dataUpdate', chartData)
      
      // 隐藏加载状态
      loading.value = false
      
      // 预加载其他视图数据
      nextTick(() => {
        preloadOtherViews()
      })
      
      return
    }
    
    const params = new URLSearchParams({
      building: props.building,
      timeType: timeType.value
    })
    
    let chartData = null
    
    try {
      const response = await fetch(`/express/energy-saving/chart?${params}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        console.log(`接收到${timeType.value}视图数据:`, result.data)
        
        // 检查数据是否全部为0
        const isAllZero = result.data.isAllZero || (result.data.values && 
                         result.data.values.length > 0 &&
                         result.data.values.every(v => v === 0 || v === null || v === undefined))
        
        // 检查数据是否至少包含一个有效值(大于0)
        const hasValidData = result.data.values && 
                            result.data.values.some(v => typeof v === 'number' && v > 0)
        
        if (isAllZero && !hasValidData) {
          console.log(`${timeType.value}视图数据全部为0或无效`)
          // 设置无数据消息
          noDataMessage.value = `${getBuildingLabel()}在${getViewLabel()}视图中暂无用电数据`
          // 使用真实数据，不替换
          chartData = result.data
          // 确保包含isAllZero标记
          chartData.isAllZero = true
        } else {
          // 只要有任何有效数据，就当作有数据处理
          // 有数据时确保清空提示消息
          noDataMessage.value = ''
          
          // 对日视图做特殊处理 - 只显示最近7天的数据
          if (timeType.value === 'daily' && result.data.values.length > 7) {
            console.log('日视图数据截取最近7天')
            chartData = {
              dates: result.data.dates.slice(-7),
              values: result.data.values.slice(-7),
              isAllZero: false
            }
          } else {
            // 直接使用真实数据，即使有0值
            chartData = result.data
            // 确保包含isAllZero标记
            chartData.isAllZero = false
          }
        }
      } else {
        console.error('获取图表数据失败:', result.message || '未知错误')
        chartData = { dates: [], values: [], isAllZero: true }
        noDataMessage.value = `获取${getBuildingLabel()}的${getViewLabel()}视图数据失败`
      }
    } catch (error) {
      console.error('获取图表数据失败:', error)
      chartData = { dates: [], values: [], isAllZero: true }
      noDataMessage.value = `网络请求失败，无法获取${getBuildingLabel()}用电数据`
    }
    
    // 缓存数据
    cachedData.value[timeType.value] = chartData
    
    // 更新图表
    initChart(chartData)
    
    // 更新 store 中的数据
    store.$patch({
      chartData: chartData
    })
    
    // 发送数据更新事件
    emit('dataUpdate', chartData)
    
    // 预加载其他视图数据
    nextTick(() => {
      preloadOtherViews()
    })
  } catch (error) {
    console.error('图表数据处理失败:', error)
    
    // 错误情况下使用空数据
    const emptyData = { dates: [], values: [], isAllZero: true }
    noDataMessage.value = `${getBuildingLabel()}在${getViewLabel()}视图中暂无用电数据`
    
    // 缓存数据
    cachedData.value[timeType.value] = emptyData
    
    // 更新图表
    initChart(emptyData)
    
    // 更新 store 中的数据
    store.$patch({
      chartData: emptyData
    })
    
    // 发送数据更新事件
    emit('dataUpdate', emptyData)
  } finally {
    loading.value = false
  }
}

const initChart = (data) => {
  // 检查数据是否为空或至少有一个有效数据
  const hasData = data && data.dates && data.values && 
                 data.dates.length > 0 && 
                 data.values.length > 0 &&
                 data.values.some(v => typeof v === 'number' && v > 0)
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.dates || []
    },
    yAxis: {
      type: 'value',
      name: '用电量(kWh)'
    },
    series: [
      {
        name: '用电量',
        type: 'line',
        smooth: true,
        data: data.values || [],
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: '#409EFF'
            },
            {
              offset: 1,
              color: 'rgba(255, 255, 255, 0)'
            }
          ])
        }
      }
    ]
  }
  
  // 如果没有数据，显示提示信息
  if (!hasData) {
    option.graphic = [
      {
        type: 'text',
        left: 'center',
        top: 'middle',
        style: {
          fontSize: 20,
          fill: '#F56C6C',
          fontWeight: 'normal'
        }
      }
    ];
  }

  if (!chart) {
    chart = echarts.init(chartRef.value)
  }
  chart.setOption(option)
}

// 清除缓存数据
const clearCache = () => {
  Object.keys(cachedData.value).forEach(key => {
    cachedData.value[key] = null
  })
  
  Object.keys(loadingState.value).forEach(key => {
    loadingState.value[key] = false
  })
}

// 监听楼栋变化和时间类型变化
watch([() => props.building, timeType], ([newBuilding, newViewType], [oldBuilding, oldViewType]) => {
  // 如果楼栋发生变化，清空缓存
  if (newBuilding !== oldBuilding) {
    clearCache()
  }
  
  fetchChartData()
})

// 组件挂载时加载当前视图，并开始预加载其他视图
onMounted(() => {
  fetchChartData()
  
  // 在组件挂载后预加载其他视图数据
  nextTick(() => {
    preloadOtherViews()
  })
  
  window.addEventListener('resize', () => {
    chart?.resize()
  })
})

// 组件卸载时清理资源
onUnmounted(() => {
  // 清理图表实例
  if (chart) {
    chart.dispose()
    chart = null
  }
  
  // 清空缓存数据
  clearCache()
})

// 暴露 fetchData 方法
defineExpose({
  fetchData: fetchChartData
})

// 预加载其他视图的数据
const preloadOtherViews = () => {
  const viewsToLoad = ['daily', 'monthly', 'yearly'].filter(view => view !== timeType.value)
  
  console.log('开始预加载其他视图数据:', viewsToLoad)
  
  viewsToLoad.forEach((view) => {
    // 如果已经缓存或正在加载中，跳过
    if (cachedData.value[view] || loadingState.value[view]) {
      return
    }
    
    // 标记为正在加载
    loadingState.value[view] = true
    
    // 使用setTimeout进行异步加载，避免阻塞主线程
    setTimeout(async () => {
      try {
        console.log(`预加载 ${view} 视图数据...`)
        
        const params = new URLSearchParams({
          building: props.building,
          timeType: view
        })
        
        const response = await fetch(`/express/energy-saving/chart?${params}`, {
          // 添加后台请求头，区分优先级
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-Background-Request': 'true'
          }
        })
        const result = await response.json()
        
        // 处理返回的数据
        let viewData = { dates: [], values: [], isAllZero: true }
        
        if (result.success && result.data) {
          console.log(`预加载接收到${view}视图数据:`, result.data)
          
          // 检查数据是否为空或全部为0
          const isAllZero = result.data.isAllZero || (result.data.values && 
                           result.data.values.length > 0 &&
                           result.data.values.every(v => v === 0 || v === null || v === undefined))
          
          // 检查是否有至少一个有效值
          const hasValidData = result.data.values && 
                              result.data.values.some(v => typeof v === 'number' && v > 0)
          
          if (isAllZero && !hasValidData) {
            console.log(`预加载的${view}视图数据全部为0或无效`)
            // 保留原始数据，而不是使用模拟数据
            viewData = result.data
            viewData.isAllZero = true
          } else {
            // 只要有任何有效数据，就当作有数据处理
            
            // 日视图特殊处理 - 只保留最近7天
            if (view === 'daily' && result.data.values.length > 7) {
              viewData = {
                dates: result.data.dates.slice(-7),
                values: result.data.values.slice(-7),
                isAllZero: false
              }
            } else {
              // 使用真实数据，即使有0值
              viewData = result.data
              viewData.isAllZero = false
            }
          }
        } else {
          console.log(`预加载${view}视图数据失败或格式不正确`)
        }
        
        // 缓存预加载的数据
        cachedData.value[view] = viewData
        console.log(`✅ ${view}视图数据预加载完成`)
      } catch (error) {
        console.error(`预加载${view}视图数据失败:`, error)
        
        // 失败时使用空数据
        cachedData.value[view] = { dates: [], values: [], isAllZero: true }
      } finally {
        // 重置加载状态
        loadingState.value[view] = false
      }
    }, 500) // 延迟执行，避免与主要渲染争抢资源
  })
}

// 获取建筑物标签
const getBuildingLabel = () => {
  return `${props.building}座`
}

// 获取视图标签
const getViewLabel = () => {
  const viewLabels = {
    daily: '日',
    monthly: '月',
    yearly: '年'
  }
  return viewLabels[timeType.value] || ''
}

// 判断是否所有视图都已预加载完成
const isFullyLoaded = computed(() => {
  return cachedData.value.daily && 
         cachedData.value.monthly && 
         cachedData.value.yearly
})
</script>

<style scoped>
.mb-4 {
  margin-bottom: 1rem;
}
.chart-container {
  position: relative;
  width: 100%;
  height: 100%;
}
.chart-container > div {
  height: 100%;
  width: 100%;
}
.preload-status {
  margin-left: 1rem;
  color: #67c23a;
  font-size: 0.875rem;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: rgba(103, 194, 58, 0.1);
}
.no-data-message {
  margin-bottom: 15px;
}
</style>
