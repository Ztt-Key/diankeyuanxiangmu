<template>
  <div>
    <!-- 有考试试题时显示答题页面 -->
    <div v-if="hasExam" class="exam-container">
      <div class="exam-header">
        <h2>{{ currentExam.title }}</h2>
        <div class="exam-timer" :class="{ 'timer-warning': remainingTime < 300 }">
          剩余时间: {{ formatTime(remainingTime) }}
        </div>
      </div>

      <div class="exam-body">
        <div class="question-list-sidebar">
          <div class="question-nav-title">题目导航</div>
          <div class="question-nav-items">
            <div
              v-for="(_, index) in questions"
              :key="index"
              class="question-nav-item"
              :class="{
                'active': currentQuestionIndex === index,
                'answered': isQuestionAnswered(index)
              }"
              @click="goToQuestion(index)"
            >
              {{ index + 1 }}
            </div>
          </div>
          <div class="exam-summary">
            <div class="summary-item">
              <span class="dot answered"></span>
              <span>已答: {{ answeredCount }}</span>
            </div>
            <div class="summary-item">
              <span class="dot unanswered"></span>
              <span>未答: {{ questions.length - answeredCount }}</span>
            </div>
          </div>
        </div>

        <div class="question-content">
          <div v-if="loading" class="loading-container">
            <el-skeleton :rows="10" animated />
          </div>
          <div v-else>
            <div class="question-header">
              <span class="question-type">
                {{ getQuestionTypeText(currentQuestion.type) }}
              </span>
              <span class="question-score">
                ({{ currentQuestion.score }} 分)
              </span>
            </div>

            <div class="question-text" v-html="currentQuestion.content"></div>

            <!-- 单选题 -->
            <div v-if="currentQuestion.type === 'single'" class="options single-choice">
              <el-radio-group :model-value="answers[currentQuestion.id]" @update:model-value="answers[currentQuestion.id] = $event">
                <el-radio
                  v-for="(option, index) in currentQuestion.options"
                  :key="index"
                  :label="option.value"
                  class="option-item"
                >
                  {{ option.label }}: {{ option.text }}
                </el-radio>
              </el-radio-group>
            </div>

            <!-- 多选题 -->
            <div v-else-if="currentQuestion.type === 'multiple'" class="options multiple-choice">
              <el-checkbox-group :model-value="answers[currentQuestion.id] || []" @update:model-value="answers[currentQuestion.id] = $event">
                <el-checkbox
                  v-for="(option, index) in currentQuestion.options"
                  :key="index"
                  :label="option.value"
                  class="option-item"
                >
                  {{ option.label }}: {{ option.text }}
                </el-checkbox>
              </el-checkbox-group>
            </div>

            <!-- 判断题 -->
            <div v-else-if="currentQuestion.type === 'boolean'" class="options boolean-choice">
              <el-radio-group :model-value="answers[currentQuestion.id]" @update:model-value="answers[currentQuestion.id] = $event">
                <template v-if="currentQuestion.options && currentQuestion.options.length > 0">
                  <el-radio
                    v-for="(option, index) in currentQuestion.options"
                    :key="index"
                    :label="option.value"
                    class="option-item"
                  >
                    {{ option.label }}: {{ option.text }}
                  </el-radio>
                </template>
                <template v-else>
                  <!-- 判断题的默认选项 -->
                  <el-radio :label="true" class="option-item">A: 正确</el-radio>
                  <el-radio :label="false" class="option-item">B: 错误</el-radio>
                </template>
              </el-radio-group>
            </div>

            <!-- 调试信息 -->
            <div v-if="showDebugInfo" class="debug-info">
              <h3>题目调试信息：</h3>
              <div>
                <p><strong>题目ID:</strong> {{ currentQuestion.id }}</p>
                <p><strong>题目类型:</strong> {{ currentQuestion.type }} {{ currentQuestion.type === 'boolean' ? '(判断题)' : '' }}</p>
                <p><strong>是否为判断题:</strong> {{ currentQuestion.is_boolean || currentQuestion.type === 'boolean' ? '是' : '否' }}</p>
                <p><strong>选项数量:</strong> {{ currentQuestion.options?.length || 0 }}个</p>
                <p><strong>原始选项数据:</strong></p>
                <pre>{{ JSON.stringify(currentQuestion.options_raw || currentQuestion.options, null, 2) }}</pre>
                <p><strong>格式化选项数据:</strong></p>
                <pre>{{ JSON.stringify(currentQuestion.options, null, 2) }}</pre>
                <p v-if="currentQuestion.type === 'boolean'"><strong>判断题Value类型:</strong> 
                  <span v-for="(option, index) in currentQuestion.options" :key="index">
                    {{ option.label }}: {{ typeof option.value }} ({{ option.value }}){{ index < currentQuestion.options.length - 1 ? ', ' : '' }}
                  </span>
                </p>
              </div>
            </div>

            <div class="question-navigation">
              <el-button 
                v-if="currentQuestionIndex > 0" 
                @click="prevQuestion"
              >
                上一题
              </el-button>
              <el-button 
                v-if="currentQuestionIndex < questions.length - 1" 
                type="primary" 
                @click="nextQuestion"
              >
                下一题
              </el-button>
              <el-button 
                v-if="currentQuestionIndex === questions.length - 1" 
                type="danger" 
                @click="confirmSubmit"
              >
                提交答卷
              </el-button>
              
              <!-- 调试按钮 -->
              <div class="debug-toggle" @click="toggleDebugInfo">
                {{ showDebugInfo ? '隐藏调试信息' : '显示调试信息' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 提交确认对话框 -->
      <el-dialog
        v-model="submitDialogVisible"
        title="确认提交"
        width="30%"
        :close-on-click-modal="false"
      >
        <span>
          您还有 <b>{{ questions.length - answeredCount }}</b> 道题目未回答，确定要提交吗？
        </span>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="submitDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitAnswers">确认提交</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 自动提交对话框 -->
      <el-dialog
        v-model="timeupDialogVisible"
        title="时间到"
        width="30%"
        :show-close="false"
        :close-on-click-modal="false"
      >
        <span>
          考试时间已到，系统将自动提交您的答案。
        </span>
        <template #footer>
          <span class="dialog-footer">
            <el-button type="primary" @click="submitAnswers">确认</el-button>
          </span>
        </template>
      </el-dialog>
    </div>

    <!-- 没有考试试题时显示提示信息 -->
    <div v-else class="no-exam-container">
    <div class="no-exam-card">
      <div class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </div>
      <h1 class="title">当前没有考试</h1>
      <p class="description">请耐心等待，考试安排将会及时通知您。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/pinia/modules/user'
import { getExamsByUserId, getExamQuestions, submitExamAnswers, getExamInfo } from '@/api/Answermodule/exam'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const userId = ref(userStore.userInfo.ID)

// 考试相关数据
const hasExam = ref(false)
const loading = ref(true)
const examList = ref([])
const currentExam = ref({})
const questions = ref([])
const currentQuestionIndex = ref(0)
const answers = ref({})
const remainingTime = ref(0)
const timer = ref(null)
const submitDialogVisible = ref(false)
const timeupDialogVisible = ref(false)
const showDebugInfo = ref(false)

// 获取当前问题
const currentQuestion = computed(() => {
  if (questions.value.length === 0) return {}
  return questions.value[currentQuestionIndex.value] || {}
})

// 已回答题目数量
const answeredCount = computed(() => {
  return Object.keys(answers.value).length
})

// 是否已回答该题目
const isQuestionAnswered = (index) => {
  const questionId = questions.value[index]?.id
  if (!questionId) return false
  
  const answer = answers.value[questionId]
  if (answer === undefined || answer === null) return false
  if (Array.isArray(answer) && answer.length === 0) return false
  
  return true
}

// 获取题目类型文本
const getQuestionTypeText = (type) => {
  const typeMap = {
    '单选题': '单选题',
    '多选题': '多选题',
    '判断题': '判断题'
  }
  return typeMap[type] || '未知类型'
}

// 格式化时间
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':')
}

