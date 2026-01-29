package Answermodule

import (
	"net/http"

	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/Answermodule"
	AnswermoduleReq "github.com/flipped-aurora/gin-vue-admin/server/model/Answermodule/request"
	"github.com/flipped-aurora/gin-vue-admin/server/model/common/request"
	"github.com/flipped-aurora/gin-vue-admin/server/model/common/response"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type QuestionsApi struct{}

// CreateQuestions 创建试题表
// @Tags Questions
// @Summary 创建试题表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body Answermodule.Questions true "创建试题表"
// @Success 200 {object} response.Response{msg=string} "创建成功"
// @Router /questions/createQuestions [post]
func (questionsApi *QuestionsApi) CreateQuestions(c *gin.Context) {
	var questions Answermodule.Questions
	err := c.ShouldBindJSON(&questions)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid questionType"})
		return
	}
	err = questionsService.CreateQuestions(&questions)
	if err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("创建成功", c)
}

// DeleteQuestions 删除试题表
// @Tags Questions
// @Summary 删除试题表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body Answermodule.Questions true "删除试题表"
// @Success 200 {object} response.Response{msg=string} "删除成功"
// @Router /questions/deleteQuestions [delete]
func (questionsApi *QuestionsApi) DeleteQuestions(c *gin.Context) {
	id := c.Query("id")
	print(id)
	err := questionsService.DeleteQuestions(id)
	if err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("删除成功", c)
}

// DeleteQuestionsByIds 批量删除试题表
// @Tags Questions
// @Summary 批量删除试题表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{msg=string} "批量删除成功"
// @Router /questions/deleteQuestionsByIds [delete]
func (questionsApi *QuestionsApi) DeleteQuestionsByIds(c *gin.Context) {
	bankIds := c.QueryArray("bankIds[]")
	err := questionsService.DeleteQuestionsByIds(bankIds)
	if err != nil {
		global.GVA_LOG.Error("批量删除失败!", zap.Error(err))
		response.FailWithMessage("批量删除失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("批量删除成功", c)
}

// UpdateQuestions 更新试题表
// @Tags Questions
// @Summary 更新试题表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body Answermodule.Questions true "更新试题表"
// @Success 200 {object} response.Response{msg=string} "更新成功"
// @Router /questions/updateQuestions [put]
func (questionsApi *QuestionsApi) UpdateQuestions(c *gin.Context) {
	var questions Answermodule.Questions
	err := c.ShouldBindJSON(&questions)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = questionsService.UpdateQuestions(questions)
	if err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("更新成功", c)
}

// FindQuestions 用id查询试题表
// @Tags Questions
// @Summary 用id查询试题表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query Answermodule.Questions true "用id查询试题表"
// @Success 200 {object} response.Response{data=Answermodule.Questions,msg=string} "查询成功"
// @Router /questions/findQuestions [get]
func (questionsApi *QuestionsApi) FindQuestions(c *gin.Context) {
	bankId := c.Query("bankId")
	requestions, err := questionsService.GetQuestions(bankId)
	if err != nil {
		global.GVA_LOG.Error("查询失败!", zap.Error(err))
		response.FailWithMessage("查询失败:"+err.Error(), c)
		return
	}
	response.OkWithData(requestions, c)
}

// GetQuestionsList 分页获取试题表列表
// @Tags Questions
// @Summary 分页获取试题表列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query AnswermoduleReq.QuestionsSearch true "分页获取试题表列表"
// @Success 200 {object} response.Response{data=response.PageResult,msg=string} "获取成功"
// @Router /questions/getQuestionsList [get]
func (questionsApi *QuestionsApi) GetQuestionsList(c *gin.Context) {
	var pageInfo AnswermoduleReq.QuestionsSearch
	err := c.ShouldBindQuery(&pageInfo)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	list, total, err := questionsService.GetQuestionsInfoList(pageInfo)
	if err != nil {
		global.GVA_LOG.Error("获取失败!", zap.Error(err))
		response.FailWithMessage("获取失败:"+err.Error(), c)
		return
	}
	response.OkWithDetailed(response.PageResult{
		List:     list,
		Total:    total,
		Page:     pageInfo.Page,
		PageSize: pageInfo.PageSize,
	}, "获取成功", c)
}

// GetQuestionsPublic 不需要鉴权的试题表接口
// @Tags Questions
// @Summary 不需要鉴权的试题表接口
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /questions/getQuestionsPublic [get]
func (questionsApi *QuestionsApi) GetQuestionsPublic(c *gin.Context) {
	// 此接口不需要鉴权
	// 示例为返回了一个固定的消息接口，一般本接口用于C端服务，需要自己实现业务逻辑
	questionsService.GetQuestionsPublic()
	response.OkWithDetailed(gin.H{
		"info": "不需要鉴权的试题表接口信息",
	}, "获取成功", c)
}

// GetQuestionsListUser 获取用户列表
// @Summary 获取用户列表
// @Description 获取用户列表
// @Tags Questions
// @Accept json
// @Produce json
// @Success 200 {object} response.Response{data=object,msg=string} "成功"
// @Router /questions/getQuestionsListUser [get]
func (questionsApi *QuestionsApi) GetQuestionsListUser(c *gin.Context) {
	var pageInfo request.PageInfo
	err := c.ShouldBindQuery(&pageInfo)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}

	list, total, err := questionsService.GetQuestionsListUser(pageInfo)
	if err != nil {
		global.GVA_LOG.Error("获取失败!", zap.Error(err))
		response.FailWithMessage("获取失败", c)
		return
	}

	// 处理用户信息，转换为前端需要的格式
	userList := make([]map[string]interface{}, len(list))
	for i, user := range list {
		userList[i] = map[string]interface{}{
			"id":        user.ID,
			"username":  user.Username,
			"nick_name": user.NickName,
			"label":     user.NickName, // 用于下拉框显示
			"value":     user.ID,       // 用于下拉框选择
		}
	}

	response.OkWithDetailed(response.PageResult{
		List:     userList,
		Total:    total,
		Page:     pageInfo.Page,
		PageSize: pageInfo.PageSize,
	}, "获取成功", c)
}
