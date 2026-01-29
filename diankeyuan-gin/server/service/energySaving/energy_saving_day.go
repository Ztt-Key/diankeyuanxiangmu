
package energySaving

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/energySaving"
    energySavingReq "github.com/flipped-aurora/gin-vue-admin/server/model/energySaving/request"
)

type EnergySavingDayService struct {}
// CreateEnergySavingDay 创建电能点位小时统计表记录
// Author [yourname](https://github.com/yourname)
func (energySavingDayService *EnergySavingDayService) CreateEnergySavingDay(energySavingDay *energySaving.EnergySavingDay) (err error) {
	err = global.GVA_DB.Create(energySavingDay).Error
	return err
}

// DeleteEnergySavingDay 删除电能点位小时统计表记录
// Author [yourname](https://github.com/yourname)
func (energySavingDayService *EnergySavingDayService)DeleteEnergySavingDay(ID string) (err error) {
	err = global.GVA_DB.Delete(&energySaving.EnergySavingDay{},"id = ?",ID).Error
	return err
}

// DeleteEnergySavingDayByIds 批量删除电能点位小时统计表记录
// Author [yourname](https://github.com/yourname)
func (energySavingDayService *EnergySavingDayService)DeleteEnergySavingDayByIds(IDs []string) (err error) {
	err = global.GVA_DB.Delete(&[]energySaving.EnergySavingDay{},"id in ?",IDs).Error
	return err
}

// UpdateEnergySavingDay 更新电能点位小时统计表记录
// Author [yourname](https://github.com/yourname)
func (energySavingDayService *EnergySavingDayService)UpdateEnergySavingDay(energySavingDay energySaving.EnergySavingDay) (err error) {
	err = global.GVA_DB.Model(&energySaving.EnergySavingDay{}).Where("id = ?",energySavingDay.ID).Updates(&energySavingDay).Error
	return err
}

// GetEnergySavingDay 根据ID获取电能点位小时统计表记录
// Author [yourname](https://github.com/yourname)
func (energySavingDayService *EnergySavingDayService)GetEnergySavingDay(ID string) (energySavingDay energySaving.EnergySavingDay, err error) {
	err = global.GVA_DB.Where("id = ?", ID).First(&energySavingDay).Error
	return
}
// GetEnergySavingDayInfoList 分页获取电能点位小时统计表记录
// Author [yourname](https://github.com/yourname)
func (energySavingDayService *EnergySavingDayService)GetEnergySavingDayInfoList(info energySavingReq.EnergySavingDaySearch) (list []energySaving.EnergySavingDay, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
    // 创建db
	db := global.GVA_DB.Model(&energySaving.EnergySavingDay{})
    var energySavingDays []energySaving.EnergySavingDay
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

	err = db.Find(&energySavingDays).Error
	return  energySavingDays, total, err
}
func (energySavingDayService *EnergySavingDayService)GetEnergySavingDayPublic() {
    // 此方法为获取数据源定义的数据
    // 请自行实现
}
