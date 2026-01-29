package initialize

import (
	"github.com/flipped-aurora/gin-vue-admin/server/router"
	"github.com/gin-gonic/gin"
)

func holder(routers ...*gin.RouterGroup) {
	_ = routers
	_ = router.RouterGroupApp
}
func initBizRouter(routers ...*gin.RouterGroup) {
	privateGroup := routers[0]
	publicGroup := routers[1]
	holder(publicGroup, privateGroup)
	{
		energySavingRouter := router.RouterGroupApp.EnergySaving
		energySavingRouter.InitEnergySavingSubscriptionRouter(privateGroup, publicGroup)
		energySavingRouter.InitEnergySavingRealRouter(privateGroup, publicGroup)
		energySavingRouter.InitEnergySavingDayRouter(privateGroup, publicGroup)
	}
}
