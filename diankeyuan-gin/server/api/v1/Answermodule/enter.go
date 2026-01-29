package Answermodule

import "github.com/flipped-aurora/gin-vue-admin/server/service"

type ApiGroup struct {
	QuestionsApi
	ExamAnswersApi
	QuestionBankApi
	ExamApi
}

var (
	questionsService    = service.ServiceGroupApp.AnswermoduleServiceGroup.QuestionsService
	examAnswersService  = service.ServiceGroupApp.AnswermoduleServiceGroup.ExamAnswersService
	questionBankService = service.ServiceGroupApp.AnswermoduleServiceGroup.QuestionBankService
	examService         = service.ServiceGroupApp.AnswermoduleServiceGroup.ExamService
)
