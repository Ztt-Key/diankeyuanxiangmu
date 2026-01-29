
package Answermodule

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/Answermodule"
    AnswermoduleReq "github.com/flipped-aurora/gin-vue-admin/server/model/Answermodule/request"
)

type ExamAnswersService struct {}
// CreateExamAnswers 创建答题记录表记录
// Author [yourname](https://github.com/yourname)
func (examAnswersService *ExamAnswersService) CreateExamAnswers(examAnswers *Answermodule.ExamAnswers) (err error) {
	err = global.GVA_DB.Create(examAnswers).Error
	return err
}

// DeleteExamAnswers 删除答题记录表记录
// Author [yourname](https://github.com/yourname)
func (examAnswersService *ExamAnswersService)DeleteExamAnswers(userId string) (err error) {
	err = global.GVA_DB.Delete(&Answermodule.ExamAnswers{},"user_id = ?",userId).Error
	return err
}

// DeleteExamAnswersByIds 批量删除答题记录表记录
// Author [yourname](https://github.com/yourname)
func (examAnswersService *ExamAnswersService)DeleteExamAnswersByIds(userIds []string) (err error) {
	err = global.GVA_DB.Delete(&[]Answermodule.ExamAnswers{},"user_id in ?",userIds).Error
	return err
}

// UpdateExamAnswers 更新答题记录表记录
// Author [yourname](https://github.com/yourname)
func (examAnswersService *ExamAnswersService)UpdateExamAnswers(examAnswers Answermodule.ExamAnswers) (err error) {
	err = global.GVA_DB.Model(&Answermodule.ExamAnswers{}).Where("user_id = ?",examAnswers.UserId).Updates(&examAnswers).Error
	return err
}

// GetExamAnswers 根据userId获取答题记录表记录
// Author [yourname](https://github.com/yourname)
func (examAnswersService *ExamAnswersService)GetExamAnswers(userId string) (examAnswers Answermodule.ExamAnswers, err error) {
	err = global.GVA_DB.Where("user_id = ?", userId).First(&examAnswers).Error
	return
}
// GetExamAnswersInfoList 分页获取答题记录表记录
// Author [yourname](https://github.com/yourname)
func (examAnswersService *ExamAnswersService)GetExamAnswersInfoList(info AnswermoduleReq.ExamAnswersSearch) (list []Answermodule.ExamAnswers, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
    // 创建db
	db := global.GVA_DB.Model(&Answermodule.ExamAnswers{})
    var examAnswerss []Answermodule.ExamAnswers
    // 如果有条件搜索 下方会自动创建搜索语句
    if info.UserId != nil {
        db = db.Where("user_id = ?",*info.UserId)
    }
    if info.ExamId != nil {
        db = db.Where("exam_id = ?",*info.ExamId)
    }
	err = db.Count(&total).Error
	if err!=nil {
    	return
    }

	if limit != 0 {
       db = db.Limit(limit).Offset(offset)
    }

	err = db.Find(&examAnswerss).Error
	return  examAnswerss, total, err
}
func (examAnswersService *ExamAnswersService)GetExamAnswersPublic() {
    // 此方法为获取数据源定义的数据
    // 请自行实现
}
