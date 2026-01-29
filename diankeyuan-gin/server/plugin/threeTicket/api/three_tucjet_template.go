package api

import (

	"github.com/flipped-aurora/gin-vue-admin/server/global"
    "github.com/flipped-aurora/gin-vue-admin/server/model/common/response"
    "github.com/flipped-aurora/gin-vue-admin/server/plugin/threeTicket/model"
    "github.com/flipped-aurora/gin-vue-admin/server/plugin/threeTicket/model/request"
    "github.com/gin-gonic/gin"
    "go.uber.org/zap"
)

var ThreeTucjetTemplate = new(threeTucjetTemplate)

type threeTucjetTemplate struct {}

// CreateThreeTucjetTemplate 创建模板
// @Tags ThreeTucjetTemplate
// @Summary 创建模板
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.ThreeTucjetTemplate true "创建模板"
// @Success 200 {object} response.Response{msg=string} "创建成功"
// @Router /threeTucjetTemplate/createThreeTucjetTemplate [post]
func (a *threeTucjetTemplate) CreateThreeTucjetTemplate(c *gin.Context) {
	var info model.ThreeTucjetTemplate
	err := c.ShouldBindJSON(&info)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = serviceThreeTucjetTemplate.CreateThreeTucjetTemplate(&info)
	if err != nil {
        global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败:" + err.Error(), c)
		return
	}
    response.OkWithMessage("创建成功", c)
}

// DeleteThreeTucjetTemplate 删除模板
// @Tags ThreeTucjetTemplate
// @Summary 删除模板
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.ThreeTucjetTemplate true "删除模板"
// @Success 200 {object} response.Response{msg=string} "删除成功"
// @Router /threeTucjetTemplate/deleteThreeTucjetTemplate [delete]
func (a *threeTucjetTemplate) DeleteThreeTucjetTemplate(c *gin.Context) {
	ID := c.Query("ID")
	err := serviceThreeTucjetTemplate.DeleteThreeTucjetTemplate(ID)
	if err != nil {
        global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败:" + err.Error(), c)
		return
	}
    response.OkWithMessage("删除成功", c)
}

// DeleteThreeTucjetTemplateByIds 批量删除模板
// @Tags ThreeTucjetTemplate
// @Summary 批量删除模板
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{msg=string} "批量删除成功"
// @Router /threeTucjetTemplate/deleteThreeTucjetTemplateByIds [delete]
func (a *threeTucjetTemplate) DeleteThreeTucjetTemplateByIds(c *gin.Context) {
	IDs := c.QueryArray("IDs[]")
	err := serviceThreeTucjetTemplate.DeleteThreeTucjetTemplateByIds(IDs)
	if err != nil {
        global.GVA_LOG.Error("批量删除失败!", zap.Error(err))
		response.FailWithMessage("批量删除失败:" + err.Error(), c)
		return
	}
    response.OkWithMessage("批量删除成功", c)
}

// UpdateThreeTucjetTemplate 更新模板
// @Tags ThreeTucjetTemplate
// @Summary 更新模板
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.ThreeTucjetTemplate true "更新模板"
// @Success 200 {object} response.Response{msg=string} "更新成功"
// @Router /threeTucjetTemplate/updateThreeTucjetTemplate [put]
func (a *threeTucjetTemplate) UpdateThreeTucjetTemplate(c *gin.Context) {
	var info model.ThreeTucjetTemplate
	err := c.ShouldBindJSON(&info)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = serviceThreeTucjetTemplate.UpdateThreeTucjetTemplate(info)
    if err != nil {
        global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败:" + err.Error(), c)
		return
	}
    response.OkWithMessage("更新成功", c)
}

// FindThreeTucjetTemplate 用id查询模板
// @Tags ThreeTucjetTemplate
// @Summary 用id查询模板
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query model.ThreeTucjetTemplate true "用id查询模板"
// @Success 200 {object} response.Response{data=model.ThreeTucjetTemplate,msg=string} "查询成功"
// @Router /threeTucjetTemplate/findThreeTucjetTemplate [get]
func (a *threeTucjetTemplate) FindThreeTucjetTemplate(c *gin.Context) {
	ID := c.Query("ID")
	rethreeTucjetTemplate, err := serviceThreeTucjetTemplate.GetThreeTucjetTemplate(ID)
	if err != nil {
        global.GVA_LOG.Error("查询失败!", zap.Error(err))
		response.FailWithMessage("查询失败:" + err.Error(), c)
		return
	}
    response.OkWithData(rethreeTucjetTemplate, c)
}
// GetThreeTucjetTemplateList 分页获取模板列表
// @Tags ThreeTucjetTemplate
// @Summary 分页获取模板列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query request.ThreeTucjetTemplateSearch true "分页获取模板列表"
// @Success 200 {object} response.Response{data=response.PageResult,msg=string} "获取成功"
// @Router /threeTucjetTemplate/getThreeTucjetTemplateList [get]
func (a *threeTucjetTemplate) GetThreeTucjetTemplateList(c *gin.Context) {
	var pageInfo request.ThreeTucjetTemplateSearch
	err := c.ShouldBindQuery(&pageInfo)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	list, total, err := serviceThreeTucjetTemplate.GetThreeTucjetTemplateInfoList(pageInfo)
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
// GetThreeTucjetTemplatePublic 不需要鉴权的模板接口
// @Tags ThreeTucjetTemplate
// @Summary 不需要鉴权的模板接口
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /threeTucjetTemplate/getThreeTucjetTemplatePublic [get]
func (a *threeTucjetTemplate) GetThreeTucjetTemplatePublic(c *gin.Context) {
    // 此接口不需要鉴权 示例为返回了一个固定的消息接口，一般本接口用于C端服务，需要自己实现业务逻辑
    serviceThreeTucjetTemplate.GetThreeTucjetTemplatePublic()
    response.OkWithDetailed(gin.H{"info": "不需要鉴权的模板接口信息"}, "获取成功", c)
}
