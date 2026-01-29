<template>
  <div class="exam-container">
    <!-- 第一层：考试统计 -->
    <div class="exam-section">
      <h2 class="section-title">考试统计</h2>
      <div class="exam-table-container">
        <el-table :data="exams" style="width: 100%" stripe border>
          <el-table-column prop="title" label="考试名称"></el-table-column>
          <el-table-column prop="startTime" label="考试时间" width="180"></el-table-column>
          <el-table-column prop="endTime" label="截至时间" width="180"></el-table-column>
          <el-table-column prop="duration" label="考试时长（分钟）" width="150"></el-table-column>
          <el-table-column prop="status" label="考试状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)">
                {{ row.status == 0 ? '未开始' : row.status === 1 ? '进行中' : '已结束' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small" 
                class="start-button" 
                @click="handleStartExam(row)" 
                :disabled="row.status === 2 || isAfterEndTime(row.endTime)">开始考试</el-button>
              <el-button type="danger" size="small" class="delete-button" @click="handleDeleteExam(row)">删除考试</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 第二层：考生统计 -->
    <div class="student-section">
      <h2 class="section-title">考生统计</h2>
      <div class="student-table-container">
        <el-button type="primary" size="small" @click="handleRefreshStats">刷新统计</el-button>
        <el-table :data="studentStats.filter(item => item.hasValidDetail)" style="width: 100%" stripe border v-loading="loadingStats">
          <el-table-column prop="id" label="用户ID" width="100"></el-table-column>
          <el-table-column prop="exam_title" label="考试名称"></el-table-column>
          <el-table-column prop="submit_time" label="提交时间" width="180"></el-table-column>
          <el-table-column prop="score" label="得分" width="100">
            <template #default="{ row }">
              <span>{{ row.score }} / {{ row.total_score }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="correct_rate" label="正确率" width="100">
            <template #default="{ row }">
              <el-progress :percentage="row.correct_rate || 0" :format="percentFormat"></el-progress>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="viewAnswerDetail(row)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 答题详情对话框 -->
      <el-dialog v-model="answerDetailVisible" title="答题详情" width="80%">
        <div v-if="answerDetail">
          <div class="answer-detail-header">
            <h3>{{ answerDetail.exam_title }}</h3>
            <div class="stats">
              <div class="stat-item">得分: {{ answerDetail.score }} / {{ answerDetail.total_score }}</div>
              <div class="stat-item">提交时间: {{ answerDetail.submit_time }}</div>
              <div class="stat-item">正确率: {{ percentFormat(answerDetail.correct_rate) }}</div>
            </div>
          </div>
          
          <div class="questions-review">
            <div v-for="(question, index) in answerDetail.questions" :key="question.id" class="question-item">
              <div class="question-header">
                <span class="question-number">{{ index + 1 }}</span>
                <span class="question-type">[{{ getQuestionTypeText(question.type) }}]</span>
                <span class="question-score">{{ question.user_score }}分</span>
                <span :class="['question-result', question.is_correct ? 'correct' : 'incorrect']">
                  {{ question.is_correct ? '正确' : '错误' }}
                </span>
              </div>
              <div class="question-content">
                <div class="question-title">
                  <span class="title-label">题目：</span>
                  <span>{{ question.question_content }}</span>
                </div>
                <div class="options-container" v-if="question.options && question.options.length > 0">
                  <div v-for="option in question.options" :key="option.value" 
                       :class="['option-item', 
                                isCorrectOption(question, option) ? 'correct' : '',
                                isSelectedOption(question, option) ? 'selected' : '']">
                    <div class="option-content">
                      <span class="option-label">{{ option.label }}.</span>
                      <div class="option-text">{{ cleanOptionText(option.text, option.label) }}</div>
                    </div>
                  </div>
                  <!-- 调试信息 -->
                  <div class="debug-info" v-if="false">
                    <pre>{{ JSON.stringify(question.options, null, 2) }}</pre>
                  </div>
                </div>
                <div class="options-container" v-else>
                  <div class="no-options-message">此题暂无选项信息</div>
                </div>
                <div class="answer-summary">
                  <div class="answer-item">
                    <span class="answer-label">我的答案:</span>
                    <span :class="['answer-value', question.is_correct ? 'answer-correct' : 'answer-wrong']">
                      {{ formatAnswer(question.user_answer, question.type) }}
                    </span>
                  </div>
                  <div class="answer-item">
                    <span class="answer-label">正确答案:</span>
                    <span :class="['answer-value', 'answer-correct']">
                      {{ formatAnswer(question.correct_answer, question.type) }}
                    </span>
                  </div>
                  <div class="answer-item" v-if="question.is_correct">
                    <span class="score-label">得分:</span>
                    <span class="score-value">{{ question.user_score }}分</span>
                  </div>
                  <div class="answer-item" v-else>
                    <span class="score-label">得分:</span>
                    <span class="score-value">0分</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-dialog>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { getExamList } from '@/api/Answermodule/exam';
import { onMounted } from 'vue'
import { formatDate } from '@/utils/format';
import { deleteExam } from '@/api/Answermodule/exam';
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { startExam } from '@/api/Answermodule/exam'
import { getExamHistory, getAnswerDetail } from '@/api/Answermodule/exam';
import { useUserStore } from '@/pinia/modules/user'
import { getExamAnswersALLList } from '@/api/Answermodule/examAnswers'

const router = useRouter()
const userStore = useUserStore()
// 默认选择的用户ID，从sessionStorage中获取
const selectedUsers = ref(sessionStorage.getItem('selectedUsers') || userStore.userInfo.ID)
// 选择的题目信息
const selected_question = ref(JSON.parse(sessionStorage.getItem('selected_question') || '[]'))
// 考试答案信息
const exam_answers = ref(JSON.parse(sessionStorage.getItem('exam_answers') || '[]'))

onMounted(() => {
  if(userStore.userInfo.authority.authorityId === 8580){
    console.log('用户ID为4，显示全部考试信息');
    GetAllAnswerDetail();
  } else {
    getExamList().then(res => {
      res.data.list.forEach(item => {
        item.startTime = formatDate(item.startTime);
        item.endTime = formatDate(item.endTime);
        
        // 检查截止时间是否已过
        const now = new Date();
        const endTime = new Date(item.endTime);
        if (now > endTime && item.status !== 2) {
          item.status = 2; // 设置状态为已结束
        }
      });
      exams.value = res.data.list;
    });
    
    // 只有在非管理员模式下才加载当前用户的考试统计数据
    refreshStudentStats();
  }
  handleRefreshStats()
  getStatusTagType();
})

// 模拟考试数据
const exams = ref([{}]);

// 考生统计相关数据
const studentStats = ref([]);
const loadingStats = ref(false);
const answerDetailVisible = ref(false);
const answerDetail = ref(null);
// 刷新考生统计数据
const refreshStudentStats = async () => {
  loadingStats.value = true;
  try {
    const res = await getExamHistory(userStore.userInfo.ID);
   
    if (res.code === 0 && res.data.history) {
      // 过滤掉deleted_at有值的记录
      const filteredHistory = res.data.history.filter(item => !item.deleted_at && !item.deletedAt);
      
      // 为每条记录添加hasValidDetail属性，默认为true
      filteredHistory.forEach(item => {
        item.hasValidDetail = true;
      });
      
      studentStats.value = filteredHistory;
      console.log("更新后的studentStats:", studentStats.value);
    } else {
      ElMessage.warning(res.msg || '暂无考试记录');
      studentStats.value = [];
    }
  } catch (error) {
    console.error('获取考试记录错误:', error);
    ElMessage.error('获取考试记录失败');
    studentStats.value = [];
  } finally {
    loadingStats.value = false;
  }
};

//获取全部数据
const GetAllAnswerDetail = async () => {
  loadingStats.value = true;
  try {
    // 获取所有考试列表
    const res = await getExamAnswersALLList();
  
    if (res.code === 0 && res.data && res.data.list) {
      // 1. 处理exams数据 - 过滤已删除的记录并格式化日期
      const filteredExams = res.data.list.filter(item => !item.deleted_at && !item.deletedAt);
      
      filteredExams.forEach(item => {
        item.startTime = item.startTime ? formatDate(item.startTime) : '';
        item.endTime = item.endTime ? formatDate(item.endTime) : '';
       console.log("item",item.selectedUsers)
        if (item.endTime) {
          const now = new Date();
          const endTime = new Date(item.endTime);
          if (now > endTime && item.status !== 2) {
            item.status = 2;
          }
        }
      });
      
      // 更新考试列表
      exams.value = filteredExams;
      
      // 2. 创建考生统计数据
      const statsData = [];
      
      // 用于获取每个考试的答题详情
      const getExamScores = async (examId, userId) => {
        try {
          const detailRes = await getAnswerDetail({
            userId: userId,
            examId: examId
          });
          
          if (detailRes.code === 0 && detailRes.data.detail) {
            const detail = detailRes.data.detail;
            return {
              score: detail.score || 0,
              total_score: detail.total_score || 100,
              correct_rate: detail.correct_rate || 0,
              submit_time: detail.submit_time ? formatDate(detail.submit_time) : formatDate(new Date()),
              hasValidDetail: true
            };
          }
          
          // 如果没有找到答题详情，使用默认值
          return {
            score: 0,
            total_score: 100,
            correct_rate: 0,
            submit_time: formatDate(new Date()),
            hasValidDetail: false
          };
        } catch (error) {
          console.error(`获取考试ID ${examId}, 用户ID ${userId} 的答题详情失败:`, error);
          return {
            score: 0,
            total_score: 100,
            correct_rate: 0,
            submit_time: formatDate(new Date()),
            hasValidDetail: false
          };
        }
      };
      
      // 对每个考试获取答题详情并构建统计数据
      for (const exam of filteredExams) {
        const examId = exam.ID || exam.id;
        
        // 解析selectedUsers，如果是字符串则转为数组
        let selectedUserIds = [];
        try {
          if (exam.selectedUsers) {
            if (typeof exam.selectedUsers === 'string') {
              selectedUserIds = JSON.parse(exam.selectedUsers);
            } else if (Array.isArray(exam.selectedUsers)) {
              selectedUserIds = exam.selectedUsers;
            } else {
              selectedUserIds = [exam.selectedUsers];
            }
          }
        } catch (error) {
          console.error('解析selectedUsers出错:', error);
          continue;
        }
        
        console.log("考试ID:", examId, "选定用户:", selectedUserIds);
        
        // 为每个选定的用户创建统计项
        if (selectedUserIds.length > 0) {
          for (const userId of selectedUserIds) {
            // 创建一个临时记录，稍后将更新其分数
            const statsItem = {
              id: userId,
              exam_id: examId,
              exam_title: exam.title || "考试",
              submit_time: formatDate(new Date()),
              score: 0,
              total_score: 100,
              correct_rate: 0,
              hasValidDetail: false
            };
            
            statsData.push(statsItem);
            
            // 异步获取答题详情并更新统计数据
            getExamScores(examId, userId).then(scoreData => {
              statsItem.score = scoreData.score;
              statsItem.total_score = scoreData.total_score;
              statsItem.correct_rate = scoreData.correct_rate;
              statsItem.submit_time = scoreData.submit_time;
              statsItem.hasValidDetail = scoreData.hasValidDetail;
              // 手动触发响应式更新
              studentStats.value = [...statsData];
            });
          }
        } else {
          // 如果没有选定用户，使用selectedUsers.value
          const statsItem = {
            id: selectedUsers.value,
            exam_id: examId,
            exam_title: exam.title || "考试",
            submit_time: formatDate(new Date()),
            score: 0,
            total_score: 100,
            correct_rate: 0,
            hasValidDetail: false
          };
          
          statsData.push(statsItem);
          
          // 异步获取答题详情并更新统计数据
          getExamScores(examId, selectedUsers.value).then(scoreData => {
            statsItem.score = scoreData.score;
            statsItem.total_score = scoreData.total_score;
            statsItem.correct_rate = scoreData.correct_rate;
            statsItem.submit_time = scoreData.submit_time;
            statsItem.hasValidDetail = scoreData.hasValidDetail;
            // 手动触发响应式更新
            studentStats.value = [...statsData];
          });
        }
      }
      
      // 初始更新考生统计数据
      studentStats.value = statsData;
      console.log("更新初始studentStats:", studentStats.value);
    } else {
      ElMessage.warning(res.msg || '暂无考试记录');
      studentStats.value = [];
      exams.value = [];
    }
  } catch (error) {
    console.error('获取全部数据错误:', error);
    ElMessage.error('获取数据失败，请稍后重试');
    studentStats.value = [];
    exams.value = [];
  } finally {
    loadingStats.value = false;
  }
};

// 查看答题详情
const viewAnswerDetail = async (row) => {
  try {
    console.log(row);
    const res = await getAnswerDetail({
      userId: row.id,
      examId: row.exam_id
    });
    if (res.code === 0 && res.data.detail) {
      answerDetail.value = res.data.detail;
      console.log("答题详情数据:", answerDetail.value);
      console.log("题目数量:", answerDetail.value.questions.length);
      console.log("第一题信息:", answerDetail.value.questions[0]);
      console.log("第一题选项:", answerDetail.value.questions[0].options);
      
      answerDetailVisible.value = true;
    } else {
      ElMessage.warning(res.msg || '暂无答题详情');
    }
  } catch (error) {
    console.error('获取答题详情错误:', error);
  }
};

// 百分比格式化
const percentFormat = (percentage) => {
  return percentage ? `${percentage.toFixed(2)}%` : '0%';
};

// 获取题目类型文本
const getQuestionTypeText = (type) => {
  const typeMap = {
    'single': '单选题',
    'multiple': '多选题',
    'boolean': '判断题'
  };
  return typeMap[type] || '试题';
};

// 检查选项是否被选中
const isSelectedOption = (question, option) => {
  if (!question.user_answer) return false;
  
  if (Array.isArray(question.user_answer)) {
    // 多选题
    return question.user_answer.some(answer => 
      String(answer) === String(option.value)
    );
  } else {
    // 单选题或判断题
    return String(question.user_answer) === String(option.value);
  }
};

// 检查选项是否为正确答案
const isCorrectOption = (question, option) => {
  console.log("检查选项是否为正确答案",question,option);
  if (!question.correct_answer) return false;
  
  if (Array.isArray(question.correct_answer)) {
    // 多选题
    return question.correct_answer.some(answer => 
      String(answer) === String(option.value)
    );
  } else {
    // 单选题或判断题
    return String(question.correct_answer) === String(option.value);
  }
};

// 格式化答案显示
const formatAnswer = (answer, type) => {
  if (answer === null || answer === undefined) return '未答题';
  
  if (type === 'boolean') {
    // 判断题
    if (answer === true || answer === 1 || String(answer) === 'true' || String(answer) === '1') {
      return '√ 对';
    } else {
      return '× 错';
    }
  } else if (type === 'multiple' && Array.isArray(answer)) {
    // 多选题
    return answer.join(', ');
  } else if (Array.isArray(answer)) {
    // 处理可能显示为数组的其他类型
    return answer.join(', ');
  } else {
    // 单选题或其他
    return String(answer);
  }
};

// 处理开始考试操作
const handleStartExam = (examItem) => {
  console.log("开始考试，ID:", examItem);
  
  // 检查截止时间
  if (isAfterEndTime(examItem.endTime)) {
    ElMessage({
      type: 'warning',
      message: '考试已结束，无法开始'
    });
    return;
  }
  
  // 弹窗确认
  ElMessageBox.confirm('确定要开始考试吗？开始后不可暂停。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      // 直接传递examId值
      const res = await startExam(examItem);
      if (res.code === 0) {
        ElMessage({
          type: 'success',
          message: '考试已开始'
        });
        
        // 立即更新当前考试的状态为"进行中"
        const examId = examItem.ID || examItem.id;
        const examIndex = exams.value.findIndex(item => (item.ID === examId || item.id === examId));
        if (examIndex !== -1) {
          // 修改状态为"进行中"(1)
          exams.value[examIndex].status = 1;
          // 手动触发响应式更新
          exams.value = [...exams.value];
        }
        
      } else {
        ElMessage.error(res.msg || '开始考试失败');
      }
    } catch (error) {
      console.error('开始考试错误:', error);
      ElMessage.error('网络错误，请稍后重试');
    }
  }).catch(() => {
    // 用户取消操作
    ElMessage({
      type: 'info',
      message: '已取消开始考试'
    });
  });
};
// 处理删除考试操作
const handleDeleteExam = (examId) => {
  console.log("删除考试了",examId.ID);
  deleteExam({ID:examId.ID}).then(res => {
    if(res.code === 0){
      ElMessage({
        type: 'success',
        message: '删除成功'
      })
      getExamList().then(res => {
        res.data.list.forEach(item => {
          item.startTime = formatDate(item.startTime);
          item.endTime = formatDate(item.endTime);
          
          // 检查截止时间是否已过，但保持数字状态值
          const now = new Date();
          const endTime = new Date(item.endTime);
          if (now > endTime && item.status !== 2) {
            item.status = 2; // 设置状态为已结束
          }
          // 不要覆盖原有的状态值为字符串
        });
        exams.value = res.data.list;
      })
    }else{
      ElMessage({
        type: 'error',
        message: '删除失败'
      })
    }
  })
};
// 根据考试状态返回对应的标签类型
const getStatusTagType = (statusCode) => {
  // 将状态码映射到状态文本
  const statusMap = {
    0: '未开始',
    1: '进行中',
    2: '已结束'
  };

  // 获取状态文本
  const status = statusMap[statusCode] || '';
  console.log(status);

  // 根据状态文本返回对应的标签类型
  switch (status) {
    case '未开始':
      return 'info';
    case '进行中':
      return 'success';
    case '已结束':
      return 'danger';
    default:
      return '';
  }
};

