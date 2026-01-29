package router

import (
	"github.com/flipped-aurora/gin-vue-admin/server/router/Answermodule"
	"github.com/flipped-aurora/gin-vue-admin/server/router/energySaving"
	"github.com/flipped-aurora/gin-vue-admin/server/router/examination"
	"github.com/flipped-aurora/gin-vue-admin/server/router/example"
	"github.com/flipped-aurora/gin-vue-admin/server/router/system"
)

var RouterGroupApp = new(RouterGroup)

type RouterGroup struct {
	System       system.RouterGroup
	Example      example.RouterGroup
	EnergySaving energySaving.RouterGroup
	Examination  examination.RouterGroup
	Answermodule Answermodule.RouterGroup
}
