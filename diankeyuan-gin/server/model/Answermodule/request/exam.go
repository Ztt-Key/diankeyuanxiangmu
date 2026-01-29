package request

import (
	"github.com/flipped-aurora/gin-vue-admin/server/model/Answermodule"
	"github.com/flipped-aurora/gin-vue-admin/server/model/common/request"
)

// CreateExamRequest 创建考试请求
type CreateExamRequest struct {
	Title             string `json:"title" binding:"required"`
	BankId            uint   `json:"bankId" binding:"required"`
	Duration          int    `json:"duration" binding:"required"`
	StartTime         string `json:"startTime" binding:"required"`
	EndTime           string `json:"endTime" binding:"required"`
	SelectedUsers     []uint `json:"selectedUsers" binding:"required"`
	SelectedQuestions []uint `json:"selectedQuestions" binding:"required"`
}

// ExamSearch 考试搜索
type ExamSearch struct {
	Answermodule.Exam
	request.PageInfo
}

// 删除靠hi是
type DeleteExamRequest struct {
	ID uint `json:"id" binding:"required"`
}

// ExamIDRequest 考试ID请求
type ExamIDRequest struct {
	ID uint `json:"id" binding:"required"`
}