// 跳转到指定题目
const goToQuestion = (index) => {
  currentQuestionIndex.value = index
}

// 上一题
const prevQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

// 下一题
const nextQuestion = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
  }
}

// 确认提交对话框
const confirmSubmit = () => {
  if (answeredCount.value < questions.value.length) {
    submitDialogVisible.value = true
  } else {
    submitAnswers()
  }
}

// 提交答案
const submitAnswers = async () => {
  submitDialogVisible.value = false
  timeupDialogVisible.value = false
  
  try {
    const submitData = {
      exam_id: currentExam.value.id,
      user_id: userId.value,
      answers: answers.value,
      submit_time: new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' })
    }
    
    const res = await submitExamAnswers(submitData)
    if (res.code === 0) {
      ElMessage.success('提交成功')
      // 刷新页面重新检查考试状态
      checkUserExams()
    } else {
      ElMessage.error(res.msg || '提交失败')
    }
  } catch (error) {
    console.error('提交答案错误:', error)
    ElMessage.error('网络错误，请稍后重试')
  }
}

// 倒计时
const startTimer = () => {
  if (timer.value) {
    clearInterval(timer.value)
  }
  
  timer.value = setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value--
    } else {
      clearInterval(timer.value)
      timeupDialogVisible.value = true
    }
  }, 1000)
}

