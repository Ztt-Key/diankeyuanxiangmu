import service from '@/utils/request'

// @Tags Exam
// @Summary 创建考试
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.CreateExamRequest true "创建考试"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /exam/createExam [post]
export const createExam = (data) => {
  return service({
    url: '/exam/createExam',
    method: 'post',
    data
  })
}

// @Tags Exam
// @Summary 获取考试列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query request.ExamSearch true "获取考试列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /exam/getExamList [get]
export const getExamList = (params) => {
  return service({
    url: '/exam/getExamList',
    method: 'get',
    params
  })
} 
//删除试题
// @Tags Exam
// @Summary 删除考试
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.DeleteExamRequest true "删除考试"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /exam/deleteExam [delete]
export const deleteExam = (data) => {
  return service({
    url: '/exam/deleteExam',
    method: 'delete',
    data
  })
}

// 获取用户需要参加的考试列表
export const getExamsByUserId = (userId) => {
  return service({
    url: '/exam/getUserExams',
    method: 'post',
    data: { userId }
  })
}

// 获取考试题目
export const getExamQuestions = (examId) => {
  return service({
    url: '/exam/getQuestions',
    method: 'post',
    data: { examId }
  })
}

// 提交考试答案
export const submitExamAnswers = (data) => {
  return service({
    url: '/exam/submitAnswers',
    method: 'post',
    data
  })
}

// 获取用户的考试历史记录
export const getExamHistory = (userId) => {
  return service({
    url: '/exam/getUserHistory',
    method: 'post',
    data: { userId }
  })
}

// 获取答题详情
export const getAnswerDetail = (data) => {
  return service({
    url: '/exam/getAnswerDetail',
    method: 'post',
    data
  })
}

// 开始考试（修改考试状态为进行中）
export const startExam = (examId) => {
  // 确保examId是数字类型
  const id = typeof examId === 'object' ? (examId.id || examId.ID) : examId;
  
  return service({
    url: '/exam/startExam',
    method: 'post',
    data: { id }
  })
}

// 获取考试详细信息
export const getExamInfo = (examId) => {
  // 确保examId是数字类型
  const id = typeof examId === 'object' ? (examId.id || examId.ID) : examId;
  
  return service({
    url: '/exam/getExamInfo',
    method: 'post',
    data: { id }
  })
}