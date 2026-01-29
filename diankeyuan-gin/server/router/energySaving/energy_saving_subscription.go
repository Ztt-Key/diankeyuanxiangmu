package energySaving

import (
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	"github.com/gin-gonic/gin"
)

type EnergySavingSubscriptionRouter struct {}

// InitEnergySavingSubscriptionRouter 初始化 电能点位订阅表 路由信息
func (s *EnergySavingSubscriptionRouter) InitEnergySavingSubscriptionRouter(Router *gin.RouterGroup,PublicRouter *gin.RouterGroup) {
	energySavingSubscriptionRouter := Router.Group("energySavingSubscription").Use(middleware.OperationRecord())
	energySavingSubscriptionRouterWithoutRecord := Router.Group("energySavingSubscription")
	energySavingSubscriptionRouterWithoutAuth := PublicRouter.Group("energySavingSubscription")
	{
		energySavingSubscriptionRouter.POST("createEnergySavingSubscription", energySavingSubscriptionApi.CreateEnergySavingSubscription)   // 新建电能点位订阅表
		energySavingSubscriptionRouter.DELETE("deleteEnergySavingSubscription", energySavingSubscriptionApi.DeleteEnergySavingSubscription) // 删除电能点位订阅表
		energySavingSubscriptionRouter.DELETE("deleteEnergySavingSubscriptionByIds", energySavingSubscriptionApi.DeleteEnergySavingSubscriptionByIds) // 批量删除电能点位订阅表
		energySavingSubscriptionRouter.PUT("updateEnergySavingSubscription", energySavingSubscriptionApi.UpdateEnergySavingSubscription)    // 更新电能点位订阅表
	}
	{
		energySavingSubscriptionRouterWithoutRecord.GET("findEnergySavingSubscription", energySavingSubscriptionApi.FindEnergySavingSubscription)        // 根据ID获取电能点位订阅表
		energySavingSubscriptionRouterWithoutRecord.GET("getEnergySavingSubscriptionList", energySavingSubscriptionApi.GetEnergySavingSubscriptionList)  // 获取电能点位订阅表列表
	}
	{
	    energySavingSubscriptionRouterWithoutAuth.GET("getEnergySavingSubscriptionPublic", energySavingSubscriptionApi.GetEnergySavingSubscriptionPublic)  // 电能点位订阅表开放接口
	}
}
