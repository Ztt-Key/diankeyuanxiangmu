
package energySaving

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/energySaving"
    energySavingReq "github.com/flipped-aurora/gin-vue-admin/server/model/energySaving/request"
)

type EnergySavingSubscriptionService struct {}
// CreateEnergySavingSubscription 创建电能点位订阅表记录
// Author [yourname](https://github.com/yourname)
func (energySavingSubscriptionService *EnergySavingSubscriptionService) CreateEnergySavingSubscription(energySavingSubscription *energySaving.EnergySavingSubscription) (err error) {
	err = global.GVA_DB.Create(energySavingSubscription).Error
	return err
}

// DeleteEnergySavingSubscription 删除电能点位订阅表记录
// Author [yourname](https://github.com/yourname)
func (energySavingSubscriptionService *EnergySavingSubscriptionService)DeleteEnergySavingSubscription(ID string) (err error) {
	err = global.GVA_DB.Delete(&energySaving.EnergySavingSubscription{},"id = ?",ID).Error
	return err
}

// DeleteEnergySavingSubscriptionByIds 批量删除电能点位订阅表记录
// Author [yourname](https://github.com/yourname)
func (energySavingSubscriptionService *EnergySavingSubscriptionService)DeleteEnergySavingSubscriptionByIds(IDs []string) (err error) {
	err = global.GVA_DB.Delete(&[]energySaving.EnergySavingSubscription{},"id in ?",IDs).Error
	return err
}

// UpdateEnergySavingSubscription 更新电能点位订阅表记录
// Author [yourname](https://github.com/yourname)
func (energySavingSubscriptionService *EnergySavingSubscriptionService)UpdateEnergySavingSubscription(energySavingSubscription energySaving.EnergySavingSubscription) (err error) {
	err = global.GVA_DB.Model(&energySaving.EnergySavingSubscription{}).Where("id = ?",energySavingSubscription.ID).Updates(&energySavingSubscription).Error
	return err
}

// GetEnergySavingSubscription 根据ID获取电能点位订阅表记录
// Author [yourname](https://github.com/yourname)
func (energySavingSubscriptionService *EnergySavingSubscriptionService)GetEnergySavingSubscription(ID string) (energySavingSubscription energySaving.EnergySavingSubscription, err error) {
	err = global.GVA_DB.Where("id = ?", ID).First(&energySavingSubscription).Error
	return
}
// GetEnergySavingSubscriptionInfoList 分页获取电能点位订阅表记录
// Author [yourname](https://github.com/yourname)
func (energySavingSubscriptionService *EnergySavingSubscriptionService)GetEnergySavingSubscriptionInfoList(info energySavingReq.EnergySavingSubscriptionSearch) (list []energySaving.EnergySavingSubscription, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
    // 创建db
	db := global.GVA_DB.Model(&energySaving.EnergySavingSubscription{})
    var energySavingSubscriptions []energySaving.EnergySavingSubscription
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
    if info.Subscription != nil {
        db = db.Where("subscription = ?",*info.Subscription)
    }
	err = db.Count(&total).Error
	if err!=nil {
    	return
    }

	if limit != 0 {
       db = db.Limit(limit).Offset(offset)
    }

	err = db.Find(&energySavingSubscriptions).Error
	return  energySavingSubscriptions, total, err
}
func (energySavingSubscriptionService *EnergySavingSubscriptionService)GetEnergySavingSubscriptionPublic() {
    // 此方法为获取数据源定义的数据
    // 请自行实现
}
