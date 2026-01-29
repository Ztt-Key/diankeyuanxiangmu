<!-- web/src/view/energySaving/components/BuildingStatistics.vue -->
<template>
  <div class="building-statistics">
    <h2 class="building-title">{{ buildingLabel }}用电统计数据</h2>
    <el-button type="primary" @click="exportToExcel">导出统计数据</el-button>
    <!-- 视图切换按钮 -->
    <div class="view-selector mb-4">
      <el-radio-group v-model="currentView" @change="handleViewChange" size="small">
        <el-radio-button label="daily">日视图</el-radio-button>
        <el-radio-button label="monthly">月视图</el-radio-button>
        <el-radio-button label="yearly">年视图</el-radio-button>
      </el-radio-group>
    </div>
    
    <!-- 表格形式展示数据 -->
    <el-table :data="statisticsData" border style="width: 100%" stripe v-loading="loading">
      <el-table-column prop="name" label="指标" width="180" />
      <el-table-column prop="value" label="数值" width="180">
        <template #default="scope">
          <span :class="getValueClass(scope.row)">{{ scope.row.value }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="unit" label="单位" width="100" />
      <el-table-column prop="description" label="说明" />
    </el-table>

    <!-- 显示无数据提示 -->
    <div v-if="noDataMessage" class="no-data-message">
      <el-alert type="warning" :title="noDataMessage" :closable="false" />
    </div>

    <!-- 详细日期数据表格 -->
    <div v-if="dailyData.length > 0" class="mt-4">
      <h3 class="daily-data-title">{{ viewLabels[currentView] }}度数据明细 &nbsp;&nbsp;&nbsp; <el-button type="primary" @click="exportToExcelDtil">导出详细数据</el-button></h3>
    
      <el-table :data="dailyData" border style="width: 100%" stripe max-height="400">
        <el-table-column prop="date" label="日期" width="180" sortable />
        <el-table-column prop="value" label="用电量" width="180" sortable>
          <template #default="scope">
            <span>{{ scope.row.value.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="100" />
        <el-table-column prop="type" label="类型">
          <template #default="scope">
            <el-tag :type="getDateTypeTag(scope.row)">{{ scope.row.type }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页器 -->
      <div class="pagination-container mt-3" v-if="dailyData.length > 10">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="5"
          layout="prev, pager, next"
          :total="dailyData.length"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 趋势图 -->
    <div class="trend-chart mt-4" v-if="showTrend">
      <h3>{{ viewLabels[currentView] }}用电趋势变化</h3>
      <div class="chart-container" ref="chartContainer">
        <div ref="trendChartRef" :style="{ height: '300px', width: '100%' }"></div>
        <div v-if="!hasChartData" class="no-data-overlay">
          <span class="no-data-text">当前无用电数据</span>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import * as echarts from 'echarts'

const props = defineProps({
  building: {
    type: String,
    required: true
  },
  buildingLabel: {
    type: String,
    default: ''
  },
  showTrend: {
    type: Boolean,
    default: false
  }
})

// 当前视图类型
const currentView = ref('daily')
const loading = ref(false)
//返回数据
const ChartdataVal = ref([])
// 视图类型标签
const viewLabels = {
  daily: '日',
  monthly: '月',
  yearly: '年'
}

// 统计数据
const statisticsData = ref([])

// 添加日期数据相关变量
const dailyData = ref([])
const currentPage = ref(1)

// 添加缓存数据的状态
const cachedData = ref({
  daily: null,
  monthly: null,
  yearly: null
})

// 添加缓存统计数据的状态
const cachedStatistics = ref({
  daily: null,
  monthly: null,
  yearly: null
})

// 添加缓存明细数据的状态
const cachedDailyData = ref({
  daily: null,
  monthly: null,
  yearly: null
})

// 判断是否有图表数据
const hasChartData = ref(false)
let trendChart = null

// 添加图表引用
const trendChartRef = ref(null)

// 添加无数据消息状态
const noDataMessage = ref('');

// 处理视图变化
const handleViewChange = () => {
  console.log(`切换到${currentView.value}视图`)
  // 检查是否有缓存数据
  if (cachedData.value[currentView.value]) {
    console.log(`使用缓存的${currentView.value}视图数据`)
    
    // 使用缓存的数据
    ChartdataVal.value = cachedData.value[currentView.value]
    
    // 如果有缓存的统计数据和明细数据，直接使用
    if (cachedStatistics.value[currentView.value]) {
      statisticsData.value = [...cachedStatistics.value[currentView.value]]
    } else {
      // 否则重新计算统计数据
      updateTableData()
      // 缓存计算结果
      cachedStatistics.value[currentView.value] = [...statisticsData.value]
    }
    
    if (cachedDailyData.value[currentView.value]) {
      dailyData.value = [...cachedDailyData.value[currentView.value]]
    } else {
      // 否则重新计算明细数据
      updateDailyData()
      // 缓存计算结果
      cachedDailyData.value[currentView.value] = [...dailyData.value]
    }
  } else {
    // 没有缓存数据，请求API
    fetchStatisticsData()
  }
  
  // 重置分页
  currentPage.value = 1
}

// 处理分页
const handlePageChange = (page) => {
  currentPage.value = page
}

// 获取日期类型标签
const getDateTypeTag = (row) => {
  switch(row.type) {
    case '工作日':
      return 'primary'
    case '周末':
      return 'warning'
    case '节假日':
      return 'success'
    case '峰值':
      return 'danger'
    case '谷值':
      return 'info'
    default:
      return ''
  }
}

// 从服务器获取统计数据
const fetchStatisticsData = async () => {
  loading.value = true;
  noDataMessage.value = ''; // 重置消息
  
  try {
    // 构建请求参数
    const params = new URLSearchParams({
      building: props.building,
      timeType: currentView.value
    })
    console.log(params);
    
    // 调用后端API获取数据
    const response = await fetch(`/express/energy-saving/chart?${params}`)
    const result = await response.json()
    
    if (result.success && result.data) {
      // 检查是否全部为0
      const isAllZero = result.data.isAllZero || (result.data.values && 
                       result.data.values.length > 0 &&
                       result.data.values.every(v => v === 0));
      
      if (isAllZero) {
        // 设置消息但仍使用正常数据流程
        noDataMessage.value = `${props.buildingLabel}在${viewLabels[currentView.value]}视图中暂无用电数据`;
      } else {
        noDataMessage.value = '';
      }
      
      // 对日视图数据进行处理 - 只显示最近7天的数据
      if (currentView.value === 'daily' && result.data.values && result.data.values.length > 7) {
        console.log('日视图数据截取最近7天')
        ChartdataVal.value = {
          dates: result.data.dates.slice(-7),
          values: result.data.values.slice(-7)
        }
      } else {
        // 使用真实数据，不再替换0值
        ChartdataVal.value = result.data
      }
    } else {
      console.error('获取统计数据失败:', result.message || '未知错误')
      ElMessage.error(`获取${props.buildingLabel}的${viewLabels[currentView.value]}视图数据失败`)
      
      // 设置无数据消息
      noDataMessage.value = `获取${props.buildingLabel}的${viewLabels[currentView.value]}视图数据失败`;
      
      // 设置空数据而不是默认数据
      ChartdataVal.value = {
        dates: [],
        values: []
      }
    }
    
    // 缓存当前视图数据
    cachedData.value[currentView.value] = ChartdataVal.value
    
    console.log(ChartdataVal.value);
    
    // 使用API返回的数据更新表格
    updateTableData()
    // 缓存统计数据
    cachedStatistics.value[currentView.value] = [...statisticsData.value]
    
    // 更新日期数据
    updateDailyData()
    // 缓存明细数据
    cachedDailyData.value[currentView.value] = [...dailyData.value]
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('网络请求失败，请检查网络连接')
    
    // 设置无数据消息
    noDataMessage.value = `网络请求失败，无法获取${props.buildingLabel}用电数据`;
    
    // 设置空数据而不是默认数据
    ChartdataVal.value = {
      dates: [],
      values: []
    }
    
    // 缓存当前视图数据
    cachedData.value[currentView.value] = ChartdataVal.value
    
    // 更新表格数据和日期数据
    updateTableData()
    // 缓存统计数据
    cachedStatistics.value[currentView.value] = [...statisticsData.value]
    
    updateDailyData()
    // 缓存明细数据
    cachedDailyData.value[currentView.value] = [...dailyData.value]
  } finally {
    loading.value = false
  }
}

// 使用ChartdataVal更新表格数据
const updateTableData = () => {
  if (!ChartdataVal.value || !ChartdataVal.value.values || ChartdataVal.value.values.length === 0) {
    // 如果没有数据，显示空的统计结果
    statisticsData.value = [
      {
        name: `${viewLabels[currentView.value]}用电量`,
        value: '-',
        unit: 'kWh',
        description: `${props.buildingLabel}${viewLabels[currentView.value]}度用电量`,
        type: 'normal'
      },
      {
        name: `${viewLabels[currentView.value]}平均用电量`,
        value: '-',
        unit: 'kWh',
        description: `${props.buildingLabel}${viewLabels[currentView.value]}平均用电量`,
        type: 'normal'
      },
      {
        name: '峰值用电',
        value: '-',
        unit: 'kWh',
        description: `${viewLabels[currentView.value]}最高用电量`,
        type: 'normal'
      }
    ]
    // 设置无数据消息
    noDataMessage.value = `${props.buildingLabel}在${viewLabels[currentView.value]}视图中暂无用电数据`;
    return
  }
  
  // 检查是否所有值都为0
  if (ChartdataVal.value.isAllZero) {
    noDataMessage.value = `${props.buildingLabel}在${viewLabels[currentView.value]}视图中暂无用电数据`;
  } else {
    noDataMessage.value = '';
  }
  
  try {
    const data = ChartdataVal.value
    // 解析数据并格式化
    const current = data.values ? data.values.reduce((a, b) => a + b, 0) : 0
    const average = data.values && data.values.length > 0 ? current / data.values.length : 0
    
    // 过滤出有效值（大于0）计算峰值
    const validValues = data.values.filter(v => v > 0)
    const peak = validValues.length > 0 ? Math.max(...validValues) : 0
    
    // 更新表格数据
    statisticsData.value = [
      {
        name: `${viewLabels[currentView.value]}用电量`,
        value: current.toFixed(2),
        unit: 'kWh',
        description: `${props.buildingLabel}${viewLabels[currentView.value]}度用电量`,
        type: 'normal'
      },
      {
        name: `${viewLabels[currentView.value]}平均用电量`,
        value: average.toFixed(2),
        unit: 'kWh',
        description: `${props.buildingLabel}${viewLabels[currentView.value]}平均用电量`,
        type: 'normal'
      },
      {
        name: '峰值用电',
        value: peak.toFixed(2),
        unit: 'kWh',
        description: `${viewLabels[currentView.value]}最高用电量`,
        type: 'normal'
      }
    ]
    
    // 如果数据中包含其他统计指标，也添加到表格
    if (data.additionalStats && Array.isArray(data.additionalStats)) {
      data.additionalStats.forEach(item => {
        if (item.name && item.value !== undefined) {
          statisticsData.value.push({
            name: item.name,
            value: typeof item.value === 'number' ? item.value.toFixed(2) : item.value,
            unit: item.unit || '',
            description: item.description || '',
            type: item.type || 'normal'
          })
        }
      })
    }
  } catch (error) {
    console.error('处理数据失败:', error)
    // 显示空的统计结果
    statisticsData.value = [
      {
        name: `${viewLabels[currentView.value]}用电量`,
        value: '-',
        unit: 'kWh',
        description: `${props.buildingLabel}${viewLabels[currentView.value]}度用电量`,
        type: 'normal'
      },
      {
        name: `${viewLabels[currentView.value]}平均用电量`,
        value: '-',
        unit: 'kWh',
        description: `${props.buildingLabel}${viewLabels[currentView.value]}平均用电量`,
        type: 'normal'
      },
      {
        name: '峰值用电',
        value: '-',
        unit: 'kWh',
        description: `${viewLabels[currentView.value]}最高用电量`,
        type: 'normal'
      }
    ]
    // 设置无数据消息
    noDataMessage.value = `${props.buildingLabel}在${viewLabels[currentView.value]}视图中暂无用电数据`;
  }
}

// 更新日期数据
const updateDailyData = () => {
  if (!ChartdataVal.value || !ChartdataVal.value.dates || !ChartdataVal.value.values ||
      ChartdataVal.value.dates.length === 0 || ChartdataVal.value.values.length === 0) {
    dailyData.value = []
    return
  }
  
  try {
    const data = ChartdataVal.value
    const dates = data.dates
    const values = data.values
    
    if (dates.length !== values.length) {
      console.warn('日期和数值数组长度不匹配')
      dailyData.value = []
      return
    }
    
    // 查找峰值和谷值索引
    const validValues = values.filter(v => v > 0)
    const peakValue = validValues.length > 0 ? Math.max(...validValues) : 0
    const peakIndex = values.indexOf(peakValue)
    
    const valleyValue = validValues.length > 0 ? Math.min(...validValues) : 0
    const valleyIndex = values.indexOf(valleyValue)
    
    // 生成日期数据
    dailyData.value = dates.map((date, index) => {
      let type = '正常'
      
      // 标记峰值和谷值
      if (index === peakIndex && values[index] > 0) {
        type = '峰值'
      } else if (index === valleyIndex && values[index] > 0) {
        type = '谷值'
      } else if (values[index] === 0) {
        type = '无数据'
      }
      
      // 节假日判断（这里需要真实逻辑）
      // 如果后端返回了日期类型，可以直接使用
      if (data.dateTypes && data.dateTypes[index]) {
        type = data.dateTypes[index]
      }
      
      return {
        date: date,
        value: values[index],
        unit: 'kWh',
        type: type
      }
    })
    
    // 根据视图类型可能需要进行额外处理
    if (currentView.value === 'monthly' || currentView.value === 'yearly') {
      // 按日期排序，最新的在前面
      dailyData.value = dailyData.value.sort((a, b) => {
        return new Date(b.date) - new Date(a.date)
      })
    } 
  } catch (error) {
    console.error('处理日期数据失败:', error)
    dailyData.value = []
  }
}

// 根据数据类型返回CSS类名
const getValueClass = (row) => {
  if (row.type === 'increase') {
    return 'text-red'
  } else if (row.type === 'decrease') {
    return 'text-green'
  } else {
    return 'text-normal'
  }
}
const exportToExcelDtil = () => {
  console.log('导出详细数据');
  try {
    // 创建工作簿对象
    const wb = XLSX.utils.book_new();
    
     // 如果有详细日期数据，也添加到工作簿中
     if (dailyData.value && dailyData.value.length > 0) {
      console.log('明细数据长度:', dailyData.value.length);
      console.log('明细数据第一条:', JSON.stringify(dailyData.value[0]));

      // 将dailyData转换为简单对象数组
      const detailData = dailyData.value.map(item => ({
        '日期': item.date,
        '用电量': typeof item.value === 'number' ? item.value.toFixed(2) : item.value,
        '单位': item.unit,
        '类型': item.type
      }));

      console.log('处理后的明细数据:', detailData);
      // 日期详情工作表
      if (detailData.length > 0) {
        const detailWS = XLSX.utils.json_to_sheet(detailData);
        XLSX.utils.book_append_sheet(wb, detailWS, '日期详细数据');
        console.log('已添加日期详细数据工作表');
      }
      const fileName = `${props.buildingLabel}用电统计_${viewLabels[currentView.value]}视图_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // 导出工作簿
    XLSX.writeFile(wb, fileName);
    ElMessage.success('导出成功');
    }
}catch(error){
  console.error('导出Excel失败:', error);
  ElMessage.error('导出失败，请稍后重试');
}
}

// 导出Excel函数
const exportToExcel = () => {
  try {
    // 创建工作簿对象
    const wb = XLSX.utils.book_new();
    
    // 创建主统计表数据
    const mainData = statisticsData.value.map(item => ({
      '指标': item.name,
      '数值': item.value,
      '单位': item.unit,
      '说明': item.description
    }));
    
    // 主统计表工作表
    const mainWS = XLSX.utils.json_to_sheet(mainData);
    XLSX.utils.book_append_sheet(wb, mainWS, '统计数据概览');
    
    // 如果有详细日期数据，也添加到工作簿中
    if (dailyData.value && dailyData.value.length > 0) {
      console.log('明细数据长度:', dailyData.value.length);
      console.log('明细数据第一条:', JSON.stringify(dailyData.value[0]));

      // 将dailyData转换为简单对象数组
      const detailData = dailyData.value.map(item => ({
        '日期': item.date,
        '用电量': typeof item.value === 'number' ? item.value.toFixed(2) : item.value,
        '单位': item.unit,
        '类型': item.type
      }));

      console.log('处理后的明细数据:', detailData);
      // 日期详情工作表
      if (detailData.length > 0) {
        const detailWS = XLSX.utils.json_to_sheet(detailData);
        XLSX.utils.book_append_sheet(wb, detailWS, '日期详细数据');
        console.log('已添加日期详细数据工作表');
      }
    }
    
    // 检查工作表结构
    console.log('工作表名称:', wb.SheetNames);
    console.log('工作簿:', wb);
    // 生成文件名
    const fileName = `${props.buildingLabel}用电统计_${viewLabels[currentView.value]}视图_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // 导出工作簿
    XLSX.writeFile(wb, fileName);
    ElMessage.success('导出成功');
  } catch (error) {
    console.error('导出Excel失败:', error);
    ElMessage.error('导出失败，请稍后重试');
  }
};

// 预加载所有视图数据
const preloadAllViewData = async () => {
  // 保存当前视图设置
  const originalView = currentView.value
  
  // 先加载当前视图数据
  await fetchStatisticsData()
  
  // 然后依次加载其他视图数据
  const allViews = ['daily', 'monthly', 'yearly']
  
  for (const view of allViews) {
    if (view !== originalView) {
      // 临时切换视图
      currentView.value = view
      
      // 加载该视图数据
      await fetchStatisticsData()
    }
  }
  
  // 加载完成后，恢复原始视图设置
  currentView.value = originalView
  
  // 确保显示的是原始视图的数据
  if (cachedData.value[originalView]) {
    ChartdataVal.value = cachedData.value[originalView]
  }
  
  if (cachedStatistics.value[originalView]) {
    statisticsData.value = cachedStatistics.value[originalView]
  }
  
  if (cachedDailyData.value[originalView]) {
    dailyData.value = cachedDailyData.value[originalView]
  }
  
  console.log('所有视图数据预加载完成，恢复为', originalView, '视图')
}

// 清空缓存数据
const clearCachedData = () => {
  cachedData.value = {
    daily: null,
    monthly: null,
    yearly: null
  }
  
  cachedStatistics.value = {
    daily: null,
    monthly: null,
    yearly: null
  }
  
  cachedDailyData.value = {
    daily: null,
    monthly: null,
    yearly: null
  }
}

// 监听building变化
watch(() => props.building, (newBuilding) => {
  console.log(`Building changed to: ${newBuilding}`)
  
  // 清空缓存
  clearCachedData()
  
  // 重新预加载所有视图数据
  preloadAllViewData()
})

// 初始化
onMounted(() => {
  // 确保默认视图是daily
  currentView.value = 'daily'
  // 预加载所有视图数据
  preloadAllViewData()
  
  // 初始化趋势图
  nextTick(() => {
    initTrendChart()
  })
  
  // 监听窗口大小变化，调整图表尺寸
  window.addEventListener('resize', () => {
    trendChart?.resize()
  })
})

// 组件销毁时清空缓存
onUnmounted(() => {
  // 清空缓存数据
  clearCachedData()
  
  // 清理图表实例
  if (trendChart) {
    trendChart.dispose()
    trendChart = null
  }
  
  // 移除窗口事件监听
  window.removeEventListener('resize', trendChart?.resize)
})

// 初始化趋势图
const initTrendChart = () => {
  if (!trendChartRef.value) return
  
  // 获取当前视图数据
  const data = ChartdataVal.value
  
  // 检查数据是否为空
  hasChartData.value = data && data.dates && data.values && 
                      data.dates.length > 0 && 
                      data.values.length > 0 &&
                      !data.values.every(v => v === 0)
  
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#ccc',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      },
      padding: [8, 12],
      formatter: (params) => {
        if (!hasChartData.value) {
          return '<div style="text-align:center;font-weight:bold;color:#F56C6C;padding:5px;">当前无用电数据</div>'
        }
        const param = params[0]
        return `<div style="font-weight:bold;margin-bottom:5px;">${param.name}</div>
                <div style="display:flex;align-items:center;">
                  <span style="display:inline-block;width:10px;height:10px;background-color:${param.color};margin-right:5px;border-radius:50%;"></span>
                  <span>${param.seriesName}:</span>
                  <span style="font-weight:bold;color:#409EFF;margin-left:5px;">${param.value} kWh</span>
                </div>`
      }
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
  
  // 如果没有数据，添加提示信息图形
  if (!hasChartData.value) {
    option.graphic = [
      {
        type: 'text',
        left: 'center',
        top: 'middle',
        style: {
          text: '暂无用电数据',
          fontSize: 16,
          fontWeight: 'bold',
          fill: '#F56C6C'
        }
      }
    ];
  }
  
  trendChart.setOption(option)
}

// 更新趋势图
const updateTrendChart = () => {
  if (trendChart) {
    initTrendChart()
  }
}

// 监听数据变化，更新趋势图
watch(() => ChartdataVal.value, () => {
  nextTick(() => {
    updateTrendChart()
  })
}, { deep: true })

// 在视图变化时更新趋势图
watch(currentView, () => {
  nextTick(() => {
    updateTrendChart()
  })
})
</script>
  
<style scoped>
.building-statistics {
  width: 100%;
  padding: 16px;
}

.building-title {
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: bold;
  color: var(--el-color-primary);
  border-bottom: 1px solid var(--el-border-color-light);
  padding-bottom: 10px;
}

.view-selector {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.trend-chart {
  margin-top: 20px;
}

.chart-container {
  height: 300px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.no-data-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 10;
  opacity: 1;
  transition: opacity 0.3s;
  pointer-events: none;
}

.no-data-text {
  font-size: 18px;
  color: #606266;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.text-red {
  color: #f56c6c;
}

.text-green {
  color: #67c23a;
}

.text-normal {
  color: var(--el-text-color-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .building-statistics {
    padding: 8px;
  }
  
  .building-title {
    font-size: 16px;
  }
}

.no-data-message {
  margin-top: 15px;
  margin-bottom: 15px;
}
</style>