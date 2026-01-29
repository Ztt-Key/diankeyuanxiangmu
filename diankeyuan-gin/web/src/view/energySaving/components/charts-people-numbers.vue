<!--
    本组件参考 arco-pro 的实现 将 ts 改为 js 写法
    https://github.com/arco-design/arco-design-pro-vue/blob/main/arco-design-pro-vite/src/views/dashboard/workplace/components/content-chart.vue
    @auther: bypanghu<bypanghu@163.com>
    @date: 2024/5/8
    @desc: 人数统计图表
!-->

<template>
  <div>
    <div ref="chartRef" :style="{ height }" v-loading="loading"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useEnergySavingStore } from '@/pinia/modules/energySaving'
import { storeToRefs } from 'pinia'

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
const { chartData } = storeToRefs(store)
const chartRef = ref(null)
const loading = ref(false)
let chart = null

const initChart = (data) => {
  if (!chart) {
    chart = echarts.init(chartRef.value)
  }
  
  const option = {
    grid: {
      top: '5%',
      left: '0%',
      right: '0%',
      bottom: '0%'
    },
    xAxis: {
      type: 'category',
      show: false,
      data: data.dates || []
    },
    yAxis: {
      type: 'value',
      show: false
    },
    series: [
      {
        data: data.values || [],
        type: 'line',
        smooth: true,
        showSymbol: false,
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

  chart.setOption(option)
}

// 监听 store 中的数据变化
watch(() => chartData.value, (newData) => {
  if (newData) {
    initChart(newData)
  }
}, { deep: true })

onMounted(() => {
  // 初始化时获取数据
  store.updateChartData(props.building, 'daily')
  
  window.addEventListener('resize', () => {
    chart?.resize()
  })
})

// 监听楼栋变化
watch(() => props.building, (newBuilding) => {
  store.updateChartData(newBuilding, 'daily')
})
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
