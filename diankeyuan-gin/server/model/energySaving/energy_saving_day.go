
// 自动生成模板EnergySavingDay
package energySaving
import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
)

// 电能点位小时统计表 结构体  EnergySavingDay
type EnergySavingDay struct {
    global.GVA_MODEL
    Name  *string `json:"name" form:"name" gorm:"column:name;comment:;"`  //点位 
    Hr  *int `json:"hr" form:"hr" gorm:"column:hr;comment:;"`  //时标 
    Flag  *int `json:"flag" form:"flag" gorm:"column:flag;comment:;"`  //标识 
    Data  *float64 `json:"data" form:"data" gorm:"column:data;comment:;"`  //数据 
    Described  *string `json:"described" form:"described" gorm:"column:described;comment:;"`  //描述 
}


// TableName 电能点位小时统计表 EnergySavingDay自定义表名 energySavingDay
func (EnergySavingDay) TableName() string {
    return "energySavingDay"
}





