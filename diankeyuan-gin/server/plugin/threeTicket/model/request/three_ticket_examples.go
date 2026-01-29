
package request
import (
	"github.com/flipped-aurora/gin-vue-admin/server/model/common/request"
	"time"
)
type ThreeTicketExamplesSearch struct{
    StartCreatedAt *time.Time `json:"startCreatedAt" form:"startCreatedAt"`
    EndCreatedAt   *time.Time `json:"endCreatedAt" form:"endCreatedAt"`
    TempleId  *string `json:"templeId" form:"templeId" `
    ApplicantName  *string `json:"applicantName" form:"applicantName" `
    request.PageInfo
}