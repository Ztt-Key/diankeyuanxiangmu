
package model
import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"gorm.io/datatypes"
)

// ThreeTucjetTemplate 模板 结构体
type ThreeTucjetTemplate struct {
    global.GVA_MODEL
    Name  *string `json:"name" form:"name" gorm:"column:name;comment:;"`  //模板名称
    Value  datatypes.JSON `json:"value" form:"value" gorm:"column:value;comment:;type:text;"swaggertype:"object"`  //模板内容
}


// TableName 模板 ThreeTucjetTemplate自定义表名 three_tucjet_template
func (ThreeTucjetTemplate) TableName() string {
    return "three_tucjet_template"
}







