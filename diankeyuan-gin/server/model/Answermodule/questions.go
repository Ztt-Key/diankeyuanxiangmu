// 自动生成模板Questions
package Answermodule

// 试题表 结构体  Questions
type Questions struct {
	ID              uint    `json:"id" gorm:"primarykey;autoIncrement"`                                                 // 主键ID
	BankId          *int    `json:"bankId" form:"bankId" gorm:"column:bank_id;comment:所属题库;size:64;"`                   //所属题库
	QuestionType    *int    `json:"questionType" form:"questionType" gorm:"column:question_type;comment:试题类型;size:64;"` //试题类型
	QuestionContent *string `json:"questionContent" form:"questionContent" gorm:"column:question_content;comment:试题描述"` //试题描述
	QuestionOptions *string `json:"QuestionOptions" form:"QuestionOptions" gorm:"column:Question_options;comment:选项详情"` //试题描述
	CorrectAnswer   *string `json:"correctAnswer" form:"correctAnswer" gorm:"column:correct_answer;comment:正确答案"`       //正确答案
	Score           *int    `json:"score" form:"score" gorm:"column:score;comment:分值;size:64;"`                         //分值
	// Analysis        *string        `json:"analysis" form:"analysis" gorm:"column:analysis;comment:题目解析"`                       //题目解析
	// CreatedAt       time.Time      `json:"createdAt" gorm:"column:created_at;comment:创建时间"`                                    // 创建时间
	// UpdatedAt       time.Time      `json:"updatedAt" gorm:"column:updated_at;comment:更新时间"`                                    // 更新时间
	// DeletedAt       gorm.DeletedAt `json:"deletedAt" gorm:"column:deleted_at;comment:删除时间" sql:"index"`                        // 删除时间
}

// TableName 试题表 Questions自定义表名 questions
func (Questions) TableName() string {
	return "questions"
}

// 自定义反序列化逻辑
