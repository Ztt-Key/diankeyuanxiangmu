
package request

import (
	"github.com/flipped-aurora/gin-vue-admin/server/model/common/request"
	"time"
)

type EnergySavingSubscriptionSearch struct{
    StartCreatedAt *time.Time `json:"startCreatedAt" form:"startCreatedAt"`
    EndCreatedAt   *time.Time `json:"endCreatedAt" form:"endCreatedAt"`
    Name  *string `json:"name" form:"name" `
    Described  *string `json:"described" form:"described" `
    Subscription  *bool `json:"subscription" form:"subscription" `
    request.PageInfo
}