// 处理选项内容，移除可能的标签前缀
const cleanOptionText = (text, label) => {
  if (!text) return '';
  
  // 检查是否是特殊格式（如对象等）
  if (typeof text === 'object') {
    return JSON.stringify(text);
  }
  
  let cleanedText = String(text);
  
  // 移除可能存在的选项标签前缀，如 "A." "A:" "(A)" 等
  const prefixPatterns = [
    new RegExp(`^${label}[.、:：\\s]+`),
    new RegExp(`^\\(?${label}\\)?[.、:：\\s]+`),
    new RegExp(`^选项\\s?${label}[.、:：\\s]*`)
  ];
  
  for (const pattern of prefixPatterns) {
    cleanedText = cleanedText.replace(pattern, '');
  }
  
  // 确保JSON字符串显示更友好
  if (cleanedText.startsWith('{') || cleanedText.startsWith('[')) {
    try {
      const obj = JSON.parse(cleanedText);
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      // 如果不是有效的JSON，继续使用原始文本
    }
  }
  
  return cleanedText.trim() || `选项${label}`;
};

// 判断当前时间是否已超过截止时间
const isAfterEndTime = (endTimeStr) => {
  const now = new Date();
  const endTime = new Date(endTimeStr);
  return now > endTime;
};

// 处理刷新统计按钮点击
const handleRefreshStats = () => {
  if (userStore.userInfo.ID === 4 || userStore.userInfo.id === 4) {
    // 如果当前是用户ID为4，则刷新全部数据
    GetAllAnswerDetail();
  } else {
    // 否则只刷新当前用户的考试历史
    refreshStudentStats();
  }
};

