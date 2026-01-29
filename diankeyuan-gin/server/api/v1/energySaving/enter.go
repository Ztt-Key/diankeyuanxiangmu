package energySaving

import "github.com/flipped-aurora/gin-vue-admin/server/service"

type ApiGroup struct {
	EnergySavingSubscriptionApi
	EnergySavingRealApi
	EnergySavingDayApi
}

var (
	energySavingSubscriptionService = service.ServiceGroupApp.EnergySavingServiceGroup.EnergySavingSubscriptionService
	energySavingRealService         = service.ServiceGroupApp.EnergySavingServiceGroup.EnergySavingRealService
	energySavingDayService          = service.ServiceGroupApp.EnergySavingServiceGroup.EnergySavingDayService
)
