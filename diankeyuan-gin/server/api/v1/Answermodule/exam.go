package Answermodule

import (
	"bytes"
	"io"
	"strconv"

	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/Answermodule/request"
	"github.com/flipped-aurora/gin-vue-admin/server/model/common/response"
	"github.com/flipped-aurora/gin-vue-admin/server/service"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type ExamApi struct{}

// CreateExam 创建考试
// @Summary 创建考试
// @Description 创建考试
// @Tags Exam
// @Accept json
// @Produce json
// @Param data body request.CreateExamRequest true "创建考试"
// @Success 200 {object} response.Response{data=object,msg=string} "成功"
// @Router /exam/createExam [post]
func (examApi *ExamApi) CreateExam(c *gin.Context) {
	print("--------创建考试测试--------")
	var req request.CreateExamRequest
	err := c.ShouldBindJSON(&req)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}

	if err := service.ServiceGroupApp.AnswermoduleServiceGroup.ExamService.CreateExam(&req); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
		return
	}
	response.OkWithMessage("创建成功", c)
}

// GetExamList 获取考试列表
// @Summary 获取考试列表
// @Description 获取考试列表
// @Tags Exam
// @Accept json
// @Produce json
// @Param data query request.ExamSearch true "获取考试列表"
// @Success 200 {object} response.Response{data=object,msg=string} "成功"
// @Router /exam/getExamList [get]
func (examApi *ExamApi) GetExamList(c *gin.Context) {
	var pageInfo request.ExamSearch
	err := c.ShouldBindQuery(&pageInfo)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}

	// 获取考试列表
	list, total, err := service.ServiceGroupApp.AnswermoduleServiceGroup.ExamService.GetExamList(pageInfo)
	if err != nil {
		global.GVA_LOG.Error("获取失败!", zap.Error(err))
		response.FailWithMessage("获取失败", c)
		return
	}

	// 返回考试列表的全部对象
	response.OkWithDetailed(response.PageResult{
		List:     list, // 直接返回考试列表的全部对象
		Total:    total,
		Page:     pageInfo.Page,
		PageSize: pageInfo.PageSize,
	}, "获取成功", c)
}

// DeleteExam 删除考试
// @Summary 删除考试
// @Description 删除考试
// @Tags Exam
// @Accept jsonf
func (examApi *ExamApi) DeleteExam(c *gin.Context) {
	print("--------删除考试测试--------")
	var req request.DeleteExamRequest
	err := c.ShouldBindJSON(&req)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}

	if err := service.ServiceGroupApp.AnswermoduleServiceGroup.ExamService.DeleteExam(req.ID); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
		return
	}
	response.OkWithMessage("删除成功", c)
}