</script>

<style scoped>
.exam-container {
  padding: 20px;
  background-color: var(--el-bg-color-page, #1e1e2d);
  min-height: 100vh;
}

.exam-section, .student-section {
  background-color: var(--el-bg-color, #2d2d3d);
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.2);
  margin-bottom: 20px;
  padding: 24px;
}

.section-title {
  margin: 0 0 24px 0;
  font-size: 16px;
  color: var(--el-text-color-primary, #ffffff);
  font-weight: 500;
  position: relative;
  padding-left: 12px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background-color: var(--el-color-primary, #409eff);
  border-radius: 2px;
}

.exam-table-container, .student-table-container {
  margin-top: 16px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

:deep(.el-table) {
  border-radius: 4px;
  overflow: hidden;
  background-color: var(--el-bg-color, #2d2d3d);
  color: var(--el-text-color-primary, #ffffff);
}

:deep(.el-table th) {
  background-color: var(--el-bg-color-page, #1e1e2d);
  color: var(--el-text-color-primary, #ffffff);
  font-weight: 500;
  padding: 8px 0;
}

:deep(.el-table td) {
  padding: 8px 0;
  background-color: var(--el-bg-color, #2d2d3d);
  color: var(--el-text-color-primary, #ffffff);
}

:deep(.el-table .cell) {
  padding-left: 8px;
  padding-right: 8px;
}

.start-button {
  margin-left: 8px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
 
  font-size: 13px;
}

.delete-button {
  background-color: #f56c6c;
  color: white;
  border: none;
  border-radius: 4px;
  margin-left: 8px;
  font-size: 13px;
}

.start-button:hover {
  background-color: #66b1ff;
}

.delete-button:hover {
  background-color: #ff7875;
}

:deep(.el-tag) {
  border-radius: 4px;
  padding: 0 12px;
  height: 28px;
  line-height: 28px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

:deep(.el-tag--info) {
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
  color: #e6a23c;
  box-shadow: 0 2px 4px rgba(230, 162, 60, 0.2);
  border: 1px solid rgba(230, 162, 60, 0.2);
}

:deep(.el-tag--success) {
  background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
  color: #67c23a;
  box-shadow: 0 2px 4px rgba(103, 194, 58, 0.2);
  border: 1px solid rgba(103, 194, 58, 0.2);
}

:deep(.el-tag--danger) {
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
  color: #f56c6c;
  box-shadow: 0 2px 4px rgba(245, 108, 108, 0.2);
  border: 1px solid rgba(245, 108, 108, 0.2);
}

/* 答题详情样式 */
.answer-detail-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--el-border-color, #e0e0e0);
}

.answer-detail-header h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: var(--el-text-color-primary, #333);
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.stat-item {
  background-color: var(--el-fill-color-light, #f5f7fa);
  padding: 5px 12px;
  border-radius: 4px;
  font-size: 14px;
  color: var(--el-text-color-secondary, #666);
}

.questions-review {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.question-item {
  background-color: var(--el-bg-color, #fff);
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.question-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.question-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: #409eff;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
}

.question-type {
  background-color: #ecf5ff;
  color: #409eff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.question-score {
  color: #e6a23c;
  font-weight: bold;
  font-size: 14px;
  margin-right: 10px;
}

.question-result {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
}

.question-result.correct {
  background-color: var(--el-color-success-light-9, #f0f9eb);
  color: var(--el-color-success, #67c23a);
}

.question-result.incorrect {
  background-color: var(--el-color-danger-light-9, #fef0f0);
  color: var(--el-color-danger, #f56c6c);
}

.question-title {
  margin-bottom: 15px;
  font-weight: 500;
  line-height: 1.6;
  display: flex;
  flex-wrap: wrap;
}

.question-content {
  flex: 1;
  font-size: 14px;
  padding: 0 10px;
}

.title-label {
  font-weight: bold;
  margin-right: 8px;
  color: var(--el-color-primary, #409eff);
}

.options-container {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
  padding-left: 15px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  padding: 10px 15px;
  border-radius: 4px;
  background-color: var(--el-fill-color-light, #f5f7fa);
  position: relative;
  transition: all 0.3s ease;
  margin-bottom: 10px;
  width: 100%;
  border-left: 3px solid transparent;
}

.option-item.selected {
  background-color: var(--el-color-primary-light-9, #e6f7ff);
  border-left: 3px solid var(--el-color-primary, #409eff);
}

.option-item.correct {
  background-color: var(--el-color-success-light-9, #f0f9eb);
  border-left: 3px solid var(--el-color-success, #67c23a);
}

.option-content {
  display: flex;
  width: 100%;
}

.option-label {
  font-weight: bold;
  margin-right: 10px;
  color: var(--el-color-primary, #409eff);
  flex-shrink: 0;
  min-width: 20px;
}

.option-text {
  color: var(--el-text-color-primary, #303133);
  white-space: normal;
  word-break: break-word;
  line-height: 1.5;
  flex: 1;
}

.answer-summary {
  margin-top: 15px;
  padding: 12px 15px;
  background-color: var(--el-fill-color-blank, #f9fafc);
  border-radius: 6px;
  border-left: 3px solid var(--el-color-primary, #409eff);
}

.answer-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.answer-label {
  font-weight: bold;
  margin-right: 8px;
  min-width: 60px;
}

.answer-value {
  display: flex;
}

.answer-value.answer-correct {
  color: var(--el-color-success, #67c23a);
  font-weight: 600;
}

.answer-value.answer-wrong {
  color: var(--el-color-danger, #f56c6c);
  font-weight: 600;
}

.score-label {
  font-weight: bold;
  margin-right: 8px;
  min-width: 30px;
}

.score-value {
  font-weight: 600;
  color: var(--el-color-success, #67c23a);
}

.no-options-message {
  padding: 10px 15px;
  background-color: var(--el-color-warning-light-9, #fdf6ec);
  color: var(--el-color-warning, #e6a23c);
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
  margin-bottom: 15px;
}
</style>