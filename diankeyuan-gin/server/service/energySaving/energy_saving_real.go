
package energySaving

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/energySaving"
    energySavingReq "github.com/flipped-aurora/gin-vue-admin/server/model/energySaving/request"
)

type EnergySavingRealService struct {}
// CreateEnergySavingReal 创建电能点位实时表记录
// Author [yourname](https://github.com/yourname)
func (energySavingRealService *EnergySavingRealService) CreateEnergySavingReal(energySavingReal *energySaving.EnergySavingReal) (err error) {
	err = global.GVA_DB.Create(energySavingReal).Error
	return err
}

// DeleteEnergySavingReal 删除电能点位实时表记录
// Author [yourname](https://github.com/yourname)
func (energySavingRealService *EnergySavingRealService)DeleteEnergySavingReal(ID string) (err error) {
	err = global.GVA_DB.Delete(&energySaving.EnergySavingReal{},"id = ?",ID).Error
	return err
}

// DeleteEnergySavingRealByIds 批量删除电能点位实时表记录
// Author [yourname](https://github.com/yourname)
func (energySavingRealService *EnergySavingRealService)DeleteEnergySavingRealByIds(IDs []string) (err error) {
	err = global.GVA_DB.Delete(&[]energySaving.EnergySavingReal{},"id in ?",IDs).Error
	return err
}

// UpdateEnergySavingReal 更新电能点位实时表记录
// Author [yourname](https://github.com/yourname)
func (energySavingRealService *EnergySavingRealService)UpdateEnergySavingReal(energySavingReal energySaving.EnergySavingReal) (err error) {
	err = global.GVA_DB.Model(&energySaving.EnergySavingReal{}).Where("id = ?",energySavingReal.ID).Updates(&energySavingReal).Error
	return err
}

// GetEnergySavingReal 根据ID获取电能点位实时表记录
// Author [yourname](https://github.com/yourname)
func (energySavingRealService *EnergySavingRealService)GetEnergySavingReal(ID string) (energySavingReal energySaving.EnergySavingReal, err error) {
	err = global.GVA_DB.Where("id = ?", ID).First(&energySavingReal).Error
	return
}
// GetEnergySavingRealInfoList 分页获取电能点位实时表记录
// Author [yourname](https://github.com/yourname)
func (energySavingRealService *EnergySavingRealService)GetEnergySavingRealInfoList(info energySavingReq.EnergySavingRealSearch) (list []energySaving.EnergySavingReal, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
    // 创建db
	db := global.GVA_DB.Model(&energySaving.EnergySavingReal{})
    var energySavingReals []energySaving.EnergySavingReal
    // 如果有条件搜索 下方会自动创建搜索语句
    if info.StartCreatedAt !=nil && info.EndCreatedAt !=nil {
     db = db.Where("created_at BETWEEN ? AND ?", info.StartCreatedAt, info.EndCreatedAt)
    }
    if info.Name != nil && *info.Name != "" {
        db = db.Where("name LIKE ?","%"+*info.Name+"%")
    }
    if info.Described != nil && *info.Described != "" {
        db = db.Where("described LIKE ?","%"+*info.Described+"%")
    }
	err = db.Count(&total).Error
	if err!=nil {
    	return
    }

	if limit != 0 {
       db = db.Limit(limit).Offset(offset)
    }

	err = db.Find(&energySavingReals).Error
	return  energySavingReals, total, err
}
func (energySavingRealService *EnergySavingRealService)GetEnergySavingRealPublic() {
    // 此方法为获取数据源定义的数据
    // 请自行实现
}
