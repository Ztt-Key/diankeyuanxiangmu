
// 自动生成模板EnergySavingSubscription
package energySaving
import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
)

// 电能点位订阅表 结构体  EnergySavingSubscription
type EnergySavingSubscription struct {
    global.GVA_MODEL
    Name  *string `json:"name" form:"name" gorm:"column:name;comment:;"`  //点位 
    Described  *string `json:"described" form:"described" gorm:"column:described;comment:;"`  //描述 
    Subscription  *bool `json:"subscription" form:"subscription" gorm:"column:subscription;comment:;"`  //是否订阅 
}


// TableName 电能点位订阅表 EnergySavingSubscription自定义表名 energySavingSubscription
func (EnergySavingSubscription) TableName() string {
    return "energySavingSubscription"
}





