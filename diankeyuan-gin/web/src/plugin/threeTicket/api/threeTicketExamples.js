import service from '@/utils/request'
import { useUserStore } from '@/pinia/modules/user'
// @Tags ThreeTicketExamples
// @Summary 创建三票实例
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.ThreeTicketExamples true "创建三票实例"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /threeTicketExamples/createThreeTicketExamples [post]
export const createThreeTicketExamples = (data) => {
  return service({
    url: '/threeTicketExamples/createThreeTicketExamples',
    method: 'post',
    data
  })
}

// @Tags ThreeTicketExamples
// @Summary 删除三票实例
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.ThreeTicketExamples true "删除三票实例"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /threeTicketExamples/deleteThreeTicketExamples [delete]
export const deleteThreeTicketExamples = (params) => {
  return service({
    url: '/threeTicketExamples/deleteThreeTicketExamples',
    method: 'delete',
    params
  })
}

// @Tags ThreeTicketExamples
// @Summary 批量删除三票实例
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除三票实例"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /threeTicketExamples/deleteThreeTicketExamples [delete]
export const deleteThreeTicketExamplesByIds = (params) => {
  return service({
    url: '/threeTicketExamples/deleteThreeTicketExamplesByIds',
    method: 'delete',
    params
  })
}

// @Tags ThreeTicketExamples
// @Summary 更新三票实例
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.ThreeTicketExamples true "更新三票实例"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /threeTicketExamples/updateThreeTicketExamples [put]
export const updateThreeTicketExamples = (data) => {
  return service({
    url: '/threeTicketExamples/updateThreeTicketExamples',
    method: 'put',
    data
  })
}

// @Tags ThreeTicketExamples
// @Summary 用id查询三票实例
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query model.ThreeTicketExamples true "用id查询三票实例"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /threeTicketExamples/findThreeTicketExamples [get]
export const findThreeTicketExamples = (params) => {
  return service({
    url: '/threeTicketExamples/findThreeTicketExamples',
    method: 'get',
    params
  })
}

// @Tags ThreeTicketExamples
// @Summary 分页获取三票实例列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取三票实例列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /threeTicketExamples/getThreeTicketExamplesList [get]
export const getThreeTicketExamplesList = (params) => {
  return service({
    url: '/threeTicketExamples/getThreeTicketExamplesList',
    method: 'get',
    params
  })
}
// @Tags ThreeTicketExamples
// @Summary 不需要鉴权的三票实例接口
// @accept application/json
// @Produce application/json
// @Param data query request.ThreeTicketExamplesSearch true "分页获取三票实例列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /threeTicketExamples/getThreeTicketExamplesPublic [get]
export const getThreeTicketExamplesPublic = () => {
  return service({
    url: '/threeTicketExamples/getThreeTicketExamplesPublic',
    method: 'get',
  })
}