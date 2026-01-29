package Answermodule

import (
	"fmt"

	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/Answermodule"
	AnswermoduleReq "github.com/flipped-aurora/gin-vue-admin/server/model/Answermodule/request"
)

type QuestionBankService struct{}

// 自定义api
func (questionBankService *QuestionBankService) Test() {
	fmt.Println("。。。。。。。。我来了")
}

// 向题库添加试题
func (questionBankService *QuestionBankService) AddBankQuestion(questions *Answermodule.Questions) (err error) {
	err = global.GVA_DB.Create(questions).Error
	return err
}

// CreateQuestionBank 创建题库表记录
// Author [yourname](https://github.com/yourname)
func (questionBankService *QuestionBankService) CreateQuestionBank(questionBank *Answermodule.QuestionBank) (err error) {
	err = global.GVA_DB.Create(questionBank).Error
	return err
}

// DeleteQuestionBank 删除题库表记录
// Author [yourname](https://github.com/yourname)
func (questionBankService *QuestionBankService) DeleteQuestionBank(title string) (err error) {
	err = global.GVA_DB.Delete(&Answermodule.QuestionBank{}, "title = ?", title).Error
	return err
}

// DeleteQuestionBankByIds 批量删除题库表记录
// Author [yourname](https://github.com/yourname)
func (questionBankService *QuestionBankService) DeleteQuestionBankByIds(titles []string) (err error) {
	err = global.GVA_DB.Delete(&[]Answermodule.QuestionBank{}, "title in ?", titles).Error
	return err
}

// UpdateQuestionBank 更新题库表记录
// Author [yourname](https://github.com/yourname)
func (questionBankService *QuestionBankService) UpdateQuestionBank(questionBank Answermodule.QuestionBank) (err error) {
	err = global.GVA_DB.Model(&Answermodule.QuestionBank{}).Where("title = ?", questionBank.Title).Updates(&questionBank).Error
	return err
}

// GetQuestionBank 根据title获取题库表记录
// Author [yourname](https://github.com/yourname)
func (questionBankService *QuestionBankService) GetQuestionBank(title string) (questionBank Answermodule.QuestionBank, err error) {
	err = global.GVA_DB.Where("title = ?", title).First(&questionBank).Error
	return
}

// GetQuestionBankInfoList 分页获取题库表记录
// Author [yourname](https://github.com/yourname)
func (questionBankService *QuestionBankService) GetQuestionBankInfoList(info AnswermoduleReq.QuestionBankSearch) (list []Answermodule.QuestionBank, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
	// 创建db
	db := global.GVA_DB.Model(&Answermodule.QuestionBank{})
	var questionBanks []Answermodule.QuestionBank
	// 如果有条件搜索 下方会自动创建搜索语句
	if info.Title != nil && *info.Title != "" {
		db = db.Where("title = ?", *info.Title)
	}
	if info.Description != nil && *info.Description != "" {
		db = db.Where("description LIKE ?", "%"+*info.Description+"%")
	}
	if info.TypeId != nil {
		db = db.Where("type_id = ?", *info.TypeId)
	}
	err = db.Count(&total).Error
	if err != nil {
		return
	}

	if limit != 0 {
		db = db.Limit(limit).Offset(offset)
	}

	err = db.Find(&questionBanks).Error
	return questionBanks, total, err
}
func (questionBankService *QuestionBankService) GetQuestionBankPublic() {
	// 此方法为获取数据源定义的数据
	// 请自行实现
}
