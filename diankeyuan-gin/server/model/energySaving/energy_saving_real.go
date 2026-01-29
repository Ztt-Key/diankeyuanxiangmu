
// 自动生成模板EnergySavingReal
package energySaving
import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
)

// 电能点位实时表 结构体  EnergySavingReal
type EnergySavingReal struct {
    global.GVA_MODEL
    Name  *string `json:"name" form:"name" gorm:"column:name;comment:;"`  //点位 
    Hm  *int `json:"hm" form:"hm" gorm:"column:hm;comment:;"`  //时标 
    Flag  *int `json:"flag" form:"flag" gorm:"column:flag;comment:;"`  //标识 
    Data  *float64 `json:"data" form:"data" gorm:"column:data;comment:;"`  //数据 
    Described  *string `json:"described" form:"described" gorm:"column:described;comment:;"`  //描述 
}


// TableName 电能点位实时表 EnergySavingReal自定义表名 energySavingReal
func (EnergySavingReal) TableName() string {
    return "energySavingReal"
}





