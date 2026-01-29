
package model
import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"gorm.io/datatypes"
)

// ThreeTicketExamples 三票实例 结构体
type ThreeTicketExamples struct {
    global.GVA_MODEL
    Value  datatypes.JSON `json:"value" form:"value" gorm:"column:value;comment:;type:text;"swaggertype:"object"`  //内容
    Log  datatypes.JSON `json:"log" form:"log" gorm:"column:log;comment:;type:text;"swaggertype:"object"`  //填写日志
    TempleId  *string `json:"templeId" form:"templeId" gorm:"column:temple_id;comment:;"`  //绑定模板ID
    ApplicantId  *int `json:"applicantId" form:"applicantId" gorm:"column:applicant_id;comment:;"`  //申请人ID
    ApplicantName  *string `json:"applicantName" form:"applicantName" gorm:"column:applicant_name;comment:;"`  //申请人姓名
}


// TableName 三票实例 ThreeTicketExamples自定义表名 three_ticket_examples
func (ThreeTicketExamples) TableName() string {
    return "three_ticket_examples"
}







