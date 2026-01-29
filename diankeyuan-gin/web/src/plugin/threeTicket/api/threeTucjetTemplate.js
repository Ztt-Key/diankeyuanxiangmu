import service from '@/utils/request'
// @Tags ThreeTucjetTemplate
// @Summary 创建模板
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.ThreeTucjetTemplate true "创建模板"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /threeTucjetTemplate/createThreeTucjetTemplate [post]
export const createThreeTucjetTemplate = (data) => {
  return service({
    url: '/threeTucjetTemplate/createThreeTucjetTemplate',
    method: 'post',
    data
  })
}

// @Tags ThreeTucjetTemplate
// @Summary 删除模板
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.ThreeTucjetTemplate true "删除模板"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /threeTucjetTemplate/deleteThreeTucjetTemplate [delete]
export const deleteThreeTucjetTemplate = (params) => {
  return service({
    url: '/threeTucjetTemplate/deleteThreeTucjetTemplate',
    method: 'delete',
    params
  })
}

// @Tags ThreeTucjetTemplate
// @Summary 批量删除模板
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除模板"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /threeTucjetTemplate/deleteThreeTucjetTemplate [delete]
export const deleteThreeTucjetTemplateByIds = (params) => {
  return service({
    url: '/threeTucjetTemplate/deleteThreeTucjetTemplateByIds',
    method: 'delete',
    params
  })
}

// @Tags ThreeTucjetTemplate
// @Summary 更新模板
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.ThreeTucjetTemplate true "更新模板"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /threeTucjetTemplate/updateThreeTucjetTemplate [put]
export const updateThreeTucjetTemplate = (data) => {
  return service({
    url: '/threeTucjetTemplate/updateThreeTucjetTemplate',
    method: 'put',
    data
  })
}

// @Tags ThreeTucjetTemplate
// @Summary 用id查询模板
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query model.ThreeTucjetTemplate true "用id查询模板"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /threeTucjetTemplate/findThreeTucjetTemplate [get]
export const findThreeTucjetTemplate = (params) => {
  return service({
    url: '/threeTucjetTemplate/findThreeTucjetTemplate',
    method: 'get',
    params
  })
}

// @Tags ThreeTucjetTemplate
// @Summary 分页获取模板列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取模板列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /threeTucjetTemplate/getThreeTucjetTemplateList [get]
export const getThreeTucjetTemplateList = (params) => {
  return service({
    url: '/threeTucjetTemplate/getThreeTucjetTemplateList',
    method: 'get',
    params
  })
}
// @Tags ThreeTucjetTemplate
// @Summary 不需要鉴权的模板接口
// @accept application/json
// @Produce application/json
// @Param data query request.ThreeTucjetTemplateSearch true "分页获取模板列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /threeTucjetTemplate/getThreeTucjetTemplatePublic [get]
export const getThreeTucjetTemplatePublic = () => {
  return service({
    url: '/threeTucjetTemplate/getThreeTucjetTemplatePublic',
    method: 'get',
  })
}