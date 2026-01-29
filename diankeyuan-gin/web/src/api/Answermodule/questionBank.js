import service from '@/utils/request'
// @Tags QuestionBank
// @Summary 创建题库表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.QuestionBank true "创建题库表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /questionBank/createQuestionBank [post]
export const createQuestionBank = (data) => {
  return service({
    url: '/questionBank/CreateBank',
    method: 'post',
    data
  })
}

// @Tags QuestionBank
// @Summary 删除题库表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.QuestionBank true "删除题库表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /questionBank/deleteQuestionBank [delete]
export const deleteQuestionBank = (params) => {
  return service({
    url: '/questionBank/deleteQuestionBank',
    method: 'delete',
    params
  })
}

// @Tags QuestionBank
// @Summary 批量删除题库表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除题库表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /questionBank/deleteQuestionBank [delete]
export const deleteQuestionBankByIds = (params) => {
  return service({
    url: '/questionBank/deleteQuestionBankByIds',
    method: 'delete',
    params
  })
}

// @Tags QuestionBank
// @Summary 更新题库表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.QuestionBank true "更新题库表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /questionBank/updateQuestionBank [put]
export const updateQuestionBank = (data) => {
  return service({
    url: '/questionBank/updateQuestionBank',
    method: 'put',
    data
  })
}

// @Tags QuestionBank
// @Summary 用id查询题库表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query model.QuestionBank true "用id查询题库表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /questionBank/findQuestionBank [get]
export const findQuestionBank = (params) => {
  return service({
    url: '/questionBank/findQuestionBank',
    method: 'get',
    params
  })
}

// @Tags QuestionBank
// @Summary 分页获取题库表列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取题库表列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /questionBank/getQuestionBankList [get]
export const getQuestionBankList = (params) => {
  return service({
    url: '/questionBank/getQuestionBankList',
    method: 'get',
    params
  })
}

// @Tags QuestionBank
// @Summary 不需要鉴权的题库表接口
// @accept application/json
// @Produce application/json
// @Param data query AnswermoduleReq.QuestionBankSearch true "分页获取题库表列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /questionBank/getQuestionBankPublic [get]
export const getQuestionBankPublic = () => {
  return service({
    url: '/questionBank/getQuestionBankPublic',
    method: 'get',
  })
}
//自定义api
// 创建试题
export const createQuestion = (data) => {
  console.log(data)
  return service({
      url: '/AddBank/AddBankQuestion',
      method: 'post',
      data
  })
}

// 获取题库下的试题列表
export const getQuestionsByBankId = (params) => {
  return service({
    url: '/questions/getQuestionsList',
    method: 'get',
    params
  })
}
//删除试题
export const deleteQuestion = (params) => {
  console.log(params);
  
  return service({
    url: '/questions/deleteQuestions',
    method: 'delete',
    params
  })
}
export const getExamUsers = (params) => {
  return service({
    url: '/questions/getQuestionsListUser',
    method: 'get',
    params
  })
}
