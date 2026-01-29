<template>
  <div>
    <div class="mb-4 flex items-center gap-4">
      <el-radio-group v-model="timeType" @change="fetchUsageData">
        <el-radio-button label="day">日数据</el-radio-button>
        <el-radio-button label="month">月数据</el-radio-button>
      </el-radio-group>
      
      <el-date-picker
        v-if="timeType === 'day'"
        v-model="selectedDate"
        type="date"
        :placeholder="'选择日期'"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        :disabled-date="disabledDate"
        @change="fetchUsageData"
      />
      
      <el-date-picker
        v-else
        v-model="selectedMonth"
        type="month"
        :placeholder="'选择月份'"
        format="YYYY-MM"
        value-format="YYYY-MM"
        :disabled-date="disabledMonth"
        @change="fetchUsageData"
      />
    </div>
    <div v-if="error" class="error-message">{{ error }}</div>
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
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useEnergySavingStore } from '@/pinia/modules/energySaving'
import { storeToRefs } from 'pinia'

const props = defineProps({
  building: {
    type: String,
    default: 'A'
  },
  height: {
    type: String,
    default: '100%'
  }
})

const chartRef = ref(null)
let chart = null

// 添加模拟数据
const mockData = {
  'A': {
    day: [
      { name: '照明', value: 9 },
      { name: '动力', value: 60 },
      { name: '空调', value: 5 },
      { name: '消防', value: 10 },
      { name: '电梯', value: 6 },
      { name: '其他', value: 10 }
    ],
    month: [
      { name: '照明', value: 9 },
      { name: '动力', value: 60 },
      { name: '空调', value: 5 },
      { name: '消防', value: 10 },
      { name: '电梯', value: 6 },
      { name: '其他', value: 10 }
    ]
  },
  'B': {
    day: [
      { name: '照明', value: 12 },
      { name: '动力', value: 55 },
      { name: '空调', value: 8 },
      { name: '消防', value: 9 },
      { name: '电梯', value: 5 },
      { name: '其他', value: 11 }
    ],
    month: [
      { name: '照明', value: 12 },
      { name: '动力', value: 55 },
      { name: '空调', value: 8 },
      { name: '消防', value: 9 },
      { name: '电梯', value: 5 },
      { name: '其他', value: 11 }
    ]
  },
  'C': {
    day: [
      { name: '照明', value: 8 },
      { name: '动力', value: 65 },
      { name: '空调', value: 6 },
      { name: '消防', value: 8 },
      { name: '电梯', value: 7 },
      { name: '其他', value: 6 }
    ],
    month: [
      { name: '照明', value: 8 },
      { name: '动力', value: 65 },
      { name: '空调', value: 6 },
      { name: '消防', value: 8 },
      { name: '电梯', value: 7 },
      { name: '其他', value: 6 }
    ]
  },
  'D': {
    day: [
      { name: '照明', value: 10 },
      { name: '动力', value: 58 },
      { name: '空调', value: 7 },
      { name: '消防', value: 12 },
      { name: '电梯', value: 5 },
      { name: '其他', value: 8 }
    ],
    month: [
      { name: '照明', value: 10 },
      { name: '动力', value: 58 },
      { name: '空调', value: 7 },
      { name: '消防', value: 12 },
      { name: '电梯', value: 5 },
      { name: '其他', value: 8 }
    ]
  }
}

// 1. 先定义 getYesterday 函数
const getYesterday = () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString().split('T')[0]
}

// 2. 然后再使用这个函数初始化变量
const timeType = ref('day')
const selectedDate = ref(getYesterday())
const selectedMonth = ref(new Date().toISOString().slice(0, 7))
const error = ref('')
const loading = ref(false)

const store = useEnergySavingStore()

// 3. 其他禁用日期的逻辑
const disabledDate = (time) => {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return time.getTime() >= today.getTime() || time.getTime() < oneYearAgo.getTime()
}

// 修改月份禁用逻辑
const disabledMonth = (time) => {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const today = new Date()
  today.setDate(1)  // 设置为当月第一天
  return time.getTime() > today.getTime() || time.getTime() < oneYearAgo.getTime()
}

