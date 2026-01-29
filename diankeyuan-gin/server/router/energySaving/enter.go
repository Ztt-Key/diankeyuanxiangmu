package energySaving

import api "github.com/flipped-aurora/gin-vue-admin/server/api/v1"

type RouterGroup struct {
	EnergySavingSubscriptionRouter
	EnergySavingRealRouter
	EnergySavingDayRouter
}

var (
	energySavingSubscriptionApi = api.ApiGroupApp.EnergySavingApiGroup.EnergySavingSubscriptionApi
	energySavingRealApi         = api.ApiGroupApp.EnergySavingApiGroup.EnergySavingRealApi
	energySavingDayApi          = api.ApiGroupApp.EnergySavingApiGroup.EnergySavingDayApi
)
