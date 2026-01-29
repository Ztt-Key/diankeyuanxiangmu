package Answermodule

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
)

// Exam 考试表
type Exam struct {
	global.GVA_MODEL
	Title             string `json:"title" gorm:"comment:考试标题"`
	BankId            uint   `json:"bankId" gorm:"comment:题库ID"`
	Duration          int    `json:"duration" gorm:"comment:考试时长(分钟)"`
	StartTime         string `json:"startTime" gorm:"comment:开始时间"`
	EndTime           string `json:"endTime" gorm:"comment:结束时间"`
	Status            int    `json:"status" gorm:"default:0;comment:考试状态 0:未开始 1:进行中 2:已结束"`
	SelectedUsers     string `json:"selectedUsers" gorm:"type:text;comment:选择的用户ID列表"`
	SelectedQuestions string `json:"selectedQuestions" gorm:"type:text;comment:选择的试题ID列表"`
}

// TableName 设置表名
func (Exam) TableName() string {
	return "exam"
}
