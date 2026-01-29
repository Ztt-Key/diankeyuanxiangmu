import service from '@/utils/request'
// @Tags EnergySavingDay
// @Summary 创建电能点位小时统计表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.EnergySavingDay true "创建电能点位小时统计表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /energySavingDay/createEnergySavingDay [post]
export const createEnergySavingDay = (data) => {
  return service({
    url: '/energySavingDay/createEnergySavingDay',
    method: 'post',
    data
  })
}

// @Tags EnergySavingDay
// @Summary 删除电能点位小时统计表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.EnergySavingDay true "删除电能点位小时统计表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /energySavingDay/deleteEnergySavingDay [delete]
export const deleteEnergySavingDay = (params) => {
  return service({
    url: '/energySavingDay/deleteEnergySavingDay',
    method: 'delete',
    params
  })
}

// @Tags EnergySavingDay
// @Summary 批量删除电能点位小时统计表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除电能点位小时统计表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /energySavingDay/deleteEnergySavingDay [delete]
export const deleteEnergySavingDayByIds = (params) => {
  return service({
    url: '/energySavingDay/deleteEnergySavingDayByIds',
    method: 'delete',
    params
  })
}

// @Tags EnergySavingDay
// @Summary 更新电能点位小时统计表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.EnergySavingDay true "更新电能点位小时统计表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /energySavingDay/updateEnergySavingDay [put]
export const updateEnergySavingDay = (data) => {
  return service({
    url: '/energySavingDay/updateEnergySavingDay',
    method: 'put',
    data
  })
}

// @Tags EnergySavingDay
// @Summary 用id查询电能点位小时统计表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query model.EnergySavingDay true "用id查询电能点位小时统计表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /energySavingDay/findEnergySavingDay [get]
export const findEnergySavingDay = (params) => {
  return service({
    url: '/energySavingDay/findEnergySavingDay',
    method: 'get',
    params
  })
}

// @Tags EnergySavingDay
// @Summary 分页获取电能点位小时统计表列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取电能点位小时统计表列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /energySavingDay/getEnergySavingDayList [get]
export const getEnergySavingDayList = (params) => {
  return service({
    url: '/energySavingDay/getEnergySavingDayList',
    method: 'get',
    params
  })
}

// @Tags EnergySavingDay
// @Summary 不需要鉴权的电能点位小时统计表接口
// @accept application/json
// @Produce application/json
// @Param data query energySavingReq.EnergySavingDaySearch true "分页获取电能点位小时统计表列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /energySavingDay/getEnergySavingDayPublic [get]
export const getEnergySavingDayPublic = () => {
  return service({
    url: '/energySavingDay/getEnergySavingDayPublic',
    method: 'get',
  })
}
