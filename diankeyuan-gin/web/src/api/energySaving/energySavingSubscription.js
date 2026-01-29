import service from '@/utils/request'
// @Tags EnergySavingSubscription
// @Summary 创建电能点位订阅表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.EnergySavingSubscription true "创建电能点位订阅表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /energySavingSubscription/createEnergySavingSubscription [post]
export const createEnergySavingSubscription = (data) => {
  return service({
    url: '/energySavingSubscription/createEnergySavingSubscription',
    method: 'post',
    data
  })
}

// @Tags EnergySavingSubscription
// @Summary 删除电能点位订阅表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.EnergySavingSubscription true "删除电能点位订阅表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /energySavingSubscription/deleteEnergySavingSubscription [delete]
export const deleteEnergySavingSubscription = (params) => {
  return service({
    url: '/energySavingSubscription/deleteEnergySavingSubscription',
    method: 'delete',
    params
  })
}

// @Tags EnergySavingSubscription
// @Summary 批量删除电能点位订阅表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除电能点位订阅表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /energySavingSubscription/deleteEnergySavingSubscription [delete]
export const deleteEnergySavingSubscriptionByIds = (params) => {
  return service({
    url: '/energySavingSubscription/deleteEnergySavingSubscriptionByIds',
    method: 'delete',
    params
  })
}

// @Tags EnergySavingSubscription
// @Summary 更新电能点位订阅表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.EnergySavingSubscription true "更新电能点位订阅表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /energySavingSubscription/updateEnergySavingSubscription [put]
export const updateEnergySavingSubscription = (data) => {
  return service({
    url: '/energySavingSubscription/updateEnergySavingSubscription',
    method: 'put',
    data
  })
}

// @Tags EnergySavingSubscription
// @Summary 用id查询电能点位订阅表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query model.EnergySavingSubscription true "用id查询电能点位订阅表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /energySavingSubscription/findEnergySavingSubscription [get]
export const findEnergySavingSubscription = (params) => {
  return service({
    url: '/energySavingSubscription/findEnergySavingSubscription',
    method: 'get',
    params
  })
}

// @Tags EnergySavingSubscription
// @Summary 分页获取电能点位订阅表列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取电能点位订阅表列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /energySavingSubscription/getEnergySavingSubscriptionList [get]
export const getEnergySavingSubscriptionList = (params) => {
  return service({
    url: '/energySavingSubscription/getEnergySavingSubscriptionList',
    method: 'get',
    params
  })
}

// @Tags EnergySavingSubscription
// @Summary 不需要鉴权的电能点位订阅表接口
// @accept application/json
// @Produce application/json
// @Param data query energySavingReq.EnergySavingSubscriptionSearch true "分页获取电能点位订阅表列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /energySavingSubscription/getEnergySavingSubscriptionPublic [get]
export const getEnergySavingSubscriptionPublic = () => {
  return service({
    url: '/energySavingSubscription/getEnergySavingSubscriptionPublic',
    method: 'get',
  })
}
