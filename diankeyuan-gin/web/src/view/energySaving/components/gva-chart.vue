<template>
  <div ref="chartDom" :style="{ height: '100%', width: '100%' }">
    <div v-if="loading" class="chart-loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">加载中...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, defineEmits, nextTick, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useEnergySavingStore } from '@/pinia/modules/energySaving'
import { debounce } from 'lodash'

// 按需注册ECharts组件，减少不必要的组件加载
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  BarChart,
  LineChart,
  PieChart,
  CanvasRenderer
])

const store = useEnergySavingStore()
const emit = defineEmits(['dataUpdate'])
const chartDom = ref(null)
const loading = ref(true)
let chart = null
let currentTimeType = 'daily'  // 默认时间类型
let cachedOptions = {} // 缓存图表配置，避免重复创建

// 防抖的resize处理函数，优化性能
const handleResize = debounce(() => {
  if (chart) {
    chart.resize()
  }
}, 100)

const props = defineProps({
  type: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  building: {
    type: String,
    default: 'A'
  }
})

// 切换时间类型
const switchTimeType = (type) => {
  if (currentTimeType !== type) {
    currentTimeType = type
    loading.value = true
    // 使用nextTick确保DOM更新后再加载数据
    nextTick(() => {
      loadDataFromCache()
    })
  }
}

// 从缓存加载数据
const loadDataFromCache = () => {
  const building = props.building || 'A'
  
  if (props.type === 4) { // 用电趋势图
    const cachedKey = `energySavingData_${building}_${currentTimeType}`
    const cachedData = sessionStorage.getItem(cachedKey)
    
    if (cachedData) {
      console.log(`从缓存加载图表数据: ${cachedKey}`)
      try {
        const parsedData = JSON.parse(cachedData)
        if (parsedData && parsedData.dates && parsedData.values) {
          updateChartData(parsedData)
          return true
        }
      } catch (error) {
        console.error('缓存数据解析失败:', error)
      }
    }
    
    console.log(`无${building}楼栋${currentTimeType}视图的预加载数据`)
    // 即使没有数据也需要更新图表状态
    updateChartData({dates: [], values: [], isAllZero: true})
    return false
  }
  
  if (props.type === 5) { // 用电占比图
    const timeViewMap = { daily: 'day', monthly: 'month', yearly: 'year' }
    const viewType = timeViewMap[currentTimeType] || 'day'
    const cachedKey = `energySavingData_${building}_usage_${viewType}`
    const cachedData = sessionStorage.getItem(cachedKey)
    
    if (cachedData) {
      console.log(`从缓存加载用电占比数据: ${cachedKey}`)
      try {
        const parsedData = JSON.parse(cachedData)
        if (parsedData) {
          updatePieChartData(parsedData)
          return true
        }
      } catch (error) {
        console.error('缓存用电占比数据解析失败:', error)
      }
    }
    
    console.log(`无${building}楼栋${viewType}视图的用电占比预加载数据`)
    // 即使没有数据也需要更新图表状态
    updatePieChartData([])
    return false
  }
  
  loading.value = false
  return false
}

// 初始化图表 - 优化图表配置，减少不必要的渲染选项
const initChart = () => {
  if (!chartDom.value) return
  
  // 如果图表已存在，先销毁
  if (chart) {
    chart.dispose()
  }
  
  // 创建图表实例
  chart = echarts.init(chartDom.value, null, {
    renderer: 'canvas', // 使用canvas渲染器提高性能
    useDirtyRect: true // 启用脏矩形渲染优化
  })
  
  // 初始化基础配置
  switch (props.type) {
    case 4: // 用电趋势图
      initTrendChart()
      break
    case 5: // 用电占比图
      initPieChart()
      break
    default:
      console.warn('未支持的图表类型:', props.type)
  }
  
  // 监听窗口大小变化，优化性能
  window.addEventListener('resize', handleResize)
}

