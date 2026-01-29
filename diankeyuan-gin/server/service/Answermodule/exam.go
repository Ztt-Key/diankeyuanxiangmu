package Answermodule

import (
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/Answermodule"
	AnswermoduleReq "github.com/flipped-aurora/gin-vue-admin/server/model/Answermodule/request"
)

// extractOptionTexts 从问题内容中提取选项文本
func extractOptionTexts(content string) map[string]string {
	result := make(map[string]string)

	// 常见的选项格式
	patterns := []string{
		`([A-D])[\.、:：\s]+([^\n]+)`,              // A. 选项内容 或 A: 选项内容
		`选项\s?([A-D])[\.、:：\s]*([^\n]+)`,         // 选项A: 选项内容
		`([A-D])\s?选项[\.、:：\s]*([^\n]+)`,         // A选项: 选项内容
		`\(?([A-D])\)?[\.、:：\s]+([^\n]+)`,        // (A) 选项内容
		`选项\s?([A-D])[^:：]*[:：]\s*(.+?)(?=\n|$)`, // 选项A：选项内容
	}

	// 尝试各种模式
	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		matches := re.FindAllStringSubmatch(content, -1)

		for _, match := range matches {
			if len(match) >= 3 {
				label := match[1]      // A, B, C, D
				optionText := match[2] // 选项内容
				optionText = strings.TrimSpace(optionText)

				// 如果已经有值且新值不为空，保留原值
				if _, exists := result[label]; !exists && optionText != "" {
					result[label] = optionText
				}
			}
		}
	}

	// 如果通过常规模式没有找到选项，尝试更复杂的多行模式
	if len(result) == 0 {
		// 尝试查找多行选项模式
		lines := strings.Split(content, "\n")
		optionPattern := regexp.MustCompile(`^\s*([A-D])[\.、:：\s]+(.+)$`)

		for _, line := range lines {
			matches := optionPattern.FindStringSubmatch(line)
			if len(matches) >= 3 {
				label := matches[1]
				optionText := strings.TrimSpace(matches[2])
				if _, exists := result[label]; !exists && optionText != "" {
					result[label] = optionText
				}
			}
		}
	}

	return result
}

type ExamService struct{}

// CreateExam 创建考试
func (examService *ExamService) CreateExam(req *AnswermoduleReq.CreateExamRequest) error {
	// 将用户ID列表转换为JSON字符串
	usersJSON, err := json.Marshal(req.SelectedUsers)
	if err != nil {
		return err
	}

	// 将试题ID列表转换为JSON字符串
	questionsJSON, err := json.Marshal(req.SelectedQuestions)
	if err != nil {
		return err
	}

	exam := Answermodule.Exam{
		Title:             req.Title,
		BankId:            req.BankId,
		Duration:          req.Duration,
		StartTime:         req.StartTime,
		EndTime:           req.EndTime,
		Status:            0, // 初始状态为未开始
		SelectedUsers:     string(usersJSON),
		SelectedQuestions: string(questionsJSON),
	}

	return global.GVA_DB.Create(&exam).Error
}

// GetExamList 获取考试列表
func (examService *ExamService) GetExamList(info AnswermoduleReq.ExamSearch) (list []Answermodule.Exam, total int64, err error) {
	db := global.GVA_DB.Model(&Answermodule.Exam{})

	// 获取总数
	err = db.Count(&total).Error
	if err != nil {
		return list, total, err
	}

	// 获取全部数据
	err = db.Find(&list).Error

	return list, total, err
}

// DeleteExam 删除考试
func (examService *ExamService) DeleteExam(id uint) error {
	return global.GVA_DB.Delete(&Answermodule.Exam{}, id).Error
}

// StartExam 开始考试
func (examService *ExamService) StartExam(id uint) error {
	var exam Answermodule.Exam
	// 查找考试
	if err := global.GVA_DB.First(&exam, id).Error; err != nil {
		return errors.New("找不到对应考试")
	}

	// 修改状态为进行中
	exam.Status = 1
	return global.GVA_DB.Save(&exam).Error
}

// GetExamInfo 获取考试详细信息
func (examService *ExamService) GetExamInfo(id uint) (exam Answermodule.Exam, err error) {
	if err = global.GVA_DB.First(&exam, id).Error; err != nil {
		return exam, errors.New("找不到对应考试")
	}
	return exam, nil
}

// GetUserExams 获取用户需要参加的考试列表
func (examService *ExamService) GetUserExams(userId uint) ([]map[string]interface{}, error) {
	var exams []Answermodule.Exam
	var result []map[string]interface{}

	// 查询包含该用户ID的考试
	// JSON格式查询，例如检查 [1,2,3] 中是否包含 userId
	userIdStr := fmt.Sprintf("%d", userId)

	// 使用LIKE操作符查找包含用户ID的JSON数组
	// 这会匹配 "[userId", "[userId,", ",userId", ",userId,"
	err := global.GVA_DB.Where("selected_users LIKE ? OR selected_users LIKE ? OR selected_users LIKE ? OR selected_users LIKE ?",
		"["+userIdStr+"%", "%,"+userIdStr+"]%", "%,"+userIdStr+",%", "%["+userIdStr+"]%").
		Where("status = ?", 1). // 状态为进行中的考试
		Find(&exams).Error

	if err != nil {
		return nil, err
	}

	// 打印找到的考试记录，方便调试
	for _, exam := range exams {
		global.GVA_LOG.Info(fmt.Sprintf("找到考试: ID=%d, 标题=%s, 用户=%s",
			exam.ID, exam.Title, exam.SelectedUsers))
	}

	// 查询用户已经参加过的考试ID
	var answeredExamIds []uint
	err = global.GVA_DB.Model(&Answermodule.ExamAnswers{}).
		Where("user_id = ?", userId).
		Pluck("exam_id", &answeredExamIds).Error
	if err != nil {
		return nil, err
	}

	// 过滤出用户未参加的考试
	for _, exam := range exams {
		// 检查该考试是否已参加
		hasAnswered := false
		for _, answeredId := range answeredExamIds {
			if int(answeredId) == int(exam.ID) {
				hasAnswered = true
				break
			}
		}

		if !hasAnswered {
			// 查询题目数量
			questionCount := 0
			if exam.SelectedQuestions != "" {
				var questionIDs []int
				err := json.Unmarshal([]byte(exam.SelectedQuestions), &questionIDs)
				if err == nil {
					questionCount = len(questionIDs)
				}
			}

			// 构造返回结果
			examInfo := map[string]interface{}{
				"id":             exam.ID,
				"title":          exam.Title,
				"duration":       exam.Duration,
				"start_time":     exam.StartTime,
				"end_time":       exam.EndTime,
				"status":         exam.Status,
				"question_count": questionCount,
			}
			result = append(result, examInfo)
		}
	}

	return result, nil
}

