import service from '@/utils/request'
// @Tags ThreeTicketSignature
// @Summary 创建用户签名表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.ThreeTicketSignature true "创建用户签名表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /threeTicketSignature/createThreeTicketSignature [post]
export const createThreeTicketSignature = (data) => {
  return service({
    url: '/threeTicketSignature/createThreeTicketSignature',
    method: 'post',
    data
  })
}

// @Tags ThreeTicketSignature
// @Summary 删除用户签名表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.ThreeTicketSignature true "删除用户签名表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /threeTicketSignature/deleteThreeTicketSignature [delete]
export const deleteThreeTicketSignature = (params) => {
  return service({
    url: '/threeTicketSignature/deleteThreeTicketSignature',
    method: 'delete',
    params
  })
}

// @Tags ThreeTicketSignature
// @Summary 批量删除用户签名表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除用户签名表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /threeTicketSignature/deleteThreeTicketSignature [delete]
export const deleteThreeTicketSignatureByIds = (params) => {
  return service({
    url: '/threeTicketSignature/deleteThreeTicketSignatureByIds',
    method: 'delete',
    params
  })
}

// @Tags ThreeTicketSignature
// @Summary 更新用户签名表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.ThreeTicketSignature true "更新用户签名表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /threeTicketSignature/updateThreeTicketSignature [put]
export const updateThreeTicketSignature = (data) => {
  return service({
    url: '/threeTicketSignature/updateThreeTicketSignature',
    method: 'put',
    data
  })
}

// @Tags ThreeTicketSignature
// @Summary 用id查询用户签名表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query model.ThreeTicketSignature true "用id查询用户签名表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /threeTicketSignature/findThreeTicketSignature [get]
export const findThreeTicketSignature = (params) => {
  return service({
    url: '/threeTicketSignature/findThreeTicketSignature',
    method: 'get',
    params
  })
}

// @Tags ThreeTicketSignature
// @Summary 分页获取用户签名表列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取用户签名表列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /threeTicketSignature/getThreeTicketSignatureList [get]
export const getThreeTicketSignatureList = (params) => {
  return service({
    url: '/threeTicketSignature/getThreeTicketSignatureList',
    method: 'get',
    params
  })
}
// @Tags ThreeTicketSignature
// @Summary 不需要鉴权的用户签名表接口
// @accept application/json
// @Produce application/json
// @Param data query request.ThreeTicketSignatureSearch true "分页获取用户签名表列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /threeTicketSignature/getThreeTicketSignaturePublic [get]
export const getThreeTicketSignaturePublic = () => {
  return service({
    url: '/threeTicketSignature/getThreeTicketSignaturePublic',
    method: 'get',
  })
}