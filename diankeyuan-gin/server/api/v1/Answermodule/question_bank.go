package Answermodule

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/Answermodule"
	"github.com/flipped-aurora/gin-vue-admin/server/model/Answermodule/request"
	AnswermoduleReq "github.com/flipped-aurora/gin-vue-admin/server/model/Answermodule/request"
	"github.com/flipped-aurora/gin-vue-admin/server/model/common/response"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type QuestionBankApi struct{}

// CreateApiQuestion 创建试题
func (questionBankApi *QuestionBankApi) CreateApiQuestion(c *gin.Context) {
	var req request.CreateQuestionRequest

	// 绑定JSON数据到请求结构体
	if err := c.ShouldBindJSON(&req); err != nil {
		global.GVA_LOG.Error("数据绑定失败!", zap.Error(err))
		response.FailWithMessage("数据格式错误: "+err.Error(), c)
		return
	}

	// 记录请求数据
	global.GVA_LOG.Info("收到创建试题请求",
		zap.Any("bankId", 1),
		zap.Any("questionType", req.QuestionType),
		zap.Any("questionOptions", req.QuestionOptions),
		zap.Any("correctAnswer", req.CorrectAnswer),
	)

	if req.QuestionContent == "" {
		response.FailWithMessage("试题内容不能为空", c)
		return
	}
	if req.Score <= 0 {
		response.FailWithMessage("分数必须大于0", c)
		return
	}

	// 转换为数据库模型
	question, err := req.ConvertToQuestion()
	if err != nil {
		global.GVA_LOG.Error("数据转换失败!", zap.Error(err))
		response.FailWithMessage("数据转换失败: "+err.Error(), c)
		return
	}

	// 调用服务层添加试题
	if err := questionBankService.AddBankQuestion(&question); err != nil {
		global.GVA_LOG.Error("添加试题失败!", zap.Error(err))
		response.FailWithMessage("添加试题失败: "+err.Error(), c)
		return
	}

	response.OkWithMessage("添加试题成功", c)
}

// questionBankService.AddBankQuestion(&Answermodule.Questions{})
// response.Ok(c)

// CreateQuestionBank 创建题库表
// @Tags QuestionBank
// @Summary 创建题库表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body Answermodule.QuestionBank true "创建题库表"
// @Success 200 {object} response.Response{msg=string} "创建成功"
// @Router /questionBank/createQuestionBank [post]
func (questionBankApi *QuestionBankApi) CreateQuestionBank(c *gin.Context) {
	var questionBank Answermodule.QuestionBank
	err := c.ShouldBindJSON(&questionBank)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = questionBankService.CreateQuestionBank(&questionBank)
	if err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("创建成功", c)
}

// DeleteQuestionBank 删除题库表
// @Tags QuestionBank
// @Summary 删除题库表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body Answermodule.QuestionBank true "删除题库表"
// @Success 200 {object} response.Response{msg=string} "删除成功"
// @Router /questionBank/deleteQuestionBank [delete]
func (questionBankApi *QuestionBankApi) DeleteQuestionBank(c *gin.Context) {
	title := c.Query("title")
	err := questionBankService.DeleteQuestionBank(title)
	if err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("删除成功", c)
}

// DeleteQuestionBankByIds 批量删除题库表
// @Tags QuestionBank
// @Summary 批量删除题库表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{msg=string} "批量删除成功"
// @Router /questionBank/deleteQuestionBankByIds [delete]
func (questionBankApi *QuestionBankApi) DeleteQuestionBankByIds(c *gin.Context) {
	titles := c.QueryArray("titles[]")
	err := questionBankService.DeleteQuestionBankByIds(titles)
	if err != nil {
		global.GVA_LOG.Error("批量删除失败!", zap.Error(err))
		response.FailWithMessage("批量删除失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("批量删除成功", c)
}

// UpdateQuestionBank 更新题库表
// @Tags QuestionBank
// @Summary 更新题库表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body Answermodule.QuestionBank true "更新题库表"
// @Success 200 {object} response.Response{msg=string} "更新成功"
// @Router /questionBank/updateQuestionBank [put]
func (questionBankApi *QuestionBankApi) UpdateQuestionBank(c *gin.Context) {
	var questionBank Answermodule.QuestionBank
	err := c.ShouldBindJSON(&questionBank)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = questionBankService.UpdateQuestionBank(questionBank)
	if err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("更新成功", c)
}

// FindQuestionBank 用id查询题库表
// @Tags QuestionBank
// @Summary 用id查询题库表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query Answermodule.QuestionBank true "用id查询题库表"
// @Success 200 {object} response.Response{data=Answermodule.QuestionBank,msg=string} "查询成功"
// @Router /questionBank/findQuestionBank [get]
func (questionBankApi *QuestionBankApi) FindQuestionBank(c *gin.Context) {
	title := c.Query("title")
	requestionBank, err := questionBankService.GetQuestionBank(title)
	if err != nil {
		global.GVA_LOG.Error("查询失败!", zap.Error(err))
		response.FailWithMessage("查询失败:"+err.Error(), c)
		return
	}
	response.OkWithData(requestionBank, c)
}

// GetQuestionBankList 分页获取题库表列表
// @Tags QuestionBank
// @Summary 分页获取题库表列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query AnswermoduleReq.QuestionBankSearch true "分页获取题库表列表"
// @Success 200 {object} response.Response{data=response.PageResult,msg=string} "获取成功"
// @Router /questionBank/getQuestionBankList [get]
func (questionBankApi *QuestionBankApi) GetQuestionBankList(c *gin.Context) {
	var pageInfo AnswermoduleReq.QuestionBankSearch
	err := c.ShouldBindQuery(&pageInfo)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	list, total, err := questionBankService.GetQuestionBankInfoList(pageInfo)
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

// GetQuestionBankPublic 不需要鉴权的题库表接口
// @Tags QuestionBank
// @Summary 不需要鉴权的题库表接口
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /questionBank/getQuestionBankPublic [get]
func (questionBankApi *QuestionBankApi) GetQuestionBankPublic(c *gin.Context) {
	// 此接口不需要鉴权
	// 示例为返回了一个固定的消息接口，一般本接口用于C端服务，需要自己实现业务逻辑
	questionBankService.GetQuestionBankPublic()
	response.OkWithDetailed(gin.H{
		"info": "不需要鉴权的题库表接口信息",
	}, "获取成功", c)
}