// 警告用户离开页面
const confirmLeavePage = (e) => {
  if (hasExam.value) {
    e.preventDefault()
    e.returnValue = '考试正在进行中，确定要离开吗？'
    return '考试正在进行中，确定要离开吗？'
  }
}

// 检查用户是否有考试
const checkUserExams = async () => {
  loading.value = true;
  
  // 从URL获取考试ID参数
  const urlExamId = router.currentRoute.value.query.examId;
  
  if (urlExamId) {
    // 如果URL中有考试ID，直接加载该考试的题目
    try {
      const examIdNum = parseInt(urlExamId.toString());
      hasExam.value = true;
      
      // 加载考试信息
      const examInfo = await getExamInfo(examIdNum);
      if (examInfo && examInfo.code === 0 && examInfo.data) {
        currentExam.value = examInfo.data;
        
        // 加载考试题目
        await loadExamQuestions(examIdNum);
        
        // 设置倒计时
        remainingTime.value = currentExam.value.duration * 60;
        startTimer();
        
        // 添加离开页面确认
        window.addEventListener('beforeunload', confirmLeavePage);
      } else {
        ElMessage.error('获取考试信息失败');
        hasExam.value = false;
      }
      loading.value = false;
    } catch (error) {
      console.error('获取考试信息错误:', error);
      ElMessage.error('获取考试信息失败');
      hasExam.value = false;
      loading.value = false;
    }
  } else {
    // 常规逻辑：查询用户可参加的考试
    try {
      const res = await getExamsByUserId(userId.value);
      if (res.code === 0 && res.data.exams && res.data.exams.length > 0) {
        examList.value = res.data.exams;
        hasExam.value = true;
        
        // 加载第一个考试信息和题目
        currentExam.value = examList.value[0];
        loadExamQuestions(currentExam.value.id);
        
        // 设置倒计时
        remainingTime.value = currentExam.value.duration * 60;
        startTimer();
        
        // 添加离开页面确认
        window.addEventListener('beforeunload', confirmLeavePage);
      } else {
        hasExam.value = false;
        loading.value = false;
      }
    } catch (error) {
      console.error('获取考试列表错误:', error);
      ElMessage.error('获取考试列表失败');
      hasExam.value = false;
      loading.value = false;
    }
  }
}

