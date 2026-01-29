
package service

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/plugin/threeTicket/model"
    "github.com/flipped-aurora/gin-vue-admin/server/plugin/threeTicket/model/request"
)

var ThreeTucjetTemplate = new(threeTucjetTemplate)

type threeTucjetTemplate struct {}
// CreateThreeTucjetTemplate 创建模板记录
// Author [yourname](https://github.com/yourname)
func (s *threeTucjetTemplate) CreateThreeTucjetTemplate(threeTucjetTemplate *model.ThreeTucjetTemplate) (err error) {
	err = global.GVA_DB.Create(threeTucjetTemplate).Error
	return err
}

// DeleteThreeTucjetTemplate 删除模板记录
// Author [yourname](https://github.com/yourname)
func (s *threeTucjetTemplate) DeleteThreeTucjetTemplate(ID string) (err error) {
	err = global.GVA_DB.Delete(&model.ThreeTucjetTemplate{},"id = ?",ID).Error
	return err
}

// DeleteThreeTucjetTemplateByIds 批量删除模板记录
// Author [yourname](https://github.com/yourname)
func (s *threeTucjetTemplate) DeleteThreeTucjetTemplateByIds(IDs []string) (err error) {
	err = global.GVA_DB.Delete(&[]model.ThreeTucjetTemplate{},"id in ?",IDs).Error
	return err
}

// UpdateThreeTucjetTemplate 更新模板记录
// Author [yourname](https://github.com/yourname)
func (s *threeTucjetTemplate) UpdateThreeTucjetTemplate(threeTucjetTemplate model.ThreeTucjetTemplate) (err error) {
	err = global.GVA_DB.Model(&model.ThreeTucjetTemplate{}).Where("id = ?",threeTucjetTemplate.ID).Updates(&threeTucjetTemplate).Error
	return err
}

// GetThreeTucjetTemplate 根据ID获取模板记录
// Author [yourname](https://github.com/yourname)
func (s *threeTucjetTemplate) GetThreeTucjetTemplate(ID string) (threeTucjetTemplate model.ThreeTucjetTemplate, err error) {
	err = global.GVA_DB.Where("id = ?", ID).First(&threeTucjetTemplate).Error
	return
}
// GetThreeTucjetTemplateInfoList 分页获取模板记录
// Author [yourname](https://github.com/yourname)
func (s *threeTucjetTemplate) GetThreeTucjetTemplateInfoList(info request.ThreeTucjetTemplateSearch) (list []model.ThreeTucjetTemplate, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
    // 创建db
	db := global.GVA_DB.Model(&model.ThreeTucjetTemplate{})
    var threeTucjetTemplates []model.ThreeTucjetTemplate
    // 如果有条件搜索 下方会自动创建搜索语句
    if info.StartCreatedAt !=nil && info.EndCreatedAt !=nil {
     db = db.Where("created_at BETWEEN ? AND ?", info.StartCreatedAt, info.EndCreatedAt)
    }
    if info.Name != nil && *info.Name != "" {
        db = db.Where("name LIKE ?","%"+*info.Name+"%")
    }
	err = db.Count(&total).Error
	if err!=nil {
    	return
    }

	if limit != 0 {
       db = db.Limit(limit).Offset(offset)
    }
	err = db.Find(&threeTucjetTemplates).Error
	return  threeTucjetTemplates, total, err
}

func (s *threeTucjetTemplate)GetThreeTucjetTemplatePublic() {

}
