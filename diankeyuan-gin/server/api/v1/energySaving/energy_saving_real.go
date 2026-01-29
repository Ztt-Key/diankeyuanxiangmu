package energySaving

import (
	
	"github.com/flipped-aurora/gin-vue-admin/server/global"
    "github.com/flipped-aurora/gin-vue-admin/server/model/common/response"
    "github.com/flipped-aurora/gin-vue-admin/server/model/energySaving"
    energySavingReq "github.com/flipped-aurora/gin-vue-admin/server/model/energySaving/request"
    "github.com/gin-gonic/gin"
    "go.uber.org/zap"
)

type EnergySavingRealApi struct {}



// CreateEnergySavingReal 创建电能点位实时表
// @Tags EnergySavingReal
// @Summary 创建电能点位实时表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body energySaving.EnergySavingReal true "创建电能点位实时表"
// @Success 200 {object} response.Response{msg=string} "创建成功"
// @Router /energySavingReal/createEnergySavingReal [post]
func (energySavingRealApi *EnergySavingRealApi) CreateEnergySavingReal(c *gin.Context) {
	var energySavingReal energySaving.EnergySavingReal
	err := c.ShouldBindJSON(&energySavingReal)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = energySavingRealService.CreateEnergySavingReal(&energySavingReal)
	if err != nil {
        global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败:" + err.Error(), c)
		return
	}
    response.OkWithMessage("创建成功", c)
}

// DeleteEnergySavingReal 删除电能点位实时表
// @Tags EnergySavingReal
// @Summary 删除电能点位实时表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body energySaving.EnergySavingReal true "删除电能点位实时表"
// @Success 200 {object} response.Response{msg=string} "删除成功"
// @Router /energySavingReal/deleteEnergySavingReal [delete]
func (energySavingRealApi *EnergySavingRealApi) DeleteEnergySavingReal(c *gin.Context) {
	ID := c.Query("ID")
	err := energySavingRealService.DeleteEnergySavingReal(ID)
	if err != nil {
        global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败:" + err.Error(), c)
		return
	}
	response.OkWithMessage("删除成功", c)
}

// DeleteEnergySavingRealByIds 批量删除电能点位实时表
// @Tags EnergySavingReal
// @Summary 批量删除电能点位实时表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{msg=string} "批量删除成功"
// @Router /energySavingReal/deleteEnergySavingRealByIds [delete]
func (energySavingRealApi *EnergySavingRealApi) DeleteEnergySavingRealByIds(c *gin.Context) {
	IDs := c.QueryArray("IDs[]")
	err := energySavingRealService.DeleteEnergySavingRealByIds(IDs)
	if err != nil {
        global.GVA_LOG.Error("批量删除失败!", zap.Error(err))
		response.FailWithMessage("批量删除失败:" + err.Error(), c)
		return
	}
	response.OkWithMessage("批量删除成功", c)
}

// UpdateEnergySavingReal 更新电能点位实时表
// @Tags EnergySavingReal
// @Summary 更新电能点位实时表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body energySaving.EnergySavingReal true "更新电能点位实时表"
// @Success 200 {object} response.Response{msg=string} "更新成功"
// @Router /energySavingReal/updateEnergySavingReal [put]
func (energySavingRealApi *EnergySavingRealApi) UpdateEnergySavingReal(c *gin.Context) {
	var energySavingReal energySaving.EnergySavingReal
	err := c.ShouldBindJSON(&energySavingReal)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = energySavingRealService.UpdateEnergySavingReal(energySavingReal)
	if err != nil {
        global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败:" + err.Error(), c)
		return
	}
	response.OkWithMessage("更新成功", c)
}

// FindEnergySavingReal 用id查询电能点位实时表
// @Tags EnergySavingReal
// @Summary 用id查询电能点位实时表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query energySaving.EnergySavingReal true "用id查询电能点位实时表"
// @Success 200 {object} response.Response{data=energySaving.EnergySavingReal,msg=string} "查询成功"
// @Router /energySavingReal/findEnergySavingReal [get]
func (energySavingRealApi *EnergySavingRealApi) FindEnergySavingReal(c *gin.Context) {
	ID := c.Query("ID")
	reenergySavingReal, err := energySavingRealService.GetEnergySavingReal(ID)
	if err != nil {
        global.GVA_LOG.Error("查询失败!", zap.Error(err))
		response.FailWithMessage("查询失败:" + err.Error(), c)
		return
	}
	response.OkWithData(reenergySavingReal, c)
}
// GetEnergySavingRealList 分页获取电能点位实时表列表
// @Tags EnergySavingReal
// @Summary 分页获取电能点位实时表列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query energySavingReq.EnergySavingRealSearch true "分页获取电能点位实时表列表"
// @Success 200 {object} response.Response{data=response.PageResult,msg=string} "获取成功"
// @Router /energySavingReal/getEnergySavingRealList [get]
func (energySavingRealApi *EnergySavingRealApi) GetEnergySavingRealList(c *gin.Context) {
	var pageInfo energySavingReq.EnergySavingRealSearch
	err := c.ShouldBindQuery(&pageInfo)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	list, total, err := energySavingRealService.GetEnergySavingRealInfoList(pageInfo)
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

// GetEnergySavingRealPublic 不需要鉴权的电能点位实时表接口
// @Tags EnergySavingReal
// @Summary 不需要鉴权的电能点位实时表接口
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /energySavingReal/getEnergySavingRealPublic [get]
func (energySavingRealApi *EnergySavingRealApi) GetEnergySavingRealPublic(c *gin.Context) {
    // 此接口不需要鉴权
    // 示例为返回了一个固定的消息接口，一般本接口用于C端服务，需要自己实现业务逻辑
    energySavingRealService.GetEnergySavingRealPublic()
    response.OkWithDetailed(gin.H{
       "info": "不需要鉴权的电能点位实时表接口信息",
    }, "获取成功", c)
}
