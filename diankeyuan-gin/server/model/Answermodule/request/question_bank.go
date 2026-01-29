
package request

import (
	"github.com/flipped-aurora/gin-vue-admin/server/model/common/request"
	
)

type QuestionBankSearch struct{
    Title  *string `json:"title" form:"title" `
    Description  *string `json:"description" form:"description" `
    TypeId  *int `json:"typeId" form:"typeId" `
    request.PageInfo
}
