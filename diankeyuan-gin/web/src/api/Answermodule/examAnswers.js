import service from '@/utils/request'
// @Tags ExamAnswers
// @Summary 创建答题记录表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.ExamAnswers true "创建答题记录表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /examAnswers/createExamAnswers [post]
export const createExamAnswers = (data) => {
  return service({
    url: '/examAnswers/createExamAnswers',
    method: 'post',
    data
  })
}

// @Tags ExamAnswers
// @Summary 删除答题记录表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.ExamAnswers true "删除答题记录表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /examAnswers/deleteExamAnswers [delete]
export const deleteExamAnswers = (params) => {
  return service({
    url: '/examAnswers/deleteExamAnswers',
    method: 'delete',
    params
  })
}

// @Tags ExamAnswers
// @Summary 批量删除答题记录表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除答题记录表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /examAnswers/deleteExamAnswers [delete]
export const deleteExamAnswersByIds = (params) => {
  return service({
    url: '/examAnswers/deleteExamAnswersByIds',
    method: 'delete',
    params
  })
}

// @Tags ExamAnswers
// @Summary 更新答题记录表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.ExamAnswers true "更新答题记录表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /examAnswers/updateExamAnswers [put]
export const updateExamAnswers = (data) => {
  return service({
    url: '/examAnswers/updateExamAnswers',
    method: 'put',
    data
  })
}

// @Tags ExamAnswers
// @Summary 用id查询答题记录表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query model.ExamAnswers true "用id查询答题记录表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /examAnswers/findExamAnswers [get]
export const findExamAnswers = (params) => {
  return service({
    url: '/examAnswers/findExamAnswers',
    method: 'get',
    params
  })
}

// @Tags ExamAnswers
// @Summary 分页获取答题记录表列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取答题记录表列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /examAnswers/getExamAnswersList [get]
export const getExamAnswersList = (params) => {
  return service({
    url: '/examAnswers/getExamAnswersList',
    method: 'get',
    params
  })
}

// @Tags ExamAnswers
// @Summary 不需要鉴权的答题记录表接口
// @accept application/json
// @Produce application/json
// @Param data query AnswermoduleReq.ExamAnswersSearch true "分页获取答题记录表列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /examAnswers/getExamAnswersPublic [get]
export const getExamAnswersPublic = () => {
  return service({
    url: '/examAnswers/getExamAnswersPublic',
    method: 'get',
  })
}
export const getExamAnswersALLList = () => {
  return service({
    url: '/exam/getExamList',
    method: 'get',
  })
}