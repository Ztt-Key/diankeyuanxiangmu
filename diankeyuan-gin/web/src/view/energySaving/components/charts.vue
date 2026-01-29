<!--
    @auther: bypanghu<bypanghu@163.com>
    @date: 2024/5/8
!-->

<template>
  <div class="">
    <div class="flex items-center justify-between mb-2">
      <div v-if="title" class="font-bold">
        {{ title }}
      </div>
      <slot v-else name="title" />
    </div>
    <div class="w-full relative">
      <div v-if="type !== 4 && type !== 5">
        <div class="mt-4 text-gray-600 text-3xl font-mono">
          <el-statistic :value="getStatisticValue" />
        </div>
        <div class="mt-2" :class="getChangeClass">
          {{ getChangeText }} <el-icon><TopRight /></el-icon>
        </div>
      </div>
      <div class="absolute top-0 right-2 w-[50%] h-20">
        <charts-people-number v-if="type !== 4 && type !== 5" 
          :type="type"
          :data="getChartData" 
          height="100%" />
      </div>
      <charts-content-number v-if="type === 4" 
        :building="building"
        height="29rem"
        @dataUpdate="handleChartDataUpdate" />
      <charts-usage-pie v-if="type === 5"
        :building="building"
        height="29rem" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import chartsPeopleNumber from './charts-people-numbers.vue'
import chartsContentNumber from './charts-content-numbers.vue'
import chartsUsagePie from './charts-usage-pie.vue'
import { TopRight } from '@element-plus/icons-vue'

const props = defineProps({
  type: {
    type: Number,
    default: 1
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

// 存储图表数据
const chartData = ref(null)

// 模拟数据
const buildingData = {
  A: { current: 169698.90, monthChange: 1.2, yearChange: 15.5 },
  B: { current: 12968.80, monthChange: -2.3, yearChange: 5.8 },
  C: { current: 1077352.70, monthChange: 3.5, yearChange: 22.1 },
  D: { current: 219657.20, monthChange: 0.8, yearChange: 8.9 }
}

// 处理图表数据更新
const handleChartDataUpdate = (data) => {
  if (!data) return
  chartData.value = data
  console.log('图表数据已更新:', data)
}

// 统计数值
const getStatisticValue = computed(() => {
  const data = buildingData[props.building]
  switch (props.type) {
    case 1: return data.current
    case 2: return data.monthChange
    case 3: return data.yearChange
    case 4: {
      // 从图表数据计算总用电量
      if (chartData.value && chartData.value.values && chartData.value.values.length > 0) {
        const sum = chartData.value.values.reduce((acc, val) => acc + val, 0)
        return sum.toFixed(2)
      }
      return data.current
    }
    default: return 0
  }
})

// 变化文本
const getChangeText = computed(() => {
  if (props.type === 4 && chartData.value) {
    // 对于用电量图表，显示数据来源
    return '实时数据'
  }
  
  const value = getStatisticValue.value
  return `${value > 0 ? '+' : ''}${value}%`
})

// 变化样式
const getChangeClass = computed(() => {
  const value = getStatisticValue.value
  return value > 0 ? 'text-green-600 text-sm font-bold font-mono' : 'text-red-600 text-sm font-bold font-mono'
})

// 图表数据
const getChartData = computed(() => {
  // 如果有图表数据，优先使用
  if (props.type === 4 && chartData.value && chartData.value.values) {
    return chartData.value.values
  }
  
  switch (props.type) {
    case 1: return [12, 22, 32, 45, 32, 78, 89, 92]
    case 2: return [1, 2, 43, 5, 67, 78, 89, 12]
    case 3: return [12, 22, 32, 45, 32, 78, 89, 92]
    default: return []
  }
})
</script>

<style scoped lang="scss"></style>
