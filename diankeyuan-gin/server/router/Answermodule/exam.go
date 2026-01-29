package Answermodule

import (
	v1 "github.com/flipped-aurora/gin-vue-admin/server/api/v1"
	"github.com/gin-gonic/gin"
)

type ExamRouter struct{}

func (s *ExamRouter) InitExamRouter(Router *gin.RouterGroup) {
	examRouter := Router.Group("exam")
	examApi := v1.ApiGroupApp.AnswermoduleApiGroup.ExamApi
	{
		examRouter.POST("createExam", examApi.CreateExam)   // 创建考试
		examRouter.GET("getExamList", examApi.GetExamList)  // 获取考试列表
		examRouter.DELETE("deleteExam", examApi.DeleteExam) // 删除考试
		examRouter.POST("startExam", examApi.StartExam)     // 开始考试（修改状态）
		examRouter.POST("getExamInfo", examApi.GetExamInfo) // 获取考试详细信息

		// 用户答题相关接口
		examRouter.POST("getUserExams", examApi.GetUserExams)       // 获取用户需要参加的考试列表
		examRouter.POST("getQuestions", examApi.GetQuestions)       // 获取考试题目
		examRouter.POST("submitAnswers", examApi.SubmitAnswers)     // 提交考试答案
		examRouter.POST("getUserHistory", examApi.GetUserHistory)   // 获取用户考试历史记录
		examRouter.POST("getAnswerDetail", examApi.GetAnswerDetail) // 获取答题详情
	}
}