// 加载考试题目
const loadExamQuestions = async (examId) => {
  try {
    const res = await getExamQuestions(examId)
    if (res.code === 0) {
      console.log('获取到的题目数据:', res.data.questions)
      
      // 处理题目选项
      if (res.data.questions && res.data.questions.length > 0) {
        res.data.questions.forEach((question, index) => {
          // 确保选项是数组格式
          if (!Array.isArray(question.options)) {
            console.warn(`题目${index+1}的选项不是数组格式，尝试解析...`)
            // 尝试解析选项
            try {
              if (typeof question.options === 'string' && question.options.trim()) {
                question.options = JSON.parse(question.options)
              } else {
                question.options = []
              }
            } catch (e) {
              console.error(`解析题目${index+1}的选项失败:`, e)
              question.options = []
            }
          }
          
          // 如果选项还不是数组，确保它是数组
          if (!Array.isArray(question.options)) {
            console.warn(`题目${index+1}的选项仍然不是数组格式，设置为空数组`)
            question.options = []
          }
          
          // 记录选项信息
          console.log(`题目${index+1}(ID=${question.id})的选项数量:`, question.options.length)
          console.log(`题目${index+1}的选项数据:`, question.options)
          
          // 对判断题特殊处理
          if (question.type === 'boolean') {
            console.log(`题目${index+1}是判断题，检查选项...`)
            
            // 如果没有选项或选项数量不对，添加标准选项
            if (!question.options || question.options.length < 2) {
              console.log(`题目${index+1}是判断题但选项不完整，添加标准选项`)
              question.options = [
                { value: true, label: 'A', text: '正确' },
                { value: false, label: 'B', text: '错误' }
              ]
            } else {
              // 检查选项中是否有true/false值
              let hasTrue = false
              let hasFalse = false
              
              question.options.forEach(opt => {
                // 标准化value值，确保boolean类型而非字符串
                if (opt.value === 'true' || opt.value === 'True' || 
                    opt.value === 'A' || opt.value === '正确') {
                  opt.value = true
                  hasTrue = true
                }
                
                if (opt.value === 'false' || opt.value === 'False' || 
                    opt.value === 'B' || opt.value === '错误') {
                  opt.value = false
                  hasFalse = true
                }
              })
              
              // 如果没有找到正确或错误选项，重置选项
              if (!hasTrue || !hasFalse) {
                console.log(`题目${index+1}的判断题选项不标准，重置为标准选项`)
                question.options = [
                  { value: true, label: 'A', text: '正确' },
                  { value: false, label: 'B', text: '错误' }
                ]
              }
            }
          }
        })
      }
      
      questions.value = res.data.questions || []
      currentQuestionIndex.value = 0
      answers.value = {}
    } else {
      ElMessage.error(res.msg || '获取考试题目失败')
    }
  } catch (error) {
    console.error('获取考试题目错误:', error)
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 切换调试信息显示状态
const toggleDebugInfo = () => {
  showDebugInfo.value = !showDebugInfo.value
}

onMounted(() => {
  checkUserExams()
})

onBeforeUnmount(() => {
  // 清除定时器
  if (timer.value) {
    clearInterval(timer.value)
  }
  
  // 移除事件监听
  window.removeEventListener('beforeunload', confirmLeavePage)
})
</script>

<style scoped>
/* 无考试状态样式 */
.no-exam-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: var(--el-bg-color-page, linear-gradient(135deg, #02132b, #011639));
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.no-exam-card {
  background: var(--el-bg-color, rgba(193, 201, 178, 0.9));
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid var(--el-border-color-light, rgba(255, 255, 255, 0.3));
  text-align: center;
  max-width: 400px;
  width: 100%;
  animation: fadeIn 1s ease-in-out;
}

.icon {
  margin-bottom: 20px;
}

.icon svg {
  width: 64px;
  height: 64px;
  stroke: var(--el-color-primary, #4a90e2);
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary, #333);
  margin-bottom: 10px;
}

.description {
  font-size: 16px;
  color: var(--el-text-color-secondary, #666);
  margin: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 考试答题页面样式 */
.exam-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 85px);
  background-color: var(--el-bg-color-page, #f5f7fa);
}

.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: var(--el-bg-color, white);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.exam-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--el-text-color-primary, inherit);
}

.exam-timer {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--el-color-primary, #409eff);
}

.timer-warning {
  color: var(--el-color-danger, #f56c6c);
  animation: blink 1s infinite;
}

.exam-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.question-list-sidebar {
  width: 200px;
  background-color: var(--el-bg-color, white);
  border-right: 1px solid var(--el-border-color-light, #ebeef5);
  display: flex;
  flex-direction: column;
  padding: 15px;
}

.question-nav-title {
  font-weight: bold;
  margin-bottom: 15px;
  text-align: center;
  color: var(--el-text-color-primary, inherit);
}

.question-nav-items {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.question-nav-item {
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  color: var(--el-text-color-primary, inherit);
}

.question-nav-item.active {
  background-color: var(--el-color-primary, #409eff);
  color: var(--el-color-white, white);
  border-color: var(--el-color-primary, #409eff);
}

.question-nav-item.answered {
  background-color: var(--el-color-success, #67c23a);
  color: var(--el-color-white, white);
  border-color: var(--el-color-success, #67c23a);
}

.question-nav-item.active.answered {
  background-color: var(--el-color-primary, #409eff);
  color: var(--el-color-white, white);
  border-color: var(--el-color-primary, #409eff);
  box-shadow: 0 0 0 2px var(--el-color-success-light-5, rgba(103, 194, 58, 0.5));
}

.exam-summary {
  margin-top: auto;
  padding-top: 15px;
  border-top: 1px solid var(--el-border-color-light, #ebeef5);
}

.summary-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  color: var(--el-text-color-primary, inherit);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}

.dot.answered {
  background-color: var(--el-color-success, #67c23a);
}

.dot.unanswered {
  background-color: var(--el-border-color, #dcdfe6);
}

.question-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: var(--el-bg-color, white);
  margin: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.question-header {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.question-type {
  font-weight: bold;
  color: var(--el-color-primary, #409eff);
}

.question-score {
  margin-left: 10px;
  color: var(--el-color-warning, #e6a23c);
}

.question-text {
  font-size: 1.1rem;
  margin-bottom: 20px;
  line-height: 1.6;
  color: var(--el-text-color-primary, inherit);
}

.options {
  margin-bottom: 30px;
}

.option-item {
  display: block;
  margin-bottom: 15px;
  color: var(--el-text-color-primary, inherit);
}

.question-navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.loading-container {
  padding: 20px;
}

@keyframes blink {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* 调试信息样式 */
.debug-info {
  margin-top: 20px;
  padding: 15px;
  background-color: var(--el-bg-color, white);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.debug-info h3 {
  font-weight: bold;
  margin-bottom: 10px;
  color: var(--el-text-color-primary, inherit);
}

.debug-info div {
  margin-bottom: 10px;
}

.debug-info p {
  margin: 0;
  color: var(--el-text-color-primary, inherit);
}

.debug-info strong {
  font-weight: bold;
  color: var(--el-text-color-primary, inherit);
}

.debug-info pre {
  margin-top: 5px;
  margin-bottom: 5px;
  padding: 5px;
  background-color: var(--el-fill-color-light, #f5f7fa);
  border-radius: 4px;
  overflow-x: auto;
  color: var(--el-text-color-primary, inherit);
}

.debug-toggle {
  cursor: pointer;
  color: var(--el-color-primary, #409eff);
  font-weight: bold;
}
</style>