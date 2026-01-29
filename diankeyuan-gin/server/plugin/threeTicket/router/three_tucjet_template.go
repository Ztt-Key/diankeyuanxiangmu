package router

import (
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	"github.com/gin-gonic/gin"
)

var ThreeTucjetTemplate = new(threeTucjetTemplate)

type threeTucjetTemplate struct {}

// Init 初始化 模板 路由信息
func (r *threeTucjetTemplate) Init(public *gin.RouterGroup, private *gin.RouterGroup) {
	{
	    group := private.Group("threeTucjetTemplate").Use(middleware.OperationRecord())
		group.POST("createThreeTucjetTemplate", apiThreeTucjetTemplate.CreateThreeTucjetTemplate)   // 新建模板
		group.DELETE("deleteThreeTucjetTemplate", apiThreeTucjetTemplate.DeleteThreeTucjetTemplate) // 删除模板
		group.DELETE("deleteThreeTucjetTemplateByIds", apiThreeTucjetTemplate.DeleteThreeTucjetTemplateByIds) // 批量删除模板
		group.PUT("updateThreeTucjetTemplate", apiThreeTucjetTemplate.UpdateThreeTucjetTemplate)    // 更新模板
	}
	{
	    group := private.Group("threeTucjetTemplate")
		group.GET("findThreeTucjetTemplate", apiThreeTucjetTemplate.FindThreeTucjetTemplate)        // 根据ID获取模板
		group.GET("getThreeTucjetTemplateList", apiThreeTucjetTemplate.GetThreeTucjetTemplateList)  // 获取模板列表
	}
	{
	    group := public.Group("threeTucjetTemplate")
	    group.GET("getThreeTucjetTemplatePublic", apiThreeTucjetTemplate.GetThreeTucjetTemplatePublic)  // 模板开放接口
	}
}
