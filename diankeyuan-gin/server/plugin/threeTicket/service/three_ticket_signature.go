
package service

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/plugin/threeTicket/model"
    "github.com/flipped-aurora/gin-vue-admin/server/plugin/threeTicket/model/request"
)

var ThreeTicketSignature = new(threeTicketSignature)

type threeTicketSignature struct {}
// CreateThreeTicketSignature 创建用户签名表记录
// Author [yourname](https://github.com/yourname)
func (s *threeTicketSignature) CreateThreeTicketSignature(threeTicketSignature *model.ThreeTicketSignature) (err error) {
	err = global.GVA_DB.Create(threeTicketSignature).Error
	return err
}

// DeleteThreeTicketSignature 删除用户签名表记录
// Author [yourname](https://github.com/yourname)
func (s *threeTicketSignature) DeleteThreeTicketSignature(ID string) (err error) {
	err = global.GVA_DB.Delete(&model.ThreeTicketSignature{},"id = ?",ID).Error
	return err
}

// DeleteThreeTicketSignatureByIds 批量删除用户签名表记录
// Author [yourname](https://github.com/yourname)
func (s *threeTicketSignature) DeleteThreeTicketSignatureByIds(IDs []string) (err error) {
	err = global.GVA_DB.Delete(&[]model.ThreeTicketSignature{},"id in ?",IDs).Error
	return err
}

// UpdateThreeTicketSignature 更新用户签名表记录
// Author [yourname](https://github.com/yourname)
func (s *threeTicketSignature) UpdateThreeTicketSignature(threeTicketSignature model.ThreeTicketSignature) (err error) {
	err = global.GVA_DB.Model(&model.ThreeTicketSignature{}).Where("id = ?",threeTicketSignature.ID).Updates(&threeTicketSignature).Error
	return err
}

// GetThreeTicketSignature 根据ID获取用户签名表记录
// Author [yourname](https://github.com/yourname)
func (s *threeTicketSignature) GetThreeTicketSignature(ID string) (threeTicketSignature model.ThreeTicketSignature, err error) {
	err = global.GVA_DB.Where("id = ?", ID).First(&threeTicketSignature).Error
	return
}
// GetThreeTicketSignatureInfoList 分页获取用户签名表记录
// Author [yourname](https://github.com/yourname)
func (s *threeTicketSignature) GetThreeTicketSignatureInfoList(info request.ThreeTicketSignatureSearch) (list []model.ThreeTicketSignature, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
    // 创建db
	db := global.GVA_DB.Model(&model.ThreeTicketSignature{})
    var threeTicketSignatures []model.ThreeTicketSignature
    // 如果有条件搜索 下方会自动创建搜索语句
    if info.StartCreatedAt !=nil && info.EndCreatedAt !=nil {
     db = db.Where("created_at BETWEEN ? AND ?", info.StartCreatedAt, info.EndCreatedAt)
    }
    if info.UserId != nil && *info.UserId != "" {
        db = db.Where("user_id LIKE ?","%"+*info.UserId+"%")
    }
	err = db.Count(&total).Error
	if err!=nil {
    	return
    }

	if limit != 0 {
       db = db.Limit(limit).Offset(offset)
    }
	err = db.Find(&threeTicketSignatures).Error
	return  threeTicketSignatures, total, err
}

func (s *threeTicketSignature)GetThreeTicketSignaturePublic() {

}
