package v1

import (
	"github.com/flipped-aurora/gin-vue-admin/server/api/v1/Answermodule"
	"github.com/flipped-aurora/gin-vue-admin/server/api/v1/energySaving"
	"github.com/flipped-aurora/gin-vue-admin/server/api/v1/examination"
	"github.com/flipped-aurora/gin-vue-admin/server/api/v1/example"
	"github.com/flipped-aurora/gin-vue-admin/server/api/v1/system"
)

var ApiGroupApp = new(ApiGroup)

type ApiGroup struct {
	SystemApiGroup       system.ApiGroup
	ExampleApiGroup      example.ApiGroup
	EnergySavingApiGroup energySaving.ApiGroup
	ExaminationApiGroup  examination.ApiGroup
	AnswermoduleApiGroup Answermodule.ApiGroup
}
