package initialize

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/Answermodule"
	"github.com/flipped-aurora/gin-vue-admin/server/model/energySaving"
)

func bizModel() error {
	db := global.GVA_DB
	err := db.AutoMigrate(energySaving.EnergySavingSubscription{}, energySaving.EnergySavingReal{}, energySaving.EnergySavingDay{}, Answermodule.Questions{}, Answermodule.ExamAnswers{}, Answermodule.QuestionBank{})
	if err != nil {
		return err
	}
	return nil
}
