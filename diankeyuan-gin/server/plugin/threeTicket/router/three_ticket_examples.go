package router

import (
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	"github.com/gin-gonic/gin"
)

var ThreeTicketExamples = new(threeTicketExamples)

type threeTicketExamples struct {}

// Init 初始化 三票实例 路由信息
func (r *threeTicketExamples) Init(public *gin.RouterGroup, private *gin.RouterGroup) {
	{
	    group := private.Group("threeTicketExamples").Use(middleware.OperationRecord())
		group.POST("createThreeTicketExamples", apiThreeTicketExamples.CreateThreeTicketExamples)   // 新建三票实例
		group.DELETE("deleteThreeTicketExamples", apiThreeTicketExamples.DeleteThreeTicketExamples) // 删除三票实例
		group.DELETE("deleteThreeTicketExamplesByIds", apiThreeTicketExamples.DeleteThreeTicketExamplesByIds) // 批量删除三票实例
		group.PUT("updateThreeTicketExamples", apiThreeTicketExamples.UpdateThreeTicketExamples)    // 更新三票实例
	}
	{
	    group := private.Group("threeTicketExamples")
		group.GET("findThreeTicketExamples", apiThreeTicketExamples.FindThreeTicketExamples)        // 根据ID获取三票实例
		group.GET("getThreeTicketExamplesList", apiThreeTicketExamples.GetThreeTicketExamplesList)  // 获取三票实例列表
	}
	{
	    group := public.Group("threeTicketExamples")
	    group.GET("getThreeTicketExamplesPublic", apiThreeTicketExamples.GetThreeTicketExamplesPublic)  // 三票实例开放接口
	}
}
