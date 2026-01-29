
package request

import (
	"github.com/flipped-aurora/gin-vue-admin/server/model/common/request"
	
)

type ExamAnswersSearch struct{
    UserId  *int `json:"userId" form:"userId" `
    ExamId  *int `json:"examId" form:"examId" `
    request.PageInfo
}
