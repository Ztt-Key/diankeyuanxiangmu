import service from '@/utils/request'
// @Tags Questions
// @Summary 创建试题表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.Questions true "创建试题表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /questions/createQuestions [post]
export const createQuestions = (data) => {
  return service({
    url: '/questions/createQuestions',
    method: 'post',
    data
  })
}

// @Tags Questions
// @Summary 删除试题表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.Questions true "删除试题表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /questions/deleteQuestions [delete]
export const deleteQuestions = (params) => {
  return service({
    url: '/questions/deleteQuestions',
    method: 'delete',
    params
  })
}

// @Tags Questions
// @Summary 批量删除试题表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除试题表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /questions/deleteQuestions [delete]
export const deleteQuestionsByIds = (params) => {
  return service({
    url: '/questions/deleteQuestionsByIds',
    method: 'delete',
    params
  })
}

// @Tags Questions
// @Summary 更新试题表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.Questions true "更新试题表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /questions/updateQuestions [put]
export const updateQuestions = (data) => {
  return service({
    url: '/questions/updateQuestions',
    method: 'put',
    data
  })
}

// @Tags Questions
// @Summary 用id查询试题表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query model.Questions true "用id查询试题表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /questions/findQuestions [get]
export const findQuestions = (params) => {
  return service({
    url: '/questions/findQuestions',
    method: 'get',
    params
  })
}

// @Tags Questions
// @Summary 分页获取试题表列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取试题表列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /questions/getQuestionsList [get]
export const getQuestionsList = (params) => {
  return service({
    url: '/questions/getQuestionsList',
    method: 'get',
    params
  })
}

// @Tags Questions
// @Summary 不需要鉴权的试题表接口
// @accept application/json
// @Produce application/json
// @Param data query AnswermoduleReq.QuestionsSearch true "分页获取试题表列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /questions/getQuestionsPublic [get]
export const getQuestionsPublic = () => {
  return service({
    url: '/questions/getQuestionsPublic',
    method: 'get',
  })
}

// @Tags Questions
// @Summary 获取用户列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "获取用户列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /questions/getQuestionsListUser [get]
export const getQuestionsListUser = (params) => {
  return service({
    url: '/questions/getQuestionsListUser',
    method: 'get',
    params
  })
}
