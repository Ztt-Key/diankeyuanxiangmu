package energySaving

import (
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	"github.com/gin-gonic/gin"
)

type EnergySavingRealRouter struct {}

// InitEnergySavingRealRouter 初始化 电能点位实时表 路由信息
func (s *EnergySavingRealRouter) InitEnergySavingRealRouter(Router *gin.RouterGroup,PublicRouter *gin.RouterGroup) {
	energySavingRealRouter := Router.Group("energySavingReal").Use(middleware.OperationRecord())
	energySavingRealRouterWithoutRecord := Router.Group("energySavingReal")
	energySavingRealRouterWithoutAuth := PublicRouter.Group("energySavingReal")
	{
		energySavingRealRouter.POST("createEnergySavingReal", energySavingRealApi.CreateEnergySavingReal)   // 新建电能点位实时表
		energySavingRealRouter.DELETE("deleteEnergySavingReal", energySavingRealApi.DeleteEnergySavingReal) // 删除电能点位实时表
		energySavingRealRouter.DELETE("deleteEnergySavingRealByIds", energySavingRealApi.DeleteEnergySavingRealByIds) // 批量删除电能点位实时表
		energySavingRealRouter.PUT("updateEnergySavingReal", energySavingRealApi.UpdateEnergySavingReal)    // 更新电能点位实时表
	}
	{
		energySavingRealRouterWithoutRecord.GET("findEnergySavingReal", energySavingRealApi.FindEnergySavingReal)        // 根据ID获取电能点位实时表
		energySavingRealRouterWithoutRecord.GET("getEnergySavingRealList", energySavingRealApi.GetEnergySavingRealList)  // 获取电能点位实时表列表
	}
	{
	    energySavingRealRouterWithoutAuth.GET("getEnergySavingRealPublic", energySavingRealApi.GetEnergySavingRealPublic)  // 电能点位实时表开放接口
	}
}
