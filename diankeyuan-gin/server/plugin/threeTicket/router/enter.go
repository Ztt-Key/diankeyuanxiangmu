package router

import "github.com/flipped-aurora/gin-vue-admin/server/plugin/threeTicket/api"

var (
	Router                  = new(router)
	apiThreeTucjetTemplate  = api.Api.ThreeTucjetTemplate
	apiThreeTicketExamples  = api.Api.ThreeTicketExamples
	apiThreeTicketSignature = api.Api.ThreeTicketSignature
)

type router struct {
	ThreeTucjetTemplate  threeTucjetTemplate
	ThreeTicketExamples  threeTicketExamples
	ThreeTicketSignature threeTicketSignature
}
