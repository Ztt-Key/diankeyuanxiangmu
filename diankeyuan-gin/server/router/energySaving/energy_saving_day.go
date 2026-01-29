package energySaving

import (
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	"github.com/gin-gonic/gin"
)

type EnergySavingDayRouter struct {}

// InitEnergySavingDayRouter 初始化 电能点位小时统计表 路由信息
func (s *EnergySavingDayRouter) InitEnergySavingDayRouter(Router *gin.RouterGroup,PublicRouter *gin.RouterGroup) {
	energySavingDayRouter := Router.Group("energySavingDay").Use(middleware.OperationRecord())
	energySavingDayRouterWithoutRecord := Router.Group("energySavingDay")
	energySavingDayRouterWithoutAuth := PublicRouter.Group("energySavingDay")
	{
		energySavingDayRouter.POST("createEnergySavingDay", energySavingDayApi.CreateEnergySavingDay)   // 新建电能点位小时统计表
		energySavingDayRouter.DELETE("deleteEnergySavingDay", energySavingDayApi.DeleteEnergySavingDay) // 删除电能点位小时统计表
		energySavingDayRouter.DELETE("deleteEnergySavingDayByIds", energySavingDayApi.DeleteEnergySavingDayByIds) // 批量删除电能点位小时统计表
		energySavingDayRouter.PUT("updateEnergySavingDay", energySavingDayApi.UpdateEnergySavingDay)    // 更新电能点位小时统计表
	}
	{
		energySavingDayRouterWithoutRecord.GET("findEnergySavingDay", energySavingDayApi.FindEnergySavingDay)        // 根据ID获取电能点位小时统计表
		energySavingDayRouterWithoutRecord.GET("getEnergySavingDayList", energySavingDayApi.GetEnergySavingDayList)  // 获取电能点位小时统计表列表
	}
	{
	    energySavingDayRouterWithoutAuth.GET("getEnergySavingDayPublic", energySavingDayApi.GetEnergySavingDayPublic)  // 电能点位小时统计表开放接口
	}
}
