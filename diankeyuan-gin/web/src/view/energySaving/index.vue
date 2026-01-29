<template>
  <div class="gva-container2">
    <!-- 楼栋切换 Tabs -->
    <el-tabs v-model="activeBuilding" class="mb-4">
      <el-tab-pane v-for="building in buildings" 
                   :key="building.value" 
                   :label="building.label" 
                   :name="building.value">
      </el-tab-pane>
    </el-tabs>

    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 py-2 gap-4 md:gap-2">
      <!-- 用电数据统计卡片 -->
      <!-- <gva-card custom-class="col-span-1 lg:col-span-2 h-48">
        <gva-chart :type="1" title="当月用电量" />
      </gva-card>
      <gva-card custom-class="col-span-1 lg:col-span-2 h-48">
        <gva-chart :type="2" title="环比变化" />
      </gva-card>
      <gva-card custom-class="col-span-1 lg:col-span-2 h-48">
        <gva-chart :type="3" title="同比变化" />
      </gva-card> -->

      <!-- 用电趋势图和用电占比 -->
      <div class="col-span-1 md:col-span-2 md:row-start-2 lg:col-span-6 col-start-1 row-span-2 grid grid-cols-4 gap-4">
        <gva-card
          :title="`${activeBuildingLabel}用电趋势`"
          custom-class="col-span-3 h-160"
        >
          <gva-chart 
            ref="chartRef"
            :type="4" 
            :building="activeBuilding" 
            @dataUpdate="handleChartDataUpdate"
          />
        </gva-card>

        <gva-card
          title="用电占比"
          custom-class="col-span-1 h-160"
        >
          <gva-chart 
            ref="pieChartRef"
            :type="5" 
            :building="activeBuilding" 
          />
        </gva-card>
      </div>
      
      <!-- AI总结模块 -->
      <gva-card
        title="分析总结"
        custom-class="col-span-1 md:col-span-2 md:row-start-4 lg:col-span-6 col-start-2 h-160"
      >
        <div 
          v-loading="aiLoading"
          element-loading-text="电力通用大模型分析中..."
          element-loading-background="rgba(0, 0, 0, 0.1)"
          id="aiSummaryContent"
        >
          <div class="p-4" v-html="formattedAiSummary" style="min-height: 300px;"></div>
        </div>
        <el-button type="primary" @click="exportToPdf">导出PDF</el-button>
      </gva-card>
   
      <!-- 配电室统计模块 -->
      <gva-card
        :title="`${activeBuildingLabel}用电统计`"
        custom-class="col-span-1 md:col-span-2 md:row-start-5 lg:col-span-6 col-start-1"
      >
        <BuildingStatistics 
          :building="activeBuilding" 
          :buildingLabel="activeBuildingLabel"
          :showTrend="false"
        />
      </gva-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useEnergySavingStore } from '@/pinia/modules/energySaving'
import { storeToRefs } from 'pinia'
import {
  GvaChart,
  GvaCard,
} from './components'
import { marked } from 'marked'
const store = useEnergySavingStore()
const { aiSummary, aiLoading, chartData, usageDistribution, isDataPreloaded } = storeToRefs(store)
import BuildingStatistics from './components/carts-BuildingStatistics.vue'
// 添加计算属性来处理 markdown
const formattedAiSummary = computed(() => {
  aiSummary.value = `
---
### **节能建议报告**

#### 一、用电趋势分析  
1. 数据显示10月至12月用电量维持在4800-5014度区间，11月出现小幅下降（-0.93%），12月反弹至峰值5014度，整体波动平稳。  
2. 1月至3月用电量为零，推测为数据缺失或季节性停产。若属正常停产，需核查设备待机能耗；若为数据异常，建议完善监测系统。  

#### 二、用电结构分析  
1. **动力设备主导（60%）**：生产设备（如电机、生产线）为主要耗能单元，需优先优化其运行效率。  
2. **消防系统占比偏高（10%）**：需排查是否包含非必要常开设备（如24小时排风机）。  
3. **其他系统占比合理**：照明（9%）、电梯（6%）、空调（5%）等占比较低，但仍存在优化空间。  

#### 三、节能建议  
**1. 动力设备优化（核心措施）**  
- **削峰填谷策略**：调整高耗能设备运行至电价低谷时段（如夜间），降低峰时负荷，减少电费支出。  
- **负载匹配优化**：避免设备"大马拉小车"，通过变频器或调整参数匹配实际生产需求，降低空载损耗。  

**2. 辅助系统精细化管理**  
- **照明系统**：利用自然光分区控制，无人区域设置自动关闭；检查现有灯具，替换损坏的镇流器（可降低5%-8%损耗）。  
- **电梯运行**：低峰时段（如午休、周末）停用部分电梯，或启用节能模式。  
- **空调系统**：冬季设定温度≤20℃，定期清洗滤网；利用定时功能避免非工作时间运行。  

**3. 消防与待机能耗排查**  
- 检查消防设备（如排烟风机）是否在非紧急情况下误启，优化控制逻辑。  
- 对停产期间动力设备彻底断电，避免待机功耗（待机功耗可占全年3%-10%）。  

**4. 能源管理强化**  
- 建立分项能耗台账，定位异常波动；  
- 培训员工节能操作规范（如设备启停顺序、温度设置标准）。  

---
**结论**：当前用电结构合理，核心节能潜力在于动力设备的运行策略优化与精细化管理，无需大规模设备改造即可实现能效提升。建议优先实施削峰填谷与负载匹配，预期可降低整体电耗8%-12%。`
  return aiSummary.value ? marked(aiSummary.value) : ''
})

