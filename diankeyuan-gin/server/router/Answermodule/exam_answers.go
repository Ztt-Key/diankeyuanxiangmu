package Answermodule

import (
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	"github.com/gin-gonic/gin"
)

type ExamAnswersRouter struct {}

// InitExamAnswersRouter 初始化 答题记录表 路由信息
func (s *ExamAnswersRouter) InitExamAnswersRouter(Router *gin.RouterGroup,PublicRouter *gin.RouterGroup) {
	examAnswersRouter := Router.Group("examAnswers").Use(middleware.OperationRecord())
	examAnswersRouterWithoutRecord := Router.Group("examAnswers")
	examAnswersRouterWithoutAuth := PublicRouter.Group("examAnswers")
	{
		examAnswersRouter.POST("createExamAnswers", examAnswersApi.CreateExamAnswers)   // 新建答题记录表
		examAnswersRouter.DELETE("deleteExamAnswers", examAnswersApi.DeleteExamAnswers) // 删除答题记录表
		examAnswersRouter.DELETE("deleteExamAnswersByIds", examAnswersApi.DeleteExamAnswersByIds) // 批量删除答题记录表
		examAnswersRouter.PUT("updateExamAnswers", examAnswersApi.UpdateExamAnswers)    // 更新答题记录表
	}
	{
		examAnswersRouterWithoutRecord.GET("findExamAnswers", examAnswersApi.FindExamAnswers)        // 根据ID获取答题记录表
		examAnswersRouterWithoutRecord.GET("getExamAnswersList", examAnswersApi.GetExamAnswersList)  // 获取答题记录表列表
	}
	{
	    examAnswersRouterWithoutAuth.GET("getExamAnswersPublic", examAnswersApi.GetExamAnswersPublic)  // 答题记录表开放接口
	}
}