// GetExamQuestions 获取考试题目
func (examService *ExamService) GetExamQuestions(examId uint) ([]map[string]interface{}, error) {
	var exam Answermodule.Exam
	var result []map[string]interface{}

	// 查询考试信息
	err := global.GVA_DB.First(&exam, examId).Error
	if err != nil {
		return nil, err
	}
	// 解析选择的题目ID（JSON数组）
	var questionIds []int
	err = json.Unmarshal([]byte(exam.SelectedQuestions), &questionIds)
	if err != nil {
		return nil, errors.New("解析题目ID时出错: " + err.Error())
	}

	if len(questionIds) == 0 {
		return nil, errors.New("该考试没有题目")
	}

	global.GVA_LOG.Info(fmt.Sprintf("开始处理考试ID=%d的题目，共%d道题", examId, len(questionIds)))

	// 查询题目详情
	for _, id := range questionIds {
		var question Answermodule.Questions
		err := global.GVA_DB.First(&question, id).Error
		if err != nil {
			global.GVA_LOG.Error(fmt.Sprintf("无法找到题目ID=%d: %s", id, err.Error()))
			continue
		}

		global.GVA_LOG.Info(fmt.Sprintf("处理题目ID=%d", id))

		// 解析选项
		var options []map[string]interface{}

		// 如果题目有选项数据
		if question.QuestionOptions != nil && *question.QuestionOptions != "" {
			global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d的原始选项数据: %s", id, *question.QuestionOptions))

			// 尝试解析为数组
			var rawOptionsArray []map[string]interface{}
			err1 := json.Unmarshal([]byte(*question.QuestionOptions), &rawOptionsArray)

			if err1 == nil && len(rawOptionsArray) > 0 {
				// 成功解析为数组
				global.GVA_LOG.Info(fmt.Sprintf("成功解析为数组，选项数量: %d", len(rawOptionsArray)))

				// 格式化选项
				for i, opt := range rawOptionsArray {
					option := make(map[string]interface{})

					// 设置value
					if val, exists := opt["value"]; exists {
						option["value"] = val
					} else if val, exists := opt["id"]; exists {
						option["value"] = val
					} else {
						option["value"] = fmt.Sprintf("%c", 'A'+i) // A, B, C, D...
					}

					// 设置label
					if val, exists := opt["label"]; exists {
						option["label"] = val
					} else {
						option["label"] = fmt.Sprintf("%c", 'A'+i) // A, B, C, D...
					}

					// 设置text
					if val, exists := opt["text"]; exists {
						option["text"] = val
					} else if val, exists := opt["content"]; exists {
						option["text"] = val
					} else if val, exists := opt["内容"]; exists {
						option["text"] = val
					} else if val, exists := opt["名称"]; exists {
						option["text"] = val
					} else if val, exists := opt[fmt.Sprintf("%c", 'A'+i)]; exists {
						option["text"] = val
					} else {
						option["text"] = fmt.Sprintf("选项%d", i+1)
					}

					options = append(options, option)
				}
			} else {
				// 如果解析数组失败，尝试解析为单个对象
				var rawOptionsObject map[string]interface{}
				err2 := json.Unmarshal([]byte(*question.QuestionOptions), &rawOptionsObject)

				if err2 == nil {
					global.GVA_LOG.Info("解析为单个对象")

					// 检查是否是{"A":"选项A","B":"选项B"}格式
					letters := []string{"A", "B", "C", "D", "E", "F", "G", "H"}
					hasLetterKey := false

					for _, letter := range letters {
						if _, exists := rawOptionsObject[letter]; exists {
							hasLetterKey = true
							break
						}
					}

					if hasLetterKey {
						// 是A,B,C,D键值对格式
						for _, letter := range letters {
							if val, exists := rawOptionsObject[letter]; exists {
								option := map[string]interface{}{
									"value": letter,
									"label": letter,
									"text":  fmt.Sprintf("%v", val),
								}
								options = append(options, option)
							}
						}
					} else {
						// 当作单个选项处理
						option := map[string]interface{}{
							"value": "A",
							"label": "A",
							"text":  fmt.Sprintf("%v", rawOptionsObject),
						}
						options = append(options, option)
					}
				} else {
					// 都解析失败，可能是特殊格式或纯文本
					global.GVA_LOG.Error(fmt.Sprintf("无法解析为JSON: %s", err2.Error()))
					global.GVA_LOG.Info(fmt.Sprintf("尝试处理特殊格式: %s", *question.QuestionOptions))

					// 特殊格式：[{A: "6", B: "7", C: "2", D: "5"}]
					optionStr := *question.QuestionOptions

					// 尝试提取A:"值"格式
					re := regexp.MustCompile(`([A-Z]):\s*["']?([^,"'}\s]+)["']?`)
					matches := re.FindAllStringSubmatch(optionStr, -1)

					if len(matches) > 0 {
						for _, match := range matches {
							if len(match) >= 3 {
								key := match[1]   // A, B, C...
								value := match[2] // 选项值

								option := map[string]interface{}{
									"value": key,
									"label": key,
									"text":  value,
								}
								options = append(options, option)
							}
						}
						global.GVA_LOG.Info(fmt.Sprintf("从特殊格式提取到%d个选项", len(options)))
					} else {
						// 如果特殊格式解析失败，使用原始文本作为单个选项
						option := map[string]interface{}{
							"value": "A",
							"label": "A",
							"text":  optionStr,
						}
						options = append(options, option)
						global.GVA_LOG.Info("使用原始文本作为单个选项")
					}
				}
			}
		} else {
			global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d没有选项数据", id))
		}

		// 如果是判断题且没有选项，添加默认选项
		if question.QuestionType != nil && *question.QuestionType == 3 && len(options) == 0 {
			options = []map[string]interface{}{
				{"value": true, "label": "A", "text": "正确"},
				{"value": false, "label": "B", "text": "错误"},
			}
			global.GVA_LOG.Info("添加判断题默认选项")
		}

		// 如果是选择题但没有选项，提供默认选项
		if question.QuestionType != nil && (*question.QuestionType == 1 || *question.QuestionType == 2) && len(options) == 0 {
			options = []map[string]interface{}{
				{"value": "A", "label": "A", "text": "选项A"},
				{"value": "B", "label": "B", "text": "选项B"},
				{"value": "C", "label": "C", "text": "选项C"},
				{"value": "D", "label": "D", "text": "选项D"},
			}
			global.GVA_LOG.Info("添加选择题默认选项")
		}

		// 如果还没有选项，提供一个默认选项
		if len(options) == 0 {
			options = []map[string]interface{}{
				{"value": "A", "label": "A", "text": "默认选项A"},
				{"value": "B", "label": "B", "text": "默认选项B"},
				{"value": "C", "label": "C", "text": "默认选项C"},
				{"value": "D", "label": "D", "text": "默认选项D"},
			}
			global.GVA_LOG.Info("添加默认选项")
		}

		// 确保选择题有四个选项
		if question.QuestionType != nil && (*question.QuestionType == 1 || *question.QuestionType == 2) {
			// 确保有ABCD四个选项
			requiredLabels := []string{"A", "B", "C", "D"}
			existingLabels := make(map[string]bool)
			existingOptions := make(map[string]map[string]interface{})

			for _, opt := range options {
				if label, ok := opt["label"].(string); ok {
					existingLabels[label] = true
					existingOptions[label] = opt
				}
			}

			// 尝试直接从QuestionOptions中解析选项内容
			var optionTexts map[string]string = make(map[string]string)

			// 1. 先尝试从QuestionOptions中直接解析
			if question.QuestionOptions != nil && *question.QuestionOptions != "" {
				optionData := *question.QuestionOptions

				// 尝试解析为JSON对象
				var optionList []map[string]interface{}
				err := json.Unmarshal([]byte(optionData), &optionList)
				if err == nil && len(optionList) > 0 {
					// 成功解析为选项列表
					for _, opt := range optionList {
						if label, ok := opt["label"].(string); ok {
							if text, ok := opt["text"].(string); ok && text != "" {
								optionTexts[label] = text
							} else if content, ok := opt["content"].(string); ok && content != "" {
								optionTexts[label] = content
							}
						}
					}
					global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d：从QuestionOptions的JSON列表中提取到选项内容: %v", id, optionTexts))
				} else {
					// 尝试解析为JSON对象
					var optionMap map[string]interface{}
					err := json.Unmarshal([]byte(optionData), &optionMap)
					if err == nil {
						// 尝试提取选项内容
						for label, content := range optionMap {
							if contentStr, ok := content.(string); ok && contentStr != "" {
								optionTexts[label] = contentStr
							}
						}
						global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d：从QuestionOptions的JSON对象中提取到选项内容: %v", id, optionTexts))
					} else {
						// 尝试直接从文本中解析
						extracted := extractOptionTexts(optionData)
						if len(extracted) > 0 {
							optionTexts = extracted
							global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d：从QuestionOptions的文本中提取到选项内容: %v", id, optionTexts))
						}
					}
				}
			}

			// 2. 如果从QuestionOptions中没有找到选项，尝试从题目内容中提取
			if len(optionTexts) == 0 && question.QuestionContent != nil {
				extracted := extractOptionTexts(*question.QuestionContent)
				if len(extracted) > 0 {
					optionTexts = extracted
					global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d：从题目内容中提取到选项内容: %v", id, optionTexts))
				}
			}

			// 3. 查询关联的选项表 - 模拟实现
			if len(optionTexts) == 0 {
				// 这里可以添加对选项表的查询 - 现在仅作为示例
				global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d：未能从现有数据中提取选项内容", id))
			}

			// 添加缺失的选项，并尝试提取选项内容
			for _, label := range requiredLabels {
				if !existingLabels[label] {
					optionText := fmt.Sprintf("选项%s", label)

					// 如果从题目内容中提取到了选项文本，使用提取的文本
					if extractedText, exists := optionTexts[label]; exists && extractedText != "" {
						optionText = extractedText
					}

					options = append(options, map[string]interface{}{
						"value": label,
						"label": label,
						"text":  optionText,
					})
				} else if opt, exists := existingOptions[label]; exists {
					// 检查现有选项的text是否为默认值，如有需要替换为提取的文本
					if text, ok := opt["text"].(string); ok && (text == "" || text == fmt.Sprintf("选项%s", label)) {
						if extractedText, exists := optionTexts[label]; exists && extractedText != "" {
							opt["text"] = extractedText
						}
					}
				}
			}

			// 确保选项顺序为A, B, C, D
			sortedOptions := make([]map[string]interface{}, 0, len(requiredLabels))
			for _, label := range requiredLabels {
				for _, opt := range options {
					if lbl, ok := opt["label"].(string); ok && lbl == label {
						sortedOptions = append(sortedOptions, opt)
						break
					}
				}
			}

			// 如果成功排序，替换原来的选项列表
			if len(sortedOptions) == len(requiredLabels) {
				options = sortedOptions
			}

			// 添加调试日志
			global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d：最终选项列表包含 %d 个选项", id, len(options)))
			for i, opt := range options {
				global.GVA_LOG.Info(fmt.Sprintf("选项[%d]: label=%v, text=%v", i, opt["label"], opt["text"]))
			}
		}

		// 根据题型转换类型标识
		questionType := "single"
		if question.QuestionType != nil {
			switch *question.QuestionType {
			case 1:
				questionType = "single"
			case 2:
				questionType = "multiple"
			case 3:
				questionType = "boolean"
			}
		}

		// 解析正确答案
		var correctAnswer interface{}
		if question.CorrectAnswer != nil {
			err := json.Unmarshal([]byte(*question.CorrectAnswer), &correctAnswer)
			if err != nil {
				global.GVA_LOG.Error(fmt.Sprintf("解析正确答案失败，题目ID=%d: %s", id, err.Error()))

				// 如果解析JSON失败，尝试直接处理原始字符串
				correctAnswerStr := *question.CorrectAnswer

				// 移除多余的引号并处理特殊格式
				correctAnswerStr = strings.Trim(correctAnswerStr, "\"")

				// 处理单选题特殊情况
				if questionType == "single" {
					// 如果是类似于"C"或'C'格式的单选题答案，直接使用字符值
					if len(correctAnswerStr) == 1 && correctAnswerStr >= "A" && correctAnswerStr <= "Z" {
						correctAnswer = correctAnswerStr
						global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d: 单选题答案处理为: %s", id, correctAnswerStr))
					} else {
						correctAnswer = correctAnswerStr
					}
				} else if questionType == "boolean" {
					// 处理判断题
					if strings.ToLower(correctAnswerStr) == "true" {
						correctAnswer = 1 // 转为整数1表示true
					} else if strings.ToLower(correctAnswerStr) == "false" {
						correctAnswer = 0 // 转为整数0表示false
					} else {
						correctAnswer = correctAnswerStr
					}
				} else {
					// 多选题或其他类型，直接使用原始字符串
					correctAnswer = correctAnswerStr
				}
			} else {
				// 如果JSON解析成功，但需要对单选题答案做额外处理
				if questionType == "single" {
					// 如果解析后是字符串且带有额外引号，如""C""，需要去除
					if strVal, ok := correctAnswer.(string); ok {
						// 移除多余的引号
						strVal = strings.Trim(strVal, "\"")
						// 如果是单个字符，可能是选项标识
						if len(strVal) == 1 && strVal >= "A" && strVal <= "Z" {
							correctAnswer = strVal
							global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d: 单选题答案处理为: %s", id, strVal))
						}
					}
				} else if questionType == "boolean" {
					// 处理判断题的布尔值转数值
					if boolVal, ok := correctAnswer.(bool); ok {
						if boolVal {
							correctAnswer = 1
						} else {
							correctAnswer = 0
						}
					} else if strVal, ok := correctAnswer.(string); ok {
						if strings.ToLower(strVal) == "true" {
							correctAnswer = 1
						} else if strings.ToLower(strVal) == "false" {
							correctAnswer = 0
						}
					}
				}
			}
		}

		// 构造题目信息
		questionInfo := map[string]interface{}{
			"id":             question.ID,
			"content":        question.QuestionContent,
			"type":           questionType,
			"score":          question.Score,
			"user_score":     0, // 默认用户得分为0
			"options":        options,
			"user_answer":    nil, // 无法从旧记录中获取用户答案
			"correct_answer": correctAnswer,
			"is_correct":     false,       // 默认回答不正确
			"status":         "incorrect", // 状态为不正确
		}

		// 判断题特殊处理：确保判断题有"正确"和"错误"选项
		if questionType == "boolean" {
			// 检查是否已有标准判断题选项
			hasTrue := false
			hasFalse := false

			for _, opt := range options {
				if val, exists := opt["value"]; exists {
					// 检查是否包含true或false
					if fmt.Sprintf("%v", val) == "true" || fmt.Sprintf("%v", val) == "True" || fmt.Sprintf("%v", val) == "A" || fmt.Sprintf("%v", val) == "正确" {
						hasTrue = true
					}
					if fmt.Sprintf("%v", val) == "false" || fmt.Sprintf("%v", val) == "False" || fmt.Sprintf("%v", val) == "B" || fmt.Sprintf("%v", val) == "错误" {
						hasFalse = true
					}
				}
			}

			// 如果没有标准选项，添加它们
			if !hasTrue || !hasFalse {
				global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d为判断题，但缺少标准选项，重置选项", id))

				// 重置选项为标准判断题选项
				options = []map[string]interface{}{
					{"value": true, "label": "A", "text": "正确"},
					{"value": false, "label": "B", "text": "错误"},
				}

				// 更新题目信息中的选项
				questionInfo["options"] = options
				global.GVA_LOG.Info(fmt.Sprintf("为判断题添加了标准选项：正确/错误"))
			}
		}

		global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d处理完成", id))
		result = append(result, questionInfo)
	}

	global.GVA_LOG.Info(fmt.Sprintf("考试ID=%d的题目处理完成，共%d道题", examId, len(result)))
	return result, nil
}

