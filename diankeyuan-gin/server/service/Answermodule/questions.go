package Answermodule

import (
	"errors"

	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/Answermodule"
	AnswermoduleReq "github.com/flipped-aurora/gin-vue-admin/server/model/Answermodule/request"
	"github.com/flipped-aurora/gin-vue-admin/server/model/common/request"
	"github.com/flipped-aurora/gin-vue-admin/server/model/system"
)

type QuestionsService struct{}

// CreateQuestions 创建试题表记录
// Author [yourname](https://github.com/yourname)
func (questionsService *QuestionsService) CreateQuestions(questions *Answermodule.Questions) (err error) {
	println("创建试题表记录内容---", questions)
	err = global.GVA_DB.Create(questions).Error
	return err
}

// DeleteQuestions 删除试题表记录
// Author [yourname](https://github.com/yourname)
func (questionsService *QuestionsService) DeleteQuestions(bankId string) (err error) {
	// err = global.GVA_DB.Delete(&Answermodule.Questions{}, "id = ?", bankId).Error  Delete为软删除 不会真正删除数据库中的数据
	err = global.GVA_DB.Unscoped().Delete(&Answermodule.Questions{}, "id = ?", bankId).Error //彻底删除
	return err
}

// DeleteQuestionsByIds 批量删除试题表记录
// Author [yourname](https://github.com/yourname)
func (questionsService *QuestionsService) DeleteQuestionsByIds(bankIds []string) (err error) {
	err = global.GVA_DB.Delete(&[]Answermodule.Questions{}, "bank_id in ?", bankIds).Error
	return err
}

// UpdateQuestions 更新试题表记录
// Author [yourname](https://github.com/yourname)
func (questionsService *QuestionsService) UpdateQuestions(questions Answermodule.Questions) (err error) {
	err = global.GVA_DB.Model(&Answermodule.Questions{}).Where("bank_id = ?", questions.BankId).Updates(&questions).Error
	return err
}

// GetQuestions 根据bankId获取试题表记录
// Author [yourname](https://github.com/yourname)
func (questionsService *QuestionsService) GetQuestions(bankId string) (questions Answermodule.Questions, err error) {
	err = global.GVA_DB.Where("bank_id = ?", bankId).First(&questions).Error
	return
}

// GetQuestionsInfoList 分页获取试题表记录
// Author [yourname](https://github.com/yourname)
func (questionsService *QuestionsService) GetQuestionsInfoList(info AnswermoduleReq.QuestionsSearch) (list []Answermodule.Questions, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
	// 创建db
	db := global.GVA_DB.Model(&Answermodule.Questions{})
	var questions []Answermodule.Questions

	// 如果有条件搜索 下方会自动创建搜索语句
	if info.BankId != nil {
		// 先根据typeId查找对应的题库ID
		var questionBank Answermodule.QuestionBank
		if err := global.GVA_DB.Where("type_id = ?", *info.BankId).First(&questionBank).Error; err != nil {
			return nil, 0, errors.New("未找到对应的题库")
		}
		// 使用题库ID查询试题
		db = db.Where("bank_id = ?", questionBank.ID)
	}

	err = db.Count(&total).Error
	if err != nil {
		return
	}

	if limit != 0 {
		db = db.Limit(limit).Offset(offset)
	}

	// 添加排序
	db = db.Order("created_at DESC")

	err = db.Find(&questions).Error
	return questions, total, err
}

//获取用户

// 查询题库下的试题
func (questionsService *QuestionsService) GetQuestionsPublic() {
	// 此方法为获取数据源定义的数据
	// 请自行实现
}

// GetQuestionsListUser 获取用户列表
func (questionsService *QuestionsService) GetQuestionsListUser(info request.PageInfo) (list []system.SysUser, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
	db := global.GVA_DB.Model(&system.SysUser{})

	// 只选择需要的字段
	db = db.Select("id, username, nick_name, authority_id")

	// 添加排序
	db = db.Order("id ASC")

	err = db.Count(&total).Error
	if err != nil {
		return list, total, err
	}
	err = db.Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}
