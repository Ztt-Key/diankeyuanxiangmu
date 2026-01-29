// 自动生成模板QuestionBank
package Answermodule

// 题库表 结构体  QuestionBank
type QuestionBank struct {
	ID          uint    `json:"id" gorm:"primarykey;autoIncrement"`                                         // 主键ID
	Title       *string `json:"title" form:"title" gorm:"column:title;comment:;"`                           //题库标题
	Description *string `json:"description" form:"description" gorm:"column:description;comment:;"`         //题库描述
	TypeId      *int    `json:"typeId" form:"typeId" gorm:"column:type_id;comment:1：单选 2：多选 3：判断;size:64;"` //类型:1：单选 2：多选 3：判断
}

// TableName 题库表 QuestionBank自定义表名 question_bank
func (QuestionBank) TableName() string {
	return "question_bank"
}