// GetUserExams 获取用户需要参加的考试列表
// @Tags      Exam
// @Summary   获取用户需要参加的考试列表
// @Security  ApiKeyAuth
// @accept    application/json
// @Produce   application/json
// @Param     data  body      Answermodule.UserIDRequest                 true  "用户ID"
// @Success   200   {object}  response.Response{data=interface{},msg=string}  "获取成功"
// @Router    /exam/getUserExams [post]
func (examApi *ExamApi) GetUserExams(c *gin.Context) {
	var req struct {
		UserId uint `json:"userId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	// 获取用户需要参加的考试列表
	exams, err := service.ServiceGroupApp.AnswermoduleServiceGroup.ExamService.GetUserExams(req.UserId)
	if err != nil {
		global.GVA_LOG.Error("获取用户考试列表失败", zap.Error(err))
		response.FailWithMessage("获取考试列表失败", c)
		return
	}

	response.OkWithDetailed(map[string]interface{}{
		"exams": exams,
	}, "获取成功", c)
}

// GetQuestions 获取考试题目
// @Tags      Exam
// @Summary   获取考试题目
// @Security  ApiKeyAuth
// @accept    application/json
// @Produce   application/json
// @Param     data  body      Answermodule.ExamIDRequest                 true  "考试ID"
// @Success   200   {object}  response.Response{data=interface{},msg=string}  "获取成功"
// @Router    /exam/getQuestions [post]
func (examApi *ExamApi) GetQuestions(c *gin.Context) {
	var req struct {
		ExamId uint `json:"examId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	// 获取考试题目
	questions, err := service.ServiceGroupApp.AnswermoduleServiceGroup.ExamService.GetExamQuestions(req.ExamId)
	if err != nil {
		global.GVA_LOG.Error("获取考试题目失败", zap.Error(err))
		response.FailWithMessage("获取考试题目失败", c)
		return
	}

	response.OkWithDetailed(map[string]interface{}{
		"questions": questions,
	}, "获取成功", c)
}

// SubmitAnswers 提交考试答案
// @Tags      Exam
// @Summary   提交考试答案
// @Security  ApiKeyAuth
// @accept    application/json
// @Produce   application/json
// @Param     data  body      interface{}          true  "提交答案"
// @Success   200   {object}  response.Response{data=map[string]interface{},msg=string}  "提交成功"
// @Router    /exam/submitAnswers [post]
func (examApi *ExamApi) SubmitAnswers(c *gin.Context) {
	var submitData map[string]interface{}
	if err := c.ShouldBindJSON(&submitData); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	// 提交答案
	err := service.ServiceGroupApp.AnswermoduleServiceGroup.ExamService.SubmitAnswers(submitData)
	if err != nil {
		global.GVA_LOG.Error("提交答案失败", zap.Error(err))
		response.FailWithMessage("提交答案失败", c)
		return
	}

	response.OkWithMessage("提交成功", c)
}

// GetUserHistory 获取用户考试历史记录
// @Tags      Exam
// @Summary   获取用户考试历史记录
// @Security  ApiKeyAuth
// @accept    application/json
// @Produce   application/json
// @Param     data  body      Answermodule.UserIDRequest                 true  "用户ID"
// @Success   200   {object}  response.Response{data=interface{},msg=string}  "获取成功"
// @Router    /exam/getUserHistory [post]
func (examApi *ExamApi) GetUserHistory(c *gin.Context) {
	var req struct {
		UserId uint `json:"userId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	// 获取用户考试历史记录
	history, err := service.ServiceGroupApp.AnswermoduleServiceGroup.ExamService.GetUserHistory(req.UserId)
	if err != nil {
		global.GVA_LOG.Error("获取用户考试历史记录失败", zap.Error(err))
		response.FailWithMessage("获取历史记录失败", c)
		return
	}

	response.OkWithDetailed(map[string]interface{}{
		"history": history,
	}, "获取成功", c)
}

// GetAnswerDetail 获取答题详情
// @Tags      Exam
// @Summary   获取答题详情
// @Security  ApiKeyAuth
// @accept    application/json
// @Produce   application/json
// @Param     data  body      Answermodule.AnswerIDRequest                 true  "答题记录ID"
// @Success   200   {object}  response.Response{data=interface{},msg=string}  "获取成功"
// @Router    /exam/getAnswerDetail [post]
func (examApi *ExamApi) GetAnswerDetail(c *gin.Context) {
	var req struct {
		UserId uint `json:"userId"`
		ExamId uint `json:"examId"`
	}

	err := c.ShouldBindJSON(&req)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}

	detail, err := service.ServiceGroupApp.AnswermoduleServiceGroup.ExamService.GetAnswerDetail(req.UserId, req.ExamId)
	// if err != nil {
	// 	// global.GVA_LOG.Error("获取答题详情失败!", zap.Error(err))
	// 	response.FailWithMessage("获取答题详情失败", c)
	// 	return
	// }

	response.OkWithData(map[string]interface{}{"detail": detail}, c)
}

// StartExam 开始考试
// @Summary 开始考试
// @Description 修改考试状态为进行中
// @Tags Exam
// @Accept json
// @Produce json
// @Param data body request.ExamIDRequest true "开始考试"
// @Success 200 {object} response.Response{data=object,msg=string} "成功"
// @Router /exam/startExam [post]
func (examApi *ExamApi) StartExam(c *gin.Context) {
	var idMap map[string]interface{}

	// 打印原始请求Body
	bodyBytes, _ := c.GetRawData()
	global.GVA_LOG.Info("开始考试原始请求:", zap.String("body", string(bodyBytes)))

	// 重新设置Body数据
	c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	// 使用map接收，避免结构体绑定问题
	if err := c.ShouldBindJSON(&idMap); err != nil {
		global.GVA_LOG.Error("请求参数绑定失败:", zap.Error(err))
		response.FailWithMessage("请求参数错误: "+err.Error(), c)
		return
	}

	// 从map中获取id值
	idVal, ok := idMap["id"]
	if !ok {
		response.FailWithMessage("请求参数错误: 缺少id字段", c)
		return
	}

	// 将id值转换为uint
	var examId uint
	switch v := idVal.(type) {
	case float64:
		examId = uint(v)
	case int:
		examId = uint(v)
	case uint:
		examId = v
	case string:
		// 尝试将字符串转换为整数
		i, err := strconv.Atoi(v)
		if err != nil {
			response.FailWithMessage("请求参数错误: id字段格式不正确", c)
			return
		}
		examId = uint(i)
	default:
		response.FailWithMessage("请求参数错误: id字段类型不正确", c)
		return
	}

	global.GVA_LOG.Info("开始考试请求:", zap.Uint("ID", examId))

	if err := service.ServiceGroupApp.AnswermoduleServiceGroup.ExamService.StartExam(examId); err != nil {
		global.GVA_LOG.Error("修改考试状态失败!", zap.Error(err))
		response.FailWithMessage("修改考试状态失败", c)
		return
	}
	response.OkWithMessage("考试已开始", c)
}

// GetExamInfo 获取考试详细信息
// @Summary 获取考试详细信息
// @Description 获取考试详细信息
// @Tags Exam
// @Accept json
// @Produce json
// @Param data body request.ExamIDRequest true "获取考试信息"
// @Success 200 {object} response.Response{data=object,msg=string} "成功"
// @Router /exam/getExamInfo [post]
func (examApi *ExamApi) GetExamInfo(c *gin.Context) {
	var idMap map[string]interface{}

	// 打印原始请求Body
	bodyBytes, _ := c.GetRawData()
	global.GVA_LOG.Info("获取考试信息原始请求:", zap.String("body", string(bodyBytes)))

	// 重新设置Body数据
	c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	// 使用map接收，避免结构体绑定问题
	if err := c.ShouldBindJSON(&idMap); err != nil {
		global.GVA_LOG.Error("请求参数绑定失败:", zap.Error(err))
		response.FailWithMessage("请求参数错误: "+err.Error(), c)
		return
	}

	// 从map中获取id值
	idVal, ok := idMap["id"]
	if !ok {
		response.FailWithMessage("请求参数错误: 缺少id字段", c)
		return
	}

	// 将id值转换为uint
	var examId uint
	switch v := idVal.(type) {
	case float64:
		examId = uint(v)
	case int:
		examId = uint(v)
	case uint:
		examId = v
	case string:
		// 尝试将字符串转换为整数
		i, err := strconv.Atoi(v)
		if err != nil {
			response.FailWithMessage("请求参数错误: id字段格式不正确", c)
			return
		}
		examId = uint(i)
	default:
		response.FailWithMessage("请求参数错误: id字段类型不正确", c)
		return
	}

	global.GVA_LOG.Info("获取考试信息请求:", zap.Uint("ID", examId))

	exam, err := service.ServiceGroupApp.AnswermoduleServiceGroup.ExamService.GetExamInfo(examId)
	if err != nil {
		global.GVA_LOG.Error("获取考试信息失败!", zap.Error(err))
		response.FailWithMessage("获取考试信息失败", c)
		return
	}
	response.OkWithData(exam, c)
}
