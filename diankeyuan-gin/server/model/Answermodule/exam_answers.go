// 自动生成模板ExamAnswers
package Answermodule

// 答题记录表 结构体  ExamAnswers
type ExamAnswers struct {
	UserId       *int     `json:"userId" form:"userId" gorm:"primarykey;column:user_id;comment:;size:64;"`                //用户id
	Score        *int     `json:"score" form:"score" gorm:"column:score;comment:;size:64;"`                               //用户得分
	ExamId       *int     `json:"examId" form:"examId" gorm:"column:exam_id;comment:;size:64;"`                           //题库id
	Scoreavg     *float64 `json:"scoreavg" form:"scoreavg" gorm:"column:scoreavg;comment:;"`                              //平均分
	AnswerDetail *string  `json:"answerDetail" form:"answerDetail" gorm:"column:answer_detail;comment:答题详情;type:text;"`   //答题详情
	SubmitTime   *string  `json:"submitTime" form:"submitTime" gorm:"column:submit_time;comment:提交时间;type:varchar(255);"` //提交时间
}

// TableName 答题记录表 ExamAnswers自定义表名 exam_answers
func (ExamAnswers) TableName() string {
	return "exam_answers"
}
