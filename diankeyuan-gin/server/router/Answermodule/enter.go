package Answermodule

import (
	api "github.com/flipped-aurora/gin-vue-admin/server/api/v1"
	"github.com/gin-gonic/gin"
)

type RouterGroup struct {
	QuestionsRouter
	ExamAnswersRouter
	QuestionBankRouter
	ExamRouter
}

var (
	questionsApi    = api.ApiGroupApp.AnswermoduleApiGroup.QuestionsApi
	examAnswersApi  = api.ApiGroupApp.AnswermoduleApiGroup.ExamAnswersApi
	questionBankApi = api.ApiGroupApp.AnswermoduleApiGroup.QuestionBankApi
)

func (s *RouterGroup) InitAnswermoduleRouter(Router *gin.RouterGroup, PublicRouter *gin.RouterGroup) {
	s.QuestionsRouter.InitQuestionsRouter(Router, PublicRouter)
	s.ExamAnswersRouter.InitExamAnswersRouter(Router, PublicRouter)
	s.QuestionBankRouter.InitQuestionBankRouter(Router, PublicRouter)
	s.ExamRouter.InitExamRouter(Router)
}
