package request

import (
	"encoding/json"
	"errors"
	"strconv"

	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/Answermodule"
	"github.com/flipped-aurora/gin-vue-admin/server/model/common/request"
)

type QuestionsSearch struct {
	BankId *int `json:"bankId" form:"bankId"`
	request.PageInfo
}

// CreateQuestionRequest 创建问题的请求结构体
type CreateQuestionRequest struct {
	QuestionType    string      `json:"questionType"`    // 试题类型（字符串格式：1,2,3）
	QuestionContent string      `json:"questionContent"` // 试题内容
	QuestionOptions string      `json:"questionOptions"` // 选项JSON字符串
	CorrectAnswer   interface{} `json:"correctAnswer"`   // 正确答案（可能是字符串或数组）
	Score           float64     `json:"score"`           // 分值
}

// ConvertToQuestion 转换为数据库模型
func (r *CreateQuestionRequest) ConvertToQuestion() (Answermodule.Questions, error) {
	var question Answermodule.Questions

	// 转换 questionType 为 int
	questionType := 0
	if r.QuestionType != "" {
		var err error
		questionType, err = strconv.Atoi(r.QuestionType)
		if err != nil {
			return question, errors.New("试题类型必须为数字")
		}
	}

	// 根据试题类型查找对应的题库
	var questionBank struct {
		ID     uint `gorm:"column:id"`
		TypeId *int `gorm:"column:type_id"`
	}
	result := global.GVA_DB.Table("question_bank").Select("id, type_id").Where("type_id = ?", questionType).First(&questionBank)
	if result.Error != nil {
		return question, errors.New("未找到匹配的题库类型")
	}

	// 验证选项格式（如果有）
	if r.QuestionOptions != "" {
		var options map[string]string
		if err := json.Unmarshal([]byte(r.QuestionOptions), &options); err != nil {
			return question, errors.New("选项格式不正确")
		}
	}

	// 转换 correctAnswer 为字符串
	var correctAnswerStr string
	switch v := r.CorrectAnswer.(type) {
	case []interface{}: // 处理数组类型
		answerBytes, err := json.Marshal(v)
		if err != nil {
			return question, err
		}
		correctAnswerStr = string(answerBytes)
	case string:
		// 检查是否已经是JSON字符串
		if len(v) > 0 && (v[0] == '[' || v[0] == '{') {
			correctAnswerStr = v
		} else {
			correctAnswerStr = `"` + v + `"`
		}
	default:
		answerBytes, err := json.Marshal(v)
		if err != nil {
			return question, err
		}
		correctAnswerStr = string(answerBytes)
	}

	// 创建指针类型的值
	bankId := int(questionBank.ID) // 使用题库的ID作为bank_id
	qType := questionType
	qContent := r.QuestionContent
	qOptions := r.QuestionOptions
	cAnswer := correctAnswerStr
	score := int(r.Score)

	question = Answermodule.Questions{
		BankId:          &bankId,
		QuestionType:    &qType,
		QuestionContent: &qContent,
		QuestionOptions: &qOptions,
		CorrectAnswer:   &cAnswer,
		Score:           &score,
	}

	return question, nil
}