defineOptions({
  name: 'Dashboard'
})

// 先声明所有需要的响应式变量
const activeBuilding = ref('A')


const buildings = [
  { label: 'A座配电室', value: 'A' },
  { label: 'B座配电室', value: 'B' },
  { label: 'C座配电室', value: 'C' },
  { label: 'D座配电室', value: 'D' },
]

const activeBuildingLabel = computed(() => {
  return buildings.find(b => b.value === activeBuilding.value)?.label || ''
})

// 添加图表引用
const chartRef = ref(null)

// 添加饼图引用
const pieChartRef = ref(null)

// 添加统计数据相关变量
const totalPowerConsumption = ref(0)
const averagePowerConsumption = ref(0)
const peakPowerConsumption = ref(0)
const energySavingRate = ref(0)

// 更新统计数据的方法
const updateStatistics = (data) => {
  if (!data || !data.values) return
  
  const values = data.values
  totalPowerConsumption.value = values.reduce((a, b) => a + b, 0).toFixed(2)
  averagePowerConsumption.value = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
  peakPowerConsumption.value = Math.max(...values).toFixed(2)
  
  // 计算节能率（示例：与上个月相比）
  const lastMonthValues = values.slice(0, Math.floor(values.length / 2))
  const currentMonthValues = values.slice(Math.floor(values.length / 2))
  
  if (lastMonthValues.length > 0) {
    const lastMonthAvg = lastMonthValues.reduce((a, b) => a + b, 0) / lastMonthValues.length
    const currentMonthAvg = currentMonthValues.reduce((a, b) => a + b, 0) / currentMonthValues.length
    energySavingRate.value = ((lastMonthAvg - currentMonthAvg) / lastMonthAvg * 100).toFixed(2)
  }
}

// 获取表格数据的方法（防止报错）
const fetchTableData = () => {
  console.log('Fetching table data...')
  // 实际项目中，这里应该调用API获取数据
}

// 修改handleChartDataUpdate方法
const handleChartDataUpdate = (data) => {
  console.log('Chart data updated:', data)
  if (!data) {
    console.warn('No data received in handleChartDataUpdate')
    return
  }

  // 检查数据格式是否正确
  if (!data.dates || !data.values) {
    console.warn('Invalid data format:', data)
    return
  }

  // 更新统计数据
  updateStatistics(data)
  
  // store 会自动处理 AI 分析
}

// 监听建筑物变化
watch(() => activeBuilding.value, async () => {
  console.log('Building changed to:', activeBuilding.value)
  // 等待下一个 tick，确保组件已经完全挂载
  await nextTick()
  
  // 直接调用 fetchData
  if (chartRef.value?.fetchData) {
    chartRef.value.fetchData()
  } else {
    console.warn('Chart fetchData method not found')
  }
  
  if (pieChartRef.value?.fetchData) {
    pieChartRef.value.fetchData()
  } else {
    console.warn('Pie chart fetchData method not found')
  }

  fetchTableData()
})

