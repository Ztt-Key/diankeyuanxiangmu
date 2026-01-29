
package model
import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"gorm.io/datatypes"
)

// ThreeTicketSignature 用户签名表 结构体
type ThreeTicketSignature struct {
    global.GVA_MODEL
    UserId  *string `json:"userId" form:"userId" gorm:"column:user_id;comment:;"`  //用户ID
    ImgUrl  *string `json:"imgUrl" form:"imgUrl" gorm:"column:img_url;comment:;"`  //签名图片地址
    PassWord  *string `json:"passWord" form:"passWord" gorm:"column:pass_word;comment:;"`  //密码
    Info  datatypes.JSON `json:"info" form:"info" gorm:"column:info;comment:;type:text;"swaggertype:"object"`  //扩展字段
}


// TableName 用户签名表 ThreeTicketSignature自定义表名 three_ticket_signature
func (ThreeTicketSignature) TableName() string {
    return "three_ticket_signature"
}







