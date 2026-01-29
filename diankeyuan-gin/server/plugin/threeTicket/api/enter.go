package api

import "github.com/flipped-aurora/gin-vue-admin/server/plugin/threeTicket/service"

var (
	Api                         = new(api)
	serviceThreeTucjetTemplate  = service.Service.ThreeTucjetTemplate
	serviceThreeTicketExamples  = service.Service.ThreeTicketExamples
	serviceThreeTicketSignature = service.Service.ThreeTicketSignature
)

type api struct {
	ThreeTucjetTemplate  threeTucjetTemplate
	ThreeTicketExamples  threeTicketExamples
	ThreeTicketSignature threeTicketSignature
}