// SubmitAnswers 提交考试答案
func (examService *ExamService) SubmitAnswers(submitData map[string]interface{}) error {
	examId, ok1 := submitData["exam_id"].(float64)
	userId, ok2 := submitData["user_id"].(float64)
	answers, ok3 := submitData["answers"].(map[string]interface{})
	submitTime, ok4 := submitData["submit_time"].(string)

	if !ok1 || !ok2 || !ok3 || !ok4 {
		return errors.New("提交的数据格式不正确")
	}

	// 获取考试信息
	var exam Answermodule.Exam
	err := global.GVA_DB.First(&exam, uint(examId)).Error
	if err != nil {
		return err
	}

	// 获取考试题目（JSON数组）
	var questionIds []int
	err = json.Unmarshal([]byte(exam.SelectedQuestions), &questionIds)
	if err != nil {
		return errors.New("解析题目ID时出错: " + err.Error())
	}

	// 计算得分
	var totalScore int = 0
	var userScore int = 0

	// 保存详细的答题记录
	detailedAnswers := make(map[string]interface{})
	questionDetails := make([]map[string]interface{}, 0)

	// 检查是否已经有前端计算好的详细答题信息
	detailedAnswersFromClient, hasDetailedAnswers := submitData["detailed_answers"].(map[string]interface{})

	// 如果前端已经传递了评分信息，直接使用
	if hasDetailedAnswers {
		global.GVA_LOG.Info("使用前端提供的详细答题信息")

		// 使用前端传递的分数信息
		if userScoreFromClient, ok := submitData["user_score"].(float64); ok {
			userScore = int(userScoreFromClient)
			global.GVA_LOG.Info(fmt.Sprintf("使用前端计算的用户得分: %d", userScore))
		}

		if totalScoreFromClient, ok := submitData["total_score"].(float64); ok {
			totalScore = int(totalScoreFromClient)
			global.GVA_LOG.Info(fmt.Sprintf("使用前端计算的总分: %d", totalScore))
		}

		// 遍历题目，构建详细记录
		for _, id := range questionIds {
			questionIdStr := fmt.Sprintf("%d", id)

			// 获取题目信息
			var question Answermodule.Questions
			err := global.GVA_DB.First(&question, id).Error
			if err != nil {
				global.GVA_LOG.Error(fmt.Sprintf("无法找到题目ID=%d: %s", id, err.Error()))
				continue
			}

			// 题目详情记录
			questionDetail := map[string]interface{}{
				"question_id":      id,
				"question_content": question.QuestionContent,
				"question_type":    question.QuestionType,
				"question_score":   question.Score,
			}

			// 从前端详细记录中获取该题的答题信息
			if detailFromClient, ok := detailedAnswersFromClient[questionIdStr].(map[string]interface{}); ok {
				// 用户答案
				if userAnswer, exists := detailFromClient["user_answer"]; exists {
					questionDetail["user_answer"] = userAnswer
				} else if userAnswer, exists := answers[questionIdStr]; exists {
					questionDetail["user_answer"] = userAnswer
				} else {
					questionDetail["user_answer"] = nil
				}

				// 正确答案
				if correctAnswer, exists := detailFromClient["correct_answer"]; exists {
					questionDetail["correct_answer"] = correctAnswer
				} else if question.CorrectAnswer != nil {
					var correctAnswer interface{}
					if err := json.Unmarshal([]byte(*question.CorrectAnswer), &correctAnswer); err == nil {
						questionDetail["correct_answer"] = correctAnswer
					} else {
						questionDetail["correct_answer"] = *question.CorrectAnswer
					}
				}

				// 是否正确
				if isCorrect, exists := detailFromClient["correct_answer"].(bool); exists {
					questionDetail["correct_answer"] = isCorrect
				}

				// 用户得分
				if score, exists := detailFromClient["score"].(float64); exists {
					questionDetail["user_score"] = int(score)
				} else if isCorrect, ok := questionDetail["correct_answer"].(bool); ok && isCorrect && question.Score != nil {
					questionDetail["user_score"] = *question.Score
				} else {
					questionDetail["user_score"] = 0
				}
			} else {
				// 如果没有该题的前端详细记录，则使用原始答案并执行后端评分逻辑
				// 用户答案
				userAnswer, exists := answers[questionIdStr]
				if exists {
					questionDetail["user_answer"] = userAnswer
				} else {
					questionDetail["user_answer"] = nil
				}

				// 正确答案
				var correctAnswer interface{}
				if question.CorrectAnswer != nil && *question.CorrectAnswer != "" {
					err := json.Unmarshal([]byte(*question.CorrectAnswer), &correctAnswer)
					if err != nil {
						global.GVA_LOG.Error(fmt.Sprintf("解析正确答案失败，题目ID=%d: %s", id, err.Error()))
						correctAnswerStr := *question.CorrectAnswer
						// 移除多余的引号
						correctAnswerStr = strings.Trim(correctAnswerStr, "\"")

						// 判断题型并相应处理
						questionType := 0
						if question.QuestionType != nil {
							questionType = *question.QuestionType
						}

						// 处理单选题特殊情况
						if questionType == 1 {
							// 如果是单个字符A-Z，直接使用
							if len(correctAnswerStr) == 1 && correctAnswerStr >= "A" && correctAnswerStr <= "Z" {
								correctAnswer = correctAnswerStr
								global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d: 单选题答案处理为: %s", id, correctAnswerStr))
							} else {
								correctAnswer = correctAnswerStr
							}
						} else if questionType == 3 {
							// 处理判断题
							if strings.ToLower(correctAnswerStr) == "true" {
								correctAnswer = 1 // 转为数字1表示true
							} else if strings.ToLower(correctAnswerStr) == "false" {
								correctAnswer = 0 // 转为数字0表示false
							} else {
								correctAnswer = correctAnswerStr
							}
						} else {
							correctAnswer = correctAnswerStr
						}
					} else {
						// JSON解析成功但需要额外处理
						questionType := 0
						if question.QuestionType != nil {
							questionType = *question.QuestionType
						}

						// 处理单选题
						if questionType == 1 {
							if strVal, ok := correctAnswer.(string); ok {
								strVal = strings.Trim(strVal, "\"")
								if len(strVal) == 1 && strVal >= "A" && strVal <= "Z" {
									correctAnswer = strVal
								}
							}
						} else if questionType == 3 {
							// 处理判断题布尔值转数字
							if boolVal, ok := correctAnswer.(bool); ok {
								if boolVal {
									correctAnswer = 1
								} else {
									correctAnswer = 0
								}
							} else if strVal, ok := correctAnswer.(string); ok {
								if strings.ToLower(strVal) == "true" {
									correctAnswer = 1
								} else if strings.ToLower(strVal) == "false" {
									correctAnswer = 0
								}
							}
						}
					}
				}
				questionDetail["correct_answer"] = correctAnswer

				// 判断答案正确性并计算得分
				isCorrect := false
				if exists && question.QuestionType != nil {
					switch *question.QuestionType {
					case 1: // 单选
						// 转换用户答案和正确答案为字符串进行比较
						userAnsStr := fmt.Sprintf("%v", userAnswer)
						correctAnsStr := fmt.Sprintf("%v", correctAnswer)

						// 单选题答案可能是单个字符，如"A"
						isCorrect = userAnsStr == correctAnsStr

						global.GVA_LOG.Info(fmt.Sprintf("单选题比较: 用户答案=%v, 正确答案=%v, 是否正确=%v",
							userAnsStr, correctAnsStr, isCorrect))

					case 3: // 判断题
						// 将用户答案和正确答案都转换为统一格式（数字0或1）进行比较
						var userAnsValue, correctAnsValue int

						// 处理用户答案
						switch ua := userAnswer.(type) {
						case bool:
							if ua {
								userAnsValue = 1
							} else {
								userAnsValue = 0
							}
						case float64:
							userAnsValue = int(ua)
						case string:
							if strings.ToLower(ua) == "true" || ua == "1" {
								userAnsValue = 1
							} else {
								userAnsValue = 0
							}
						default:
							// 转为字符串后判断
							uaStr := fmt.Sprintf("%v", userAnswer)
							if strings.ToLower(uaStr) == "true" || uaStr == "1" {
								userAnsValue = 1
							} else {
								userAnsValue = 0
							}
						}

						// 处理正确答案
						switch ca := correctAnswer.(type) {
						case bool:
							if ca {
								correctAnsValue = 1
							} else {
								correctAnsValue = 0
							}
						case float64:
							correctAnsValue = int(ca)
						case int:
							correctAnsValue = ca
						case string:
							if strings.ToLower(ca) == "true" || ca == "1" {
								correctAnsValue = 1
							} else {
								correctAnsValue = 0
							}
						default:
							// 转为字符串后判断
							caStr := fmt.Sprintf("%v", correctAnswer)
							if strings.ToLower(caStr) == "true" || caStr == "1" {
								correctAnsValue = 1
							} else {
								correctAnsValue = 0
							}
						}

						// 判断是否正确
						isCorrect = userAnsValue == correctAnsValue
						global.GVA_LOG.Info(fmt.Sprintf("判断题比较: 用户答案=%v(%d), 正确答案=%v(%d), 是否正确=%v",
							userAnswer, userAnsValue, correctAnswer, correctAnsValue, isCorrect))

					case 2: // 多选
						// 将用户答案和正确答案转换为字符串集合进行比较
						userAnswerArray, uok := userAnswer.([]interface{})
						correctAnswerArray, cok := correctAnswer.([]interface{})

						if uok && cok {
							// 将用户答案和正确答案转换为字符串集合，便于比较
							userAnswerSet := make(map[string]bool)
							correctAnswerSet := make(map[string]bool)

							for _, ua := range userAnswerArray {
								userAnswerSet[fmt.Sprintf("%v", ua)] = true
							}

							for _, ca := range correctAnswerArray {
								correctAnswerSet[fmt.Sprintf("%v", ca)] = true
							}

							// 检查两个集合是否相等
							if len(userAnswerSet) == len(correctAnswerSet) {
								isCorrect = true
								// 检查每个正确答案是否都在用户答案中
								for caStr := range correctAnswerSet {
									if _, found := userAnswerSet[caStr]; !found {
										isCorrect = false
										break
									}
								}

								// 检查每个用户答案是否都在正确答案中
								for uaStr := range userAnswerSet {
									if _, found := correctAnswerSet[uaStr]; !found {
										isCorrect = false
										break
									}
								}
							}
						}
					}
				}

				questionDetail["is_correct"] = isCorrect
				if isCorrect && question.Score != nil {
					questionDetail["user_score"] = *question.Score
					userScore += *question.Score
				} else {
					questionDetail["user_score"] = 0
				}

				// 更新总分
				if question.Score != nil {
					totalScore += *question.Score
				}
			}

			// 添加到题目详情数组
			questionDetails = append(questionDetails, questionDetail)
		}
	} else {
		// 原有的处理逻辑（当没有前端详细答题信息时使用）
		// 遍历题目计算得分
		for _, id := range questionIds {
			var question Answermodule.Questions
			err := global.GVA_DB.First(&question, id).Error
			if err != nil {
				global.GVA_LOG.Error(fmt.Sprintf("无法找到题目ID=%d: %s", id, err.Error()))
				continue
			}

			// 题目分数
			questionScore := 0
			if question.Score != nil {
				questionScore = *question.Score
				totalScore += questionScore
			}

			// 题目详情记录
			questionDetail := map[string]interface{}{
				"question_id":      id,
				"question_content": question.QuestionContent,
				"question_type":    question.QuestionType,
				"question_score":   questionScore,
				"is_correct":       false,
			}

			// 检查用户答案
			questionIdStr := fmt.Sprintf("%d", id)
			userAnswer, exists := answers[questionIdStr]
			if exists {
				questionDetail["user_answer"] = userAnswer
			} else {
				questionDetail["user_answer"] = nil
			}

			// 获取正确答案
			var correctAnswer interface{}
			if question.CorrectAnswer != nil && *question.CorrectAnswer != "" {
				err := json.Unmarshal([]byte(*question.CorrectAnswer), &correctAnswer)
				if err != nil {
					global.GVA_LOG.Error(fmt.Sprintf("解析正确答案失败，题目ID=%d: %s", id, err.Error()))
					correctAnswerStr := *question.CorrectAnswer
					// 移除多余的引号
					correctAnswerStr = strings.Trim(correctAnswerStr, "\"")

					// 判断题型并相应处理
					questionType := 0
					if question.QuestionType != nil {
						questionType = *question.QuestionType
					}

					// 处理单选题特殊情况
					if questionType == 1 {
						// 如果是单个字符A-Z，直接使用
						if len(correctAnswerStr) == 1 && correctAnswerStr >= "A" && correctAnswerStr <= "Z" {
							correctAnswer = correctAnswerStr
							global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d: 单选题答案处理为: %s", id, correctAnswerStr))
						} else {
							correctAnswer = correctAnswerStr
						}
					} else if questionType == 3 {
						// 处理判断题
						if strings.ToLower(correctAnswerStr) == "true" {
							correctAnswer = 1 // 转为数字1表示true
						} else if strings.ToLower(correctAnswerStr) == "false" {
							correctAnswer = 0 // 转为数字0表示false
						} else {
							correctAnswer = correctAnswerStr
						}
					} else {
						correctAnswer = correctAnswerStr
					}
				} else {
					// JSON解析成功但需要额外处理
					questionType := 0
					if question.QuestionType != nil {
						questionType = *question.QuestionType
					}

					// 处理单选题
					if questionType == 1 {
						if strVal, ok := correctAnswer.(string); ok {
							strVal = strings.Trim(strVal, "\"")
							if len(strVal) == 1 && strVal >= "A" && strVal <= "Z" {
								correctAnswer = strVal
							}
						}
					} else if questionType == 3 {
						// 处理判断题布尔值转数字
						if boolVal, ok := correctAnswer.(bool); ok {
							if boolVal {
								correctAnswer = 1
							} else {
								correctAnswer = 0
							}
						} else if strVal, ok := correctAnswer.(string); ok {
							if strings.ToLower(strVal) == "true" {
								correctAnswer = 1
							} else if strings.ToLower(strVal) == "false" {
								correctAnswer = 0
							}
						}
					}
				}
			}
			questionDetail["correct_answer"] = correctAnswer

			// 判断答案正确性
			isCorrect := false
			if exists && question.QuestionType != nil {
				switch *question.QuestionType {
				case 1: // 单选
					// 转换用户答案和正确答案为字符串进行比较
					userAnsStr := fmt.Sprintf("%v", userAnswer)
					correctAnsStr := fmt.Sprintf("%v", correctAnswer)

					// 单选题答案可能是单个字符，如"A"
					isCorrect = userAnsStr == correctAnsStr

					global.GVA_LOG.Info(fmt.Sprintf("单选题比较: 用户答案=%v, 正确答案=%v, 是否正确=%v",
						userAnsStr, correctAnsStr, isCorrect))

				case 3: // 判断题
					// 将用户答案和正确答案都转换为统一格式（数字0或1）进行比较
					var userAnsValue, correctAnsValue int

					// 处理用户答案
					switch ua := userAnswer.(type) {
					case bool:
						if ua {
							userAnsValue = 1
						} else {
							userAnsValue = 0
						}
					case float64:
						userAnsValue = int(ua)
					case string:
						if strings.ToLower(ua) == "true" || ua == "1" {
							userAnsValue = 1
						} else {
							userAnsValue = 0
						}
					default:
						// 转为字符串后判断
						uaStr := fmt.Sprintf("%v", userAnswer)
						if strings.ToLower(uaStr) == "true" || uaStr == "1" {
							userAnsValue = 1
						} else {
							userAnsValue = 0
						}
					}

					// 处理正确答案
					switch ca := correctAnswer.(type) {
					case bool:
						if ca {
							correctAnsValue = 1
						} else {
							correctAnsValue = 0
						}
					case float64:
						correctAnsValue = int(ca)
					case int:
						correctAnsValue = ca
					case string:
						if strings.ToLower(ca) == "true" || ca == "1" {
							correctAnsValue = 1
						} else {
							correctAnsValue = 0
						}
					default:
						// 转为字符串后判断
						caStr := fmt.Sprintf("%v", correctAnswer)
						if strings.ToLower(caStr) == "true" || caStr == "1" {
							correctAnsValue = 1
						} else {
							correctAnsValue = 0
						}
					}

					// 判断是否正确
					isCorrect = userAnsValue == correctAnsValue
					global.GVA_LOG.Info(fmt.Sprintf("判断题比较: 用户答案=%v(%d), 正确答案=%v(%d), 是否正确=%v",
						userAnswer, userAnsValue, correctAnswer, correctAnsValue, isCorrect))

				case 2: // 多选
					// 将用户答案和正确答案转换为字符串集合进行比较
					userAnswerArray, uok := userAnswer.([]interface{})
					correctAnswerArray, cok := correctAnswer.([]interface{})

					if uok && cok {
						// 将用户答案和正确答案转换为字符串集合，便于比较
						userAnswerSet := make(map[string]bool)
						correctAnswerSet := make(map[string]bool)

						for _, ua := range userAnswerArray {
							userAnswerSet[fmt.Sprintf("%v", ua)] = true
						}

						for _, ca := range correctAnswerArray {
							correctAnswerSet[fmt.Sprintf("%v", ca)] = true
						}

						// 检查两个集合是否相等
						if len(userAnswerSet) == len(correctAnswerSet) {
							isCorrect = true
							// 检查每个正确答案是否都在用户答案中
							for caStr := range correctAnswerSet {
								if _, found := userAnswerSet[caStr]; !found {
									isCorrect = false
									break
								}
							}

							// 检查每个用户答案是否都在正确答案中
							for uaStr := range userAnswerSet {
								if _, found := correctAnswerSet[uaStr]; !found {
									isCorrect = false
									break
								}
							}
						}
					}
				}
			}

			questionDetail["is_correct"] = isCorrect
			if isCorrect {
				questionDetail["user_score"] = questionScore
				userScore += questionScore
			} else {
				questionDetail["user_score"] = 0
			}

			// 添加到题目详情数组
			questionDetails = append(questionDetails, questionDetail)
		}
	}

	// 保存详细答题记录
	detailedAnswers["questions"] = questionDetails
	detailedAnswersJson, _ := json.Marshal(detailedAnswers)

	// 解析提交时间
	submitTimeObj, err := time.Parse(time.RFC3339, submitTime)
	if err != nil {
		// 如果解析失败，使用当前时间
		submitTimeObj = time.Now()
	}
	submitTimeStr := submitTimeObj.Format("2006-01-02 15:04:05")

	// 创建答题记录
	score := userScore
	examIdInt := int(examId)
	userIdInt := int(userId)
	avg := float64(0)
	if totalScore > 0 {
		avg = float64(userScore) / float64(totalScore) * 100
	}
	answersStr := string(detailedAnswersJson)

	examAnswer := Answermodule.ExamAnswers{
		ExamId:       &examIdInt,
		UserId:       &userIdInt,
		Score:        &score,
		Scoreavg:     &avg,
		AnswerDetail: &answersStr,
		SubmitTime:   &submitTimeStr,
	}

	return global.GVA_DB.Create(&examAnswer).Error
}

