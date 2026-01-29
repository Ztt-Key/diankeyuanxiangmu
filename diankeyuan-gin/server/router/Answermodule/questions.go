package Answermodule

import (
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	"github.com/gin-gonic/gin"
)

type QuestionsRouter struct{}

// InitQuestionsRouter 初始化 试题表 路由信息
func (s *QuestionsRouter) InitQuestionsRouter(Router *gin.RouterGroup, PublicRouter *gin.RouterGroup) {
	questionsRouter := Router.Group("questions").Use(middleware.OperationRecord())
	questionsRouterWithoutRecord := Router.Group("questions")
	questionsRouterWithoutAuth := PublicRouter.Group("questions")
	{
		questionsRouter.POST("createQuestions", questionsApi.CreateQuestions)             // 新建试题表
		questionsRouter.DELETE("deleteQuestions", questionsApi.DeleteQuestions)           // 删除试题表
		questionsRouter.DELETE("deleteQuestionsByIds", questionsApi.DeleteQuestionsByIds) // 批量删除试题表
		questionsRouter.PUT("updateQuestions", questionsApi.UpdateQuestions)              // 更新试题表
		questionsRouter.GET("getQuestionsListUser", questionsApi.GetQuestionsListUser)    // 获取用户列表
	}
	{
		questionsRouterWithoutRecord.GET("findQuestions", questionsApi.FindQuestions)       // 根据ID获取试题表
		questionsRouterWithoutRecord.GET("getQuestionsList", questionsApi.GetQuestionsList) // 获取试题表列表
	}
	{
		questionsRouterWithoutAuth.GET("getQuestionsPublic", questionsApi.GetQuestionsPublic) // 试题表开放接口
	}
}