// 获取饼图数据
const fetchUsageData = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const params = new URLSearchParams({
      building: props.building,
      timeType: timeType.value,
      date: timeType.value === 'day' ? selectedDate.value : selectedMonth.value
    })
    
    // 尝试获取API数据
    let pieData = null;
    try {
      const response = await fetch(`/express/energy-saving/usage-distribution?${params}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        // 检查数据是否有效
        if (Array.isArray(result.data) && result.data.length > 0) {
          // 检查数据项中是否有有效的值（不为0）
          const hasValidValues = result.data.some(item => item.value > 0)
          
          if (hasValidValues) {
            // 检查是否存在数据项中有0值的情况
            const hasZeroValues = result.data.some(item => item.value === 0)
            
            if (hasZeroValues) {
              console.log('饼图数据中存在0值项，替换为模拟数据中对应项')
              
              // 使用模拟数据中的对应项替换0值项
              const mockPieData = mockData[props.building]?.[timeType.value] || mockData['A'][timeType.value]
              
              // 创建一个名称映射，用于快速查找模拟数据中的项
              const mockDataMap = {}
              mockPieData.forEach(item => {
                mockDataMap[item.name] = item.value
              })
              
              // 替换0值项
              pieData = result.data.map(item => {
                if (item.value === 0 && mockDataMap[item.name]) {
                  return {
                    ...item,
                    value: mockDataMap[item.name]
                  }
                }
                return item
              })
            } else {
              // 所有数据都有效，直接使用API数据
              pieData = result.data
            }
          } else {
            console.log('饼图数据全部为0，使用模拟数据')
          }
        } else {
          console.log('饼图数据格式无效，使用模拟数据')
        }
      }
    } catch (apiError) {
      console.error('饼图API调用失败:', apiError)
    }
    
    // 如果没有有效的API数据，使用模拟数据
    if (!pieData) {
      console.log('使用模拟饼图数据:', props.building, timeType.value)
      
      // 清除错误消息
      error.value = ''
      
      // 使用对应楼栋和时间类型的模拟数据
      if (mockData[props.building] && mockData[props.building][timeType.value]) {
        pieData = mockData[props.building][timeType.value]
      } else {
        // 默认使用A座的数据
        pieData = mockData['A'][timeType.value] || []
      }
    }
    
    // 更新图表
    initChart(pieData)
    
    // 更新 store 中的用电占比数据
    store.$patch({
      usageDistribution: pieData
    })
  } catch (error) {
    console.error('获取用电分布数据失败:', error)
    
    // 出错时使用模拟数据
    const buildingKey = props.building
    const typeKey = timeType.value
    
    if (mockData[buildingKey] && mockData[buildingKey][typeKey]) {
      const fallbackData = mockData[buildingKey][typeKey]
      initChart(fallbackData)
      store.$patch({ usageDistribution: fallbackData })
      error.value = '' // 清除错误信息
    } else {
      error.value = '获取数据失败，请稍后重试'
      initChart([])
    }
  } finally {
    loading.value = false
  }
}

const initChart = (data) => {
  if (!chartRef.value) return
  
  chart = echarts.init(chartRef.value, 'auto')
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (props.building === 'All') {
          return `${params.name}<br/>总用电占比: ${params.value}%`
        }
        return `${params.name}<br/>用电占比: ${params.value}%`
      },
      textStyle: {
        color: '#a0aec0'
      }
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      formatter: (name) => {
        if (props.building === 'All') {
          return name.replace('配电室', '')
        }
        return name
      },
      textStyle: {
        color: '#a0aec0'
      }
    },
    series: [
      {
        name: '用电占比',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  }
  
  chart.setOption(option)
}

onMounted(() => {
  fetchUsageData()
  window.addEventListener('resize', () => chart?.resize())
})

watch([() => props.building, timeType], () => {
  fetchUsageData()
})

// 暴露 fetchData 方法
defineExpose({
  fetchData: fetchUsageData
})
</script>

<style scoped>
.mb-4 {
  margin-bottom: 1rem;
}
.flex {
  display: flex;
}
.items-center {
  align-items: center;
}
.gap-4 {
  gap: 1rem;
}
/* 修改注释颜色 */
:deep(.hljs-comment),
:deep(.hljs-quote) {
  color: #a0aec0 !important; /* 使用更亮的蓝灰色 */
}
.error-message {
  color: #f56c6c;
  text-align: center;
  margin: 10px 0;
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
</style> 