// 初始化趋势图，减少配置复杂度
const initTrendChart = () => {
  // 简化的配置，减少不必要的美化选项
  const option = {
    title: {
      text: props.title || '用电趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const value = params[0].value
        return value === 0 ? '当前无用电数据' : `${params[0].name}: ${value} kWh`
      }
    },
    legend: {
      data: ['用电量'],
      bottom: 5
    },
    toolbox: {
      show: true,
      feature: {
        dataZoom: { yAxisIndex: 'none' },
        magicType: { type: ['line', 'bar'] }
      },
      right: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: [],
      axisLabel: {
        interval: 'auto', // 自动调整标签间隔，提高性能
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '用电量(kWh)'
    },
    series: [{
      name: '用电量',
      type: 'line',
      data: [],
      // 减少平滑度，提高性能
      smooth: false,
      // 简化样式
      itemStyle: { color: '#1890ff' },
      // 简化区域样式
      areaStyle: { 
        color: 'rgba(24, 144, 255, 0.2)'
      }
    }]
  }
  
  // 添加切换视图按钮
  option.toolbox.feature = {
    ...option.toolbox.feature,
    myFeature1: {
      show: true,
      title: '日视图',
      icon: 'path://M21,19V5c0,-1.1 -0.9,-2 -2,-2H5c-1.1,0 -2,0.9 -2,2v14c0,1.1 0.9,2 2,2h14C20.1,21 21,20.1 21,19z',
      onclick: function() { switchTimeType('daily') }
    },
    myFeature2: {
      show: true,
      title: '月视图',
      icon: 'path://M19,4h-1V2h-2v2H8V2H6v2H5C3.89,4 3.01,4.9 3.01,6L3,20c0,1.1 0.89,2 2,2h14c1.1,0 2,-0.9 2,-2V6C21,4.9 20.1,4 19,4z',
      onclick: function() { switchTimeType('monthly') }
    },
    myFeature3: {
      show: true,
      title: '年视图',
      icon: 'path://M19,4h-1V2h-2v2H8V2H6v2H5C3.89,4 3.01,4.9 3.01,6L3,20c0,1.1 0.89,2 2,2h14c1.1,0 2,-0.9 2,-2V6C21,4.9 20.1,4 19,4z',
      onclick: function() { switchTimeType('yearly') }
    }
  }
  
  // 缓存选项，避免重复创建
  cachedOptions.trend = option
  
  // 设置图表选项
  chart.setOption(option)
}

// 初始化饼图，简化配置
const initPieChart = () => {
  const option = {
    title: {
      text: props.title || '用电占比',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    series: [{
      name: '用电占比',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 4, // 减小圆角半径
        borderColor: '#fff',
        borderWidth: 1  // 减小边框宽度
      },
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,  // 减小字体大小
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: []
    }]
  }
  
  // 缓存选项
  cachedOptions.pie = option
  
  // 设置图表选项
  chart.setOption(option)
}

// 更新趋势图数据，使用增量更新
const updateChartData = (data) => {
  if (!chart) {
    initChart()
  }
  
  loading.value = false
  
  if (!data || !data.dates || !data.values) {
    console.warn('Invalid chart data:', data)
    chart.setOption({
      xAxis: { data: [] },
      series: [{ data: [] }]
    }, true) // 使用true参数进行增量更新
    return
  }
  
  // 只更新需要更新的部分，提高性能
  chart.setOption({
    xAxis: {
      data: data.dates
    },
    series: [{
      data: data.values
    }],
    title: {
      subtext: data.isAllZero ? '当前无用电数据' : ''
    }
  }, true) // 使用true参数进行增量更新
  
  // 发送数据更新事件
  emit('dataUpdate', data)
}

// 更新饼图数据，简化颜色处理逻辑
const updatePieChartData = (data) => {
  if (!chart) {
    initChart()
  }
  
  loading.value = false
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.warn('Invalid pie chart data:', data)
    chart.setOption({
      series: [{ data: [] }]
    }, true)
    return
  }
  
  // 使用预定义颜色数组，减少渐变色的使用
  const colors = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', 
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#67e0e3'
  ]
  
  // 简化数据处理
  const enhancedData = data.map((item, index) => ({
    ...item,
    itemStyle: {
      color: colors[index % colors.length]
    }
  }))
  
  // 增量更新
  chart.setOption({
    series: [{
      data: enhancedData
    }]
  }, true)
}

// 监听建筑物变化
watch(() => props.building, (newBuilding) => {
  console.log('Building changed in chart component:', newBuilding)
  loading.value = true
  // 使用nextTick确保DOM更新后再加载数据
  nextTick(() => {
    loadDataFromCache()
  })
})

// 提供fetchData方法
const fetchData = () => {
  console.log('fetchData called - 从缓存加载数据')
  loading.value = true
  // 使用nextTick确保DOM更新后再加载数据
  return nextTick(() => {
    return loadDataFromCache()
  })
}

// 提前初始化图表，不等待数据
onMounted(() => {
  // 延迟一帧初始化图表，确保DOM已经渲染
  nextTick(() => {
    initChart()
    loadDataFromCache()
  })
})

// 组件卸载时清理资源
onBeforeUnmount(() => {
  if (chart) {
    chart.dispose()
  }
  window.removeEventListener('resize', handleResize)
})

// 暴露方法给父组件
defineExpose({
  fetchData,
  switchTimeType
})
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.chart-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 1;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 8px;
  color: #666;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 