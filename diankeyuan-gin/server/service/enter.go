package service

import (
	"github.com/flipped-aurora/gin-vue-admin/server/service/Answermodule"
	"github.com/flipped-aurora/gin-vue-admin/server/service/energySaving"
	"github.com/flipped-aurora/gin-vue-admin/server/service/examination"
	"github.com/flipped-aurora/gin-vue-admin/server/service/example"
	"github.com/flipped-aurora/gin-vue-admin/server/service/system"
)

var ServiceGroupApp = new(ServiceGroup)

type ServiceGroup struct {
	SystemServiceGroup       system.ServiceGroup
	ExampleServiceGroup      example.ServiceGroup
	EnergySavingServiceGroup energySaving.ServiceGroup
	ExaminationServiceGroup  examination.ServiceGroup
	AnswermoduleServiceGroup Answermodule.ServiceGroup
}
