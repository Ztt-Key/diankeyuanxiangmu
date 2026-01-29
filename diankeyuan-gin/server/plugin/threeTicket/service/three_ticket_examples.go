
package service

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/plugin/threeTicket/model"
    "github.com/flipped-aurora/gin-vue-admin/server/plugin/threeTicket/model/request"
)

var ThreeTicketExamples = new(threeTicketExamples)

type threeTicketExamples struct {}
// CreateThreeTicketExamples 创建三票实例记录
// Author [yourname](https://github.com/yourname)
func (s *threeTicketExamples) CreateThreeTicketExamples(threeTicketExamples *model.ThreeTicketExamples) (err error) {
	err = global.GVA_DB.Create(threeTicketExamples).Error
	return err
}

// DeleteThreeTicketExamples 删除三票实例记录
// Author [yourname](https://github.com/yourname)
func (s *threeTicketExamples) DeleteThreeTicketExamples(ID string) (err error) {
	err = global.GVA_DB.Delete(&model.ThreeTicketExamples{},"id = ?",ID).Error
	return err
}

// DeleteThreeTicketExamplesByIds 批量删除三票实例记录
// Author [yourname](https://github.com/yourname)
func (s *threeTicketExamples) DeleteThreeTicketExamplesByIds(IDs []string) (err error) {
	err = global.GVA_DB.Delete(&[]model.ThreeTicketExamples{},"id in ?",IDs).Error
	return err
}

// UpdateThreeTicketExamples 更新三票实例记录
// Author [yourname](https://github.com/yourname)
func (s *threeTicketExamples) UpdateThreeTicketExamples(threeTicketExamples model.ThreeTicketExamples) (err error) {
	err = global.GVA_DB.Model(&model.ThreeTicketExamples{}).Where("id = ?",threeTicketExamples.ID).Updates(&threeTicketExamples).Error
	return err
}

// GetThreeTicketExamples 根据ID获取三票实例记录
// Author [yourname](https://github.com/yourname)
func (s *threeTicketExamples) GetThreeTicketExamples(ID string) (threeTicketExamples model.ThreeTicketExamples, err error) {
	err = global.GVA_DB.Where("id = ?", ID).First(&threeTicketExamples).Error
	return
}
// GetThreeTicketExamplesInfoList 分页获取三票实例记录
// Author [yourname](https://github.com/yourname)
func (s *threeTicketExamples) GetThreeTicketExamplesInfoList(info request.ThreeTicketExamplesSearch) (list []model.ThreeTicketExamples, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
    // 创建db
	db := global.GVA_DB.Model(&model.ThreeTicketExamples{})
    var threeTicketExampless []model.ThreeTicketExamples
    // 如果有条件搜索 下方会自动创建搜索语句
    if info.StartCreatedAt !=nil && info.EndCreatedAt !=nil {
     db = db.Where("created_at BETWEEN ? AND ?", info.StartCreatedAt, info.EndCreatedAt)
    }
    if info.TempleId != nil && *info.TempleId != "" {
        db = db.Where("temple_id LIKE ?","%"+*info.TempleId+"%")
    }
    if info.ApplicantName != nil && *info.ApplicantName != "" {
        db = db.Where("applicant_name LIKE ?","%"+*info.ApplicantName+"%")
    }
	err = db.Count(&total).Error
	if err!=nil {
    	return
    }

	if limit != 0 {
       db = db.Limit(limit).Offset(offset)
    }
	err = db.Find(&threeTicketExampless).Error
	return  threeTicketExampless, total, err
}

func (s *threeTicketExamples)GetThreeTicketExamplesPublic() {

}