// GetUserHistory 获取用户考试历史记录
func (examService *ExamService) GetUserHistory(userId uint) ([]map[string]interface{}, error) {
	var examAnswers []Answermodule.ExamAnswers
	var result []map[string]interface{}

	// 查询用户的所有答题记录，按提交时间倒序排列获取最新记录
	userIdInt := int(userId)
	err := global.GVA_DB.Where("user_id = ?", userIdInt).Order("submit_time DESC").Find(&examAnswers).Error
	if err != nil {
		return nil, err
	}

	// 获取详细信息
	for _, answer := range examAnswers {
		if answer.ExamId == nil {
			continue
		}

		var exam Answermodule.Exam
		err := global.GVA_DB.First(&exam, *answer.ExamId).Error
		if err != nil {
			continue
		}

		// 计算题目数量
		questionCount := 0
		if exam.SelectedQuestions != "" {
			var questionIDs []int
			err := json.Unmarshal([]byte(exam.SelectedQuestions), &questionIDs)
			if err == nil {
				questionCount = len(questionIDs)
			}
		}

		// 计算总分
		totalScore := 0
		if exam.SelectedQuestions != "" {
			var questionIDs []int
			if err := json.Unmarshal([]byte(exam.SelectedQuestions), &questionIDs); err == nil {
				// 查询所有题目分数并累加
				for _, qID := range questionIDs {
					var question Answermodule.Questions
					if err := global.GVA_DB.First(&question, qID).Error; err == nil && question.Score != nil {
						totalScore += *question.Score
					}
				}
			}
		}

		// 提交时间
		submitTime := time.Now().Format("2006-01-02 15:04:05")
		if answer.SubmitTime != nil {
			submitTime = *answer.SubmitTime
		}

		// 计算正确率
		correctRate := 0.0
		if answer.Score != nil && totalScore > 0 {
			correctRate = float64(*answer.Score) / float64(totalScore) * 100
		}

		// 构造返回结果
		historyInfo := map[string]interface{}{
			"id":             answer.UserId, // 使用用户ID作为标识
			"user_id":        answer.UserId, // 用户ID
			"exam_id":        answer.ExamId, // 考试ID
			"exam_title":     exam.Title,
			"submit_time":    submitTime,
			"score":          answer.Score,
			"total_score":    totalScore,
			"status":         "submitted",
			"question_count": questionCount,
			"correct_rate":   correctRate,
		}
		result = append(result, historyInfo)
	}

	return result, nil
}