// 组件挂载时检查是否已预加载数据
onMounted(async () => {
  console.log('节能分析页面已挂载')
  
  // 检查数据是否已经准备好
  if (chartData.value && usageDistribution.value) {
    console.log('数据已预加载完成，直接使用')
    // 更新统计数据
    updateStatistics(chartData.value)
    return
  }
  
  // 如果数据未加载，检查sessionStorage中的缓存
  const cachedChartData = sessionStorage.getItem('energySavingData_A_daily')
  const cachedUsageData = sessionStorage.getItem('energySavingData_A_usage_day')
  
  if (cachedChartData && cachedUsageData) {
    console.log('从sessionStorage加载数据')
    try {
      const parsedChartData = JSON.parse(cachedChartData)
      const parsedUsageData = JSON.parse(cachedUsageData)
      
      // 更新store数据
      store.$patch({
        chartData: parsedChartData,
        usageDistribution: parsedUsageData,
        isDataPreloaded: true
      })
      
      // 更新统计数据
      updateStatistics(parsedChartData)
      return
    } catch (error) {
      console.error('缓存数据解析失败:', error)
    }
  }
  
  // 如果仍然没有数据，显示无数据提示
  console.log('未找到预加载数据，触发首次数据加载')
  
  // 只在初始加载时进行一次数据预加载
  await store.preloadAllBuildingsData()
  
  // 如果此时数据还是没有，显示无数据状态
  if (!chartData.value || !usageDistribution.value) {
    console.log('首次加载失败，显示无数据状态')
  }
})

// 导出PDF功能
const exportToPdf = () => {
  // 创建一个新窗口
  const printWindow = window.open('', '_blank');
  
  // 获取当前日期时间
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN');
  const timeStr = now.toLocaleTimeString('zh-CN');
  
  // 准备HTML内容
  printWindow.document.write(`
    <html>
      <head>
        <title>能源节约分析总结</title>
        <style>
          body {
            font-family: SimSun, serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #000;
          }
          .title {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 15px;
          }
          .subtitle {
            font-size: 16px;
            margin-bottom: 10px;
          }
          .content {
            line-height: 1.8;
            text-align: justify;
            font-size: 14px;
          }
          .footer {
            margin-top: 40px;
            font-size: 12px;
            color: #666;
            text-align: right;
          }
          .no-print {
            text-align: center;
            margin-top: 30px;
          }
          .print-btn {
            padding: 8px 20px;
            background-color: #409EFF;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin: 0 10px;
          }
          .close-btn {
            padding: 8px 20px;
            background-color: #909399;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin: 0 10px;
          }
          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">能源节约分析总结报告</div>
          <div class="subtitle">电力科学研究院能源节约管理系统</div>
        </div>
        
        <div class="content">
          ${formattedAiSummary.value || '暂无分析数据'}
        </div>
        
        <div class="footer">
          <p>生成时间: ${dateStr} ${timeStr}</p>
          <p>电力科学研究院 - 节能分析系统</p>
        </div>
        
        <div class="no-print">
          <button class="print-btn" onclick="window.print()">打印</button>
          <button class="close-btn" onclick="window.close()">关闭</button>
        </div>
      </body>
    </html>
  `);
  
  // 关闭文档写入
  printWindow.document.close();
};

</script>

<style lang="scss">
/* 移除 scoped，让样式全局生效 */
.ai-summary-container {
  padding: 1rem;
  
  ol {
    margin: 0;
    padding: 0;
    counter-reset: item;
    
    li {
      position: relative;
      padding-left: 2rem;
      color: #374151;
      line-height: 1.6;
      margin-bottom: 1rem;
      list-style: none;
      counter-increment: item;
      
      &::before {
        position: absolute;
        left: 0;
        font-weight: bold;
        color: #1890ff;
        content: counter(item) ".";
      }
    }
  }

  // 添加 strong 标签样式
  strong {
    color: #1890ff;
    font-weight: 500;
    padding: 2px 4px;
    background-color: rgba(24, 144, 255, 0.1);
    border-radius: 3px;
    transition: all 0.3s ease;
    
    &:hover {
      background-color: rgba(24, 144, 255, 0.2);
    }
  }
}

/* 统计卡片样式 */
.stat-card {
  display: flex;
  align-items: center;
  padding: 16px;
  height: 100%;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background-color: var(--el-color-primary-light-9);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  
  .el-icon {
    font-size: 24px;
    color: var(--el-color-primary);
  }
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

/* 表格分页样式 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 10px 0;
}

/* 表格样式优化 */
.el-table {
  margin-top: 10px;
  
  th {
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-weight: bold;
  }
  
  .el-table__row {
    &:hover {
      background-color: var(--el-color-primary-light-9);
    }
  }
}

/* 状态标签样式 */
.el-tag {
  border-radius: 4px;
  padding: 0 8px;
  height: 24px;
  line-height: 24px;
}

/* 筛选器容器样式 */
.filter-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 16px;
  
  .el-date-picker {
    margin-left: 16px;
  }
}
</style>
