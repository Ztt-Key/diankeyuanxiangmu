import service from '@/utils/request'
// @Tags EnergySavingReal
// @Summary 创建电能点位实时表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.EnergySavingReal true "创建电能点位实时表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /energySavingReal/createEnergySavingReal [post]
export const createEnergySavingReal = (data) => {
  return service({
    url: '/energySavingReal/createEnergySavingReal',
    method: 'post',
    data
  })
}

// @Tags EnergySavingReal
// @Summary 删除电能点位实时表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.EnergySavingReal true "删除电能点位实时表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /energySavingReal/deleteEnergySavingReal [delete]
export const deleteEnergySavingReal = (params) => {
  return service({
    url: '/energySavingReal/deleteEnergySavingReal',
    method: 'delete',
    params
  })
}

// @Tags EnergySavingReal
// @Summary 批量删除电能点位实时表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除电能点位实时表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /energySavingReal/deleteEnergySavingReal [delete]
export const deleteEnergySavingRealByIds = (params) => {
  return service({
    url: '/energySavingReal/deleteEnergySavingRealByIds',
    method: 'delete',
    params
  })
}

// @Tags EnergySavingReal
// @Summary 更新电能点位实时表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.EnergySavingReal true "更新电能点位实时表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /energySavingReal/updateEnergySavingReal [put]
export const updateEnergySavingReal = (data) => {
  return service({
    url: '/energySavingReal/updateEnergySavingReal',
    method: 'put',
    data
  })
}

// @Tags EnergySavingReal
// @Summary 用id查询电能点位实时表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query model.EnergySavingReal true "用id查询电能点位实时表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /energySavingReal/findEnergySavingReal [get]
export const findEnergySavingReal = (params) => {
  return service({
    url: '/energySavingReal/findEnergySavingReal',
    method: 'get',
    params
  })
}

// @Tags EnergySavingReal
// @Summary 分页获取电能点位实时表列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取电能点位实时表列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /energySavingReal/getEnergySavingRealList [get]
export const getEnergySavingRealList = (params) => {
  return service({
    url: '/energySavingReal/getEnergySavingRealList',
    method: 'get',
    params
  })
}

// @Tags EnergySavingReal
// @Summary 不需要鉴权的电能点位实时表接口
// @accept application/json
// @Produce application/json
// @Param data query energySavingReq.EnergySavingRealSearch true "分页获取电能点位实时表列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /energySavingReal/getEnergySavingRealPublic [get]
export const getEnergySavingRealPublic = () => {
  return service({
    url: '/energySavingReal/getEnergySavingRealPublic',
    method: 'get',
  })
}
