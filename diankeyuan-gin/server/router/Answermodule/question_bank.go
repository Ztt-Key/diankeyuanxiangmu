package Answermodule

import (
	v1 "github.com/flipped-aurora/gin-vue-admin/server/api/v1"
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	"github.com/gin-gonic/gin"
)

type QuestionBankRouter struct{}

// 自定义api 测试
func (s *QuestionBankRouter) CreateApiQuestion(Router *gin.RouterGroup) {
	MyRouter := Router.Group("creates")
	api := v1.ApiGroupApp.AnswermoduleApiGroup.QuestionBankApi
	{
		MyRouter.POST("CreateApiQuestion", api.CreateApiQuestion)
	}
}

// 正式
func (s *QuestionBankRouter) AddBankQuestion(Router *gin.RouterGroup) {
	//暴露
	MyRouter := Router.Group("AddBank")
	api := v1.ApiGroupApp.AnswermoduleApiGroup.QuestionBankApi
	{
		MyRouter.POST("AddBankQuestion", api.CreateApiQuestion)
	}
}

// InitQuestionBankRouter 初始化 题库表 路由信息
func (s *QuestionBankRouter) InitQuestionBankRouter(Router *gin.RouterGroup, PublicRouter *gin.RouterGroup) {
	questionBankRouter := Router.Group("questionBank").Use(middleware.OperationRecord())
	questionBankRouterWithoutRecord := Router.Group("questionBank")
	questionBankRouterWithoutAuth := PublicRouter.Group("questionBank")
	{
		questionBankRouter.POST("createQuestionBank", questionBankApi.CreateApiQuestion)              // 新建试题表
		questionBankRouter.POST("CreateBank", questionBankApi.CreateQuestionBank)                     // 新建题库表
		questionBankRouter.DELETE("deleteQuestionBank", questionBankApi.DeleteQuestionBank)           // 删除题库表
		questionBankRouter.DELETE("deleteQuestionBankByIds", questionBankApi.DeleteQuestionBankByIds) // 批量删除题库表
		questionBankRouter.PUT("updateQuestionBank", questionBankApi.UpdateQuestionBank)              // 更新题库表
	}
	{
		questionBankRouterWithoutRecord.GET("findQuestionBank", questionBankApi.FindQuestionBank)       // 根据ID获取题库表
		questionBankRouterWithoutRecord.GET("getQuestionBankList", questionBankApi.GetQuestionBankList) // 获取题库表列表
	}
	{
		questionBankRouterWithoutAuth.GET("getQuestionBankPublic", questionBankApi.GetQuestionBankPublic) // 题库表开放接口
	}
}
