package energySaving

import (
	
	"github.com/flipped-aurora/gin-vue-admin/server/global"
    "github.com/flipped-aurora/gin-vue-admin/server/model/common/response"
    "github.com/flipped-aurora/gin-vue-admin/server/model/energySaving"
    energySavingReq "github.com/flipped-aurora/gin-vue-admin/server/model/energySaving/request"
    "github.com/gin-gonic/gin"
    "go.uber.org/zap"
)

type EnergySavingSubscriptionApi struct {}



// CreateEnergySavingSubscription 创建电能点位订阅表
// @Tags EnergySavingSubscription
// @Summary 创建电能点位订阅表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body energySaving.EnergySavingSubscription true "创建电能点位订阅表"
// @Success 200 {object} response.Response{msg=string} "创建成功"
// @Router /energySavingSubscription/createEnergySavingSubscription [post]
func (energySavingSubscriptionApi *EnergySavingSubscriptionApi) CreateEnergySavingSubscription(c *gin.Context) {
	var energySavingSubscription energySaving.EnergySavingSubscription
	err := c.ShouldBindJSON(&energySavingSubscription)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = energySavingSubscriptionService.CreateEnergySavingSubscription(&energySavingSubscription)
	if err != nil {
        global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败:" + err.Error(), c)
		return
	}
    response.OkWithMessage("创建成功", c)
}

// DeleteEnergySavingSubscription 删除电能点位订阅表
// @Tags EnergySavingSubscription
// @Summary 删除电能点位订阅表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body energySaving.EnergySavingSubscription true "删除电能点位订阅表"
// @Success 200 {object} response.Response{msg=string} "删除成功"
// @Router /energySavingSubscription/deleteEnergySavingSubscription [delete]
func (energySavingSubscriptionApi *EnergySavingSubscriptionApi) DeleteEnergySavingSubscription(c *gin.Context) {
	ID := c.Query("ID")
	err := energySavingSubscriptionService.DeleteEnergySavingSubscription(ID)
	if err != nil {
        global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败:" + err.Error(), c)
		return
	}
	response.OkWithMessage("删除成功", c)
}

// DeleteEnergySavingSubscriptionByIds 批量删除电能点位订阅表
// @Tags EnergySavingSubscription
// @Summary 批量删除电能点位订阅表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{msg=string} "批量删除成功"
// @Router /energySavingSubscription/deleteEnergySavingSubscriptionByIds [delete]
func (energySavingSubscriptionApi *EnergySavingSubscriptionApi) DeleteEnergySavingSubscriptionByIds(c *gin.Context) {
	IDs := c.QueryArray("IDs[]")
	err := energySavingSubscriptionService.DeleteEnergySavingSubscriptionByIds(IDs)
	if err != nil {
        global.GVA_LOG.Error("批量删除失败!", zap.Error(err))
		response.FailWithMessage("批量删除失败:" + err.Error(), c)
		return
	}
	response.OkWithMessage("批量删除成功", c)
}

// UpdateEnergySavingSubscription 更新电能点位订阅表
// @Tags EnergySavingSubscription
// @Summary 更新电能点位订阅表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body energySaving.EnergySavingSubscription true "更新电能点位订阅表"
// @Success 200 {object} response.Response{msg=string} "更新成功"
// @Router /energySavingSubscription/updateEnergySavingSubscription [put]
func (energySavingSubscriptionApi *EnergySavingSubscriptionApi) UpdateEnergySavingSubscription(c *gin.Context) {
	var energySavingSubscription energySaving.EnergySavingSubscription
	err := c.ShouldBindJSON(&energySavingSubscription)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = energySavingSubscriptionService.UpdateEnergySavingSubscription(energySavingSubscription)
	if err != nil {
        global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败:" + err.Error(), c)
		return
	}
	response.OkWithMessage("更新成功", c)
}

// FindEnergySavingSubscription 用id查询电能点位订阅表
// @Tags EnergySavingSubscription
// @Summary 用id查询电能点位订阅表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query energySaving.EnergySavingSubscription true "用id查询电能点位订阅表"
// @Success 200 {object} response.Response{data=energySaving.EnergySavingSubscription,msg=string} "查询成功"
// @Router /energySavingSubscription/findEnergySavingSubscription [get]
func (energySavingSubscriptionApi *EnergySavingSubscriptionApi) FindEnergySavingSubscription(c *gin.Context) {
	ID := c.Query("ID")
	reenergySavingSubscription, err := energySavingSubscriptionService.GetEnergySavingSubscription(ID)
	if err != nil {
        global.GVA_LOG.Error("查询失败!", zap.Error(err))
		response.FailWithMessage("查询失败:" + err.Error(), c)
		return
	}
	response.OkWithData(reenergySavingSubscription, c)
}
// GetEnergySavingSubscriptionList 分页获取电能点位订阅表列表
// @Tags EnergySavingSubscription
// @Summary 分页获取电能点位订阅表列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query energySavingReq.EnergySavingSubscriptionSearch true "分页获取电能点位订阅表列表"
// @Success 200 {object} response.Response{data=response.PageResult,msg=string} "获取成功"
// @Router /energySavingSubscription/getEnergySavingSubscriptionList [get]
func (energySavingSubscriptionApi *EnergySavingSubscriptionApi) GetEnergySavingSubscriptionList(c *gin.Context) {
	var pageInfo energySavingReq.EnergySavingSubscriptionSearch
	err := c.ShouldBindQuery(&pageInfo)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	list, total, err := energySavingSubscriptionService.GetEnergySavingSubscriptionInfoList(pageInfo)
	if err != nil {
	    global.GVA_LOG.Error("获取失败!", zap.Error(err))
        response.FailWithMessage("获取失败:" + err.Error(), c)
        return
    }
    response.OkWithDetailed(response.PageResult{
        List:     list,
        Total:    total,
        Page:     pageInfo.Page,
        PageSize: pageInfo.PageSize,
    }, "获取成功", c)
}

// GetEnergySavingSubscriptionPublic 不需要鉴权的电能点位订阅表接口
// @Tags EnergySavingSubscription
// @Summary 不需要鉴权的电能点位订阅表接口
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /energySavingSubscription/getEnergySavingSubscriptionPublic [get]
func (energySavingSubscriptionApi *EnergySavingSubscriptionApi) GetEnergySavingSubscriptionPublic(c *gin.Context) {
    // 此接口不需要鉴权
    // 示例为返回了一个固定的消息接口，一般本接口用于C端服务，需要自己实现业务逻辑
    energySavingSubscriptionService.GetEnergySavingSubscriptionPublic()
    response.OkWithDetailed(gin.H{
       "info": "不需要鉴权的电能点位订阅表接口信息",
    }, "获取成功", c)
}