// GetAnswerDetail 获取答题详情
func (examService *ExamService) GetAnswerDetail(userId uint, examId uint) (map[string]interface{}, error) {
	var examAnswer Answermodule.ExamAnswers

	// 使用userId和examId精确查询答题记录
	userIdInt := int(userId)
	examIdInt := int(examId)
	err := global.GVA_DB.Where("user_id = ? AND exam_id = ?", userIdInt, examIdInt).First(&examAnswer).Error
	if err != nil {
		return nil, err
	}

	// 获取考试信息
	var exam Answermodule.Exam
	err = global.GVA_DB.First(&exam, examId).Error
	if err != nil {
		return nil, err
	}

	// 获取题目详情
	var questions []map[string]interface{}
	// 解析题目IDs
	var questionIds []int
	//Unmarshal 用来解析json数据
	err = json.Unmarshal([]byte(exam.SelectedQuestions), &questionIds)
	if err != nil {
		return nil, errors.New("解析题目ID时出错: " + err.Error())
	}

	// 先从详细答题记录中获取答题记录信息
	var detailedQuestionsInfo []map[string]interface{}

	if examAnswer.AnswerDetail != nil && *examAnswer.AnswerDetail != "" {
		var detailedAnswers map[string]interface{}
		if err := json.Unmarshal([]byte(*examAnswer.AnswerDetail), &detailedAnswers); err == nil {
			if questionsInfo, ok := detailedAnswers["questions"].([]interface{}); ok {
				for _, q := range questionsInfo {
					if questionMap, ok := q.(map[string]interface{}); ok {
						detailedQuestionsInfo = append(detailedQuestionsInfo, questionMap)
					}
				}
			}
		}
	}

	// 创建问题ID到用户答案的映射
	questionToAnswerMap := make(map[int]interface{})
	questionToCorrectMap := make(map[int]bool)

	for _, q := range detailedQuestionsInfo {
		if qid, ok := q["question_id"].(float64); ok {
			if userAns, exists := q["user_answer"]; exists {
				questionToAnswerMap[int(qid)] = userAns
			}
			if isCorrect, exists := q["is_correct"].(bool); exists {
				questionToCorrectMap[int(qid)] = isCorrect
			}
		}
	}

	// 遍历题目ID，从数据库获取详细信息
	for _, id := range questionIds {
		var question Answermodule.Questions
		err := global.GVA_DB.First(&question, id).Error
		if err != nil {
			global.GVA_LOG.Error(fmt.Sprintf("无法找到题目ID=%d: %s", id, err.Error()))
			continue
		}

		// 解析选项
		var options []map[string]interface{}

		if question.QuestionOptions != nil {
			// 先尝试解析为标准JSON数组格式
			var rawOptionsArray []map[string]interface{}
			err1 := json.Unmarshal([]byte(*question.QuestionOptions), &rawOptionsArray)

			if err1 == nil && len(rawOptionsArray) > 0 {
				// 成功解析为数组
				global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d选项成功解析为JSON数组，包含%d个选项", id, len(rawOptionsArray)))

				// 格式化选项
				for i, opt := range rawOptionsArray {
					option := make(map[string]interface{})

					// 设置value
					if val, exists := opt["value"]; exists {
						option["value"] = val
					} else if val, exists := opt["id"]; exists {
						option["value"] = val
					} else {
						option["value"] = fmt.Sprintf("%c", 'A'+i) // A, B, C, D...
					}

					// 设置label
					if val, exists := opt["label"]; exists {
						option["label"] = val
					} else {
						option["label"] = fmt.Sprintf("%c", 'A'+i) // A, B, C, D...
					}

					// 设置text
					if val, exists := opt["text"]; exists {
						option["text"] = val
					} else if val, exists := opt["content"]; exists {
						option["text"] = val
					} else if val, exists := opt["内容"]; exists {
						option["text"] = val
					} else if val, exists := opt["option"]; exists {
						option["text"] = val
					} else {
						option["text"] = fmt.Sprintf("选项%c", 'A'+i)
					}

					options = append(options, option)
				}
			} else {
				// 尝试解析为单个对象
				var rawOptionsObject map[string]interface{}
				err2 := json.Unmarshal([]byte(*question.QuestionOptions), &rawOptionsObject)

				if err2 == nil {
					global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d选项成功解析为JSON对象", id))
					// 将单个对象转为选项
					option := make(map[string]interface{})
					option["value"] = "A"
					option["label"] = "A"

					if val, exists := rawOptionsObject["text"]; exists {
						option["text"] = val
					} else if val, exists := rawOptionsObject["content"]; exists {
						option["text"] = val
					} else {
						option["text"] = "选项A"
					}

					options = append(options, option)
				} else {
					// 尝试解析为特殊格式的字符串
					optionStr := *question.QuestionOptions

					// 检查是否可能是特殊格式的选项字符串
					specialFormatRegex := regexp.MustCompile(`([A-Z])[\.、:：\s]+(.+?)(?=\s*[A-Z][\.:：\s]+|$)`)
					matches := specialFormatRegex.FindAllStringSubmatch(optionStr, -1)

					if len(matches) > 0 {
						global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d从特殊格式字符串中提取选项", id))

						for _, match := range matches {
							if len(match) >= 3 {
								key := match[1]   // A, B, C...
								value := match[2] // 选项值

								option := map[string]interface{}{
									"value": key,
									"label": key,
									"text":  value,
								}
								options = append(options, option)
							}
						}
						global.GVA_LOG.Info(fmt.Sprintf("从特殊格式提取到%d个选项", len(options)))
					} else {
						// 如果特殊格式解析失败，使用原始文本作为单个选项
						option := map[string]interface{}{
							"value": "A",
							"label": "A",
							"text":  optionStr,
						}
						options = append(options, option)
						global.GVA_LOG.Info("使用原始文本作为单个选项")
					}
				}
			}
		}

		// 如果是判断题且没有选项，添加默认选项
		if question.QuestionType != nil && *question.QuestionType == 3 && len(options) == 0 {
			options = []map[string]interface{}{
				{"value": true, "label": "A", "text": "正确"},
				{"value": false, "label": "B", "text": "错误"},
			}
			global.GVA_LOG.Info("添加判断题默认选项")
		}

		// 如果是选择题但没有选项，提供默认选项
		if question.QuestionType != nil && (*question.QuestionType == 1 || *question.QuestionType == 2) && len(options) == 0 {
			options = []map[string]interface{}{
				{"value": "A", "label": "A", "text": "选项A"},
				{"value": "B", "label": "B", "text": "选项B"},
				{"value": "C", "label": "C", "text": "选项C"},
				{"value": "D", "label": "D", "text": "选项D"},
			}
			global.GVA_LOG.Info("添加选择题默认选项")
		}

		// 如果还没有选项，提供一个默认选项
		if len(options) == 0 {
			options = []map[string]interface{}{
				{"value": "0", "label": "对", "text": "默认选项A"},
				{"value": "1", "label": "错", "text": "默认选项B"},
			}
			global.GVA_LOG.Info("添加默认选项")
		}

		// 确保选择题有四个选项
		if question.QuestionType != nil && (*question.QuestionType == 1 || *question.QuestionType == 2) {
			// 确保有ABCD四个选项
			requiredLabels := []string{"A", "B", "C", "D"}
			existingLabels := make(map[string]bool)
			existingOptions := make(map[string]map[string]interface{})

			for _, opt := range options {
				if label, ok := opt["label"].(string); ok {
					existingLabels[label] = true
					existingOptions[label] = opt
				}
			}

			// 尝试直接从QuestionOptions中解析选项内容
			var optionTexts map[string]string = make(map[string]string)

			// 1. 先尝试从QuestionOptions中直接解析
			if question.QuestionOptions != nil && *question.QuestionOptions != "" {
				optionData := *question.QuestionOptions

				// 尝试解析为JSON对象
				var optionList []map[string]interface{}
				err := json.Unmarshal([]byte(optionData), &optionList)
				if err == nil && len(optionList) > 0 {
					// 成功解析为选项列表
					for _, opt := range optionList {
						if label, ok := opt["label"].(string); ok {
							if text, ok := opt["text"].(string); ok && text != "" {
								optionTexts[label] = text
							} else if content, ok := opt["content"].(string); ok && content != "" {
								optionTexts[label] = content
							}
						}
					}
					global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d：从QuestionOptions的JSON列表中提取到选项内容: %v", id, optionTexts))
				} else {
					// 尝试解析为JSON对象
					var optionMap map[string]interface{}
					err := json.Unmarshal([]byte(optionData), &optionMap)
					if err == nil {
						// 尝试提取选项内容
						for label, content := range optionMap {
							if contentStr, ok := content.(string); ok && contentStr != "" {
								optionTexts[label] = contentStr
							}
						}
						global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d：从QuestionOptions的JSON对象中提取到选项内容: %v", id, optionTexts))
					} else {
						// 尝试直接从文本中解析
						extracted := extractOptionTexts(optionData)
						if len(extracted) > 0 {
							optionTexts = extracted
							global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d：从QuestionOptions的文本中提取到选项内容: %v", id, optionTexts))
						}
					}
				}
			}

			// 2. 如果从QuestionOptions中没有找到选项，尝试从题目内容中提取
			if len(optionTexts) == 0 && question.QuestionContent != nil {
				extracted := extractOptionTexts(*question.QuestionContent)
				if len(extracted) > 0 {
					optionTexts = extracted
					global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d：从题目内容中提取到选项内容: %v", id, optionTexts))
				}
			}

			// 3. 查询关联的选项表 - 模拟实现
			if len(optionTexts) == 0 {
				// 这里可以添加对选项表的查询 - 现在仅作为示例
				global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d：未能从现有数据中提取选项内容", id))
			}

			// 添加缺失的选项，并尝试提取选项内容
			for _, label := range requiredLabels {
				if !existingLabels[label] {
					optionText := fmt.Sprintf("选项%s", label)

					// 如果从题目内容中提取到了选项文本，使用提取的文本
					if extractedText, exists := optionTexts[label]; exists && extractedText != "" {
						optionText = extractedText
					}

					options = append(options, map[string]interface{}{
						"value": label,
						"label": label,
						"text":  optionText,
					})
				} else if opt, exists := existingOptions[label]; exists {
					// 检查现有选项的text是否为默认值，如有需要替换为提取的文本
					if text, ok := opt["text"].(string); ok && (text == "" || text == fmt.Sprintf("选项%s", label)) {
						if extractedText, exists := optionTexts[label]; exists && extractedText != "" {
							opt["text"] = extractedText
						}
					}
				}
			}

			// 确保选项顺序为A, B, C, D
			sortedOptions := make([]map[string]interface{}, 0, len(requiredLabels))
			for _, label := range requiredLabels {
				for _, opt := range options {
					if lbl, ok := opt["label"].(string); ok && lbl == label {
						sortedOptions = append(sortedOptions, opt)
						break
					}
				}
			}

			// 如果成功排序，替换原来的选项列表
			if len(sortedOptions) == len(requiredLabels) {
				options = sortedOptions
			}

			// 添加调试日志
			global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d：最终选项列表包含 %d 个选项", id, len(options)))
			for i, opt := range options {
				global.GVA_LOG.Info(fmt.Sprintf("选项[%d]: label=%v, text=%v", i, opt["label"], opt["text"]))
			}
		}

		// 根据题型转换类型标识
		questionType := "single"
		if question.QuestionType != nil {
			switch *question.QuestionType {
			case 1:
				questionType = "single"
			case 2:
				questionType = "multiple"
			case 3:
				questionType = "boolean"
			}
		}

		// 解析正确答案
		var correctAnswer interface{}
		if question.CorrectAnswer != nil {
			err := json.Unmarshal([]byte(*question.CorrectAnswer), &correctAnswer)
			if err != nil {
				global.GVA_LOG.Error(fmt.Sprintf("解析正确答案失败，题目ID=%d: %s", id, err.Error()))

				// 如果解析JSON失败，尝试直接处理原始字符串
				correctAnswerStr := *question.CorrectAnswer

				// 移除多余的引号并处理特殊格式
				correctAnswerStr = strings.Trim(correctAnswerStr, "\"")

				// 处理单选题特殊情况
				if questionType == "single" {
					// 如果是类似于"C"或'C'格式的单选题答案，直接使用字符值
					if len(correctAnswerStr) == 1 && correctAnswerStr >= "A" && correctAnswerStr <= "Z" {
						correctAnswer = correctAnswerStr
						global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d: 单选题答案处理为: %s", id, correctAnswerStr))
					} else {
						correctAnswer = correctAnswerStr
					}
				} else if questionType == "boolean" {
					// 处理判断题
					if strings.ToLower(correctAnswerStr) == "true" {
						correctAnswer = 1 // 转为整数1表示true
					} else if strings.ToLower(correctAnswerStr) == "false" {
						correctAnswer = 0 // 转为整数0表示false
					} else {
						correctAnswer = correctAnswerStr
					}
				} else {
					// 多选题或其他类型，直接使用原始字符串
					correctAnswer = correctAnswerStr
				}
			} else {
				// 如果JSON解析成功，但需要对单选题答案做额外处理
				if questionType == "single" {
					// 如果解析后是字符串且带有额外引号，如""C""，需要去除
					if strVal, ok := correctAnswer.(string); ok {
						// 移除多余的引号
						strVal = strings.Trim(strVal, "\"")
						// 如果是单个字符，可能是选项标识
						if len(strVal) == 1 && strVal >= "A" && strVal <= "Z" {
							correctAnswer = strVal
							global.GVA_LOG.Info(fmt.Sprintf("题目ID=%d: 单选题答案处理为: %s", id, strVal))
						}
					}
				} else if questionType == "boolean" {
					// 处理判断题的布尔值转数值
					if boolVal, ok := correctAnswer.(bool); ok {
						if boolVal {
							correctAnswer = 1
						} else {
							correctAnswer = 0
						}
					} else if strVal, ok := correctAnswer.(string); ok {
						if strings.ToLower(strVal) == "true" {
							correctAnswer = 1
						} else if strings.ToLower(strVal) == "false" {
							correctAnswer = 0
						}
					}
				}
			}
		}

		// 从答题记录中获取用户答案和是否正确
		userAnswer, _ := questionToAnswerMap[id]
		isCorrect, _ := questionToCorrectMap[id]

		// 计算用户得分
		userScore := 0
		if isCorrect && question.Score != nil {
			userScore = *question.Score
		}
		// 构造题目信息
		questionInfo := map[string]interface{}{
			"question_id":      id,
			"question_content": question.QuestionContent,
			"type":             questionType,
			"question_score":   question.Score,
			"user_score":       userScore,
			"options":          options,
			"user_answer":      userAnswer,
			"correct_answer":   correctAnswer,
			"is_correct":       isCorrect,
		}

		questions = append(questions, questionInfo)
	}

	// 提交时间
	submitTime := time.Now().Format("2006-01-02 15:04:05")
	if examAnswer.SubmitTime != nil {
		submitTime = *examAnswer.SubmitTime
	}

	// 计算总分
	totalScore := 0
	for _, q := range questions {
		if score, ok := q["question_score"].(float64); ok {
			totalScore += int(score)
		} else if scorePtr, ok := q["question_score"].(*int); ok && scorePtr != nil {
			totalScore += *scorePtr
		}
	}

	// 构造详情信息
	detail := map[string]interface{}{
		"id":           examAnswer.UserId,
		"exam_title":   exam.Title,
		"submit_time":  submitTime,
		"score":        examAnswer.Score,
		"total_score":  totalScore,
		"status":       "submitted",
		"questions":    questions,
		"correct_rate": examAnswer.Scoreavg,
	}

	return detail, nil
}
