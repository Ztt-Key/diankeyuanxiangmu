<template>
  <div>
    <div class="gva-search-box">
      <!-- <el-form ref="elSearchFormRef" :inline="true" :model="searchInfo" class="demo-form-inline" :rules="searchRule" @keyup.enter="onSubmit">
        <el-form-item label="题库标题" prop="title">
         <el-input v-model="searchInfo.title" placeholder="搜索条件" />
        </el-form-item>
        <el-form-item label="题库描述" prop="description">
         <el-input v-model="searchInfo.description" placeholder="搜索条件" />
        </el-form-item>
        <el-form-item label="类型:1：单选 2：多选 3：判断" prop="typeId">
            
             <el-input v-model.number="searchInfo.typeId" placeholder="搜索条件" />
        </el-form-item> -->

      <!-- <template v-if="showAllQuery">
        
        </template> -->

      <!-- <el-form-item>
          <el-button type="primary" icon="search" @click="onSubmit">查询</el-button>
          <el-button icon="refresh" @click="onReset">重置</el-button>
          <el-button link type="primary" icon="arrow-down" @click="showAllQuery=true" v-if="!showAllQuery">展开</el-button>
          <el-button link type="primary" icon="arrow-up" @click="showAllQuery=false" v-else>收起</el-button>
        </el-form-item> -->
      <!-- </el-form> -->
    </div>
    <div class="gva-table-box">
      <div class="gva-btn-list">
        <!-- <el-button  type="primary" icon="plus" @click="openDialog()">新增</el-button>
            <el-button  icon="delete" style="margin-left: 10px;" :disabled="!multipleSelection.length" @click="onDelete">删除</el-button> -->
      </div>
      <el-table ref="multipleTable" style="width: 100%" tooltip-effect="dark" :data="tableData" row-key="title"
        @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column align="left" label="题库标题" prop="title" width="120" />
        <el-table-column align="left" label="题库描述" prop="description" width="300" />
        <el-table-column align="left" label="1：单选 2：多选 3：判断" prop="typeId" width="300" />
        <el-table-column align="left" label="操作" fixed="right" :min-width="appStore.operateMinWith">
          <template #default="scope">
            <el-button type="primary" link class="table-button" @click="getDetails(scope.row)"><el-icon
                style="margin-right: 5px">
                <InfoFilled />
              </el-icon>查看</el-button>
            <el-button type="primary" link icon="edit" class="table-button"
              @click="updateQuestionBankFunc(scope.row)">编辑</el-button>
            <el-button type="primary" link icon="delete" @click="deleteRow(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="gva-pagination">
        <el-pagination layout="total, sizes, prev, pager, next, jumper" :current-page="page" :page-size="pageSize"
          :page-sizes="[10, 30, 50, 100]" :total="total" @current-change="handleCurrentChange"
          @size-change="handleSizeChange"></el-pagination>
      </div>
    </div>
    <el-drawer destroy-on-close :size="appStore.drawerSize" v-model="dialogFormVisible" :show-close="false"
      :before-close="closeDialog">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-lg">{{ type === 'create' ? '新增' : '编辑' }}</span>
          <div>
            <el-button :loading="btnLoading" type="primary" @click="enterDialog">确 定</el-button>
            <el-button @click="closeDialog">取 消</el-button>
          </div>
        </div>
      </template>

      <el-form :model="formData" label-position="top" ref="elFormRef" :rules="rule" label-width="80px">
        <el-form-item label="题库标题:" prop="title">
          <el-input v-model="formData.title" :clearable="true" placeholder="请输入题库标题" />
        </el-form-item>
        <el-form-item label="题库描述:" prop="description">
          <el-input v-model="formData.description" :clearable="true" placeholder="请输入题库描述" />
        </el-form-item>
        <!-- <el-form-item label="类型:1：单选 2：多选 3：判断:"  prop="typeId" >
              <el-input v-model.number="formData.typeId" :clearable="true" placeholder="请输入类型:1：单选 2：多选 3：判断" />
            </el-form-item> -->
      </el-form>
    </el-drawer>

    <el-drawer destroy-on-close :size="appStore.drawerSize" v-model="detailShow" :show-close="true"
      :before-close="closeDetailShow" title="查看">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="题库标题">
          {{ detailFrom.title }}
        </el-descriptions-item>
        <el-descriptions-item label="题库描述">
          {{ detailFrom.description }}
        </el-descriptions-item>

        <el-descriptions-item label="1：单选 2：多选 3：判断">
          {{ detailFrom.typeId }}
        </el-descriptions-item>
      </el-descriptions>
      <div style="margin-left: 100px;">
        <el-button @click="AddQuestions" style="width: 180px; margin-top: 20px;">添加试题</el-button>
        <el-button @click="LookQuestions" style="width: 180px; margin-top: 20px;">查看试题</el-button>
        <el-button @click="ShareQuestions" style="width: 180px; margin-top: 20px;">发布试题</el-button>
      </div>
    </el-drawer>

    <!-- 添加试题对话框 -->
    <el-dialog v-model="addQuestionsVisible" title="添加试题" width="50%" :before-close="handleAddClose">
      <div>
        <span>所属题库: {{ detailFrom.id }}</span>
        <span style="margin-left: 20px;">试题类型: {{ questionForm.type }}({{ questionTypeMap[questionForm.type] }})</span>
        <span style="margin-left: 20px;">创建时间: {{ formattedDateTime }}</span>
      </div>
      <!-- 导入导出区域 -->
      <div style="display: flex; justify-content: flex-start; margin: 15px 0; gap: 15px;">
        <ImportExcel templateId="LeadInQuestion" @on-success="handleSuccess" />
        <ExportTemplate templateId="LeadInQuestion" />
      </div>
      <el-form :model="questionForm" label-width="100px" ref="questionFormRef">
        <el-form-item label="试题类型" prop="type">
          <el-input v-model="questionTypeMap[questionForm.type]" disabled></el-input>
        </el-form-item>
        <el-form-item label="试题题目" prop="questionContent">
          <el-input v-model="questionForm.questionContent" type="textarea" rows="3" placeholder="请输入试题题目"></el-input>
        </el-form-item>
        <el-form-item label="分值" prop="score">
          <el-input-number v-model="questionForm.score" :min="0" :max="100" :precision="1" :step="0.5"
            controls-position="right" placeholder="请输入试题分值(0-100)"></el-input-number>
        </el-form-item>
        <el-form-item label="选项" v-if="questionForm.type !== '3'">
          <div v-for="(option, index) in questionForm.options" :key="index" style="margin-bottom: 10px;">
            <el-input v-model="option.content" style="width: calc(100% - 80px); margin-right: 10px;">
              <template #prepend>{{ String.fromCharCode(65 + index) }}</template>
            </el-input>
            <el-button type="danger" @click="removeOption(index)" v-if="questionForm.options.length > 2">删除</el-button>
          </div>
          <el-button type="primary" @click="addOption" v-if="questionForm.options.length < 6">添加选项</el-button>
        </el-form-item>
        <el-form-item label="正确答案">
          <template v-if="questionForm.type === '3'">
            <el-radio-group v-model="questionForm.answer">
              <el-radio label="1">正确</el-radio>
              <el-radio label="0">错误</el-radio>
            </el-radio-group>
          </template>
          <template v-else-if="questionForm.type === '1'">
            <el-radio-group v-model="questionForm.answer">
              <el-radio v-for="(option, index) in questionForm.options" :key="index"
                :label="String.fromCharCode(65 + index)">
                选项{{ String.fromCharCode(65 + index) }}
              </el-radio>
            </el-radio-group>
          </template>
          <template v-else>
            <el-checkbox-group v-model="questionForm.answers">
              <el-checkbox v-for="(option, index) in questionForm.options" :key="index"
                :label="String.fromCharCode(65 + index)">
                选项{{ String.fromCharCode(65 + index) }}
              </el-checkbox>
            </el-checkbox-group>
          </template>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleAddClose">取消</el-button>
          <el-button type="primary" @click="submitQuestion">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 查看试题对话框 -->
    <el-dialog v-model="lookQuestionsVisible" :title="'查看试题 - ' + (currentBank?.title || '')" width="70%">
      <el-table :data="questionsList" style="width: 100%">
        <el-table-column prop="questionContent" label="题目内容" show-overflow-tooltip></el-table-column>
        <el-table-column prop="questionType" label="题目类型" width="100">
          <template #default="scope">
            {{ getQuestionTypeName(scope.row.questionType) }}
          </template>
        </el-table-column>
        <el-table-column prop="score" label="分值" width="80"></el-table-column>

        <el-table-column prop="correctAnswer" label="正确答案" width="120">
          <template #default="scope">
            <template v-if="scope.row.questionType === 3">
              {{ Number(scope.row.correctAnswer.replace(/"/g, '')) === 1 ? '正确' : '错误' }}
            </template>
            <template v-else>
              {{ formatAnswer(scope.row) }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <!-- <el-button type="primary" link @click="editQuestion(scope.row)">编辑</el-button> -->
            <el-button type="danger" link @click="deleteQuestionBId(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 发布试题对话框 -->
    <el-dialog v-model="shareQuestionsVisible" title="发布试题" width="50%">
      <el-form :model="shareForm" label-width="100px">
        <el-form-item label="试卷标题" prop="title">
          <el-input v-model="shareForm.title" placeholder="请输入试卷标题"></el-input>
        </el-form-item>
        <el-form-item label="考试用户" prop="people">
          <el-select v-model="shareForm.people" multiple filterable placeholder="请选择考试用户" style="width: 100%">
            <el-option v-for="item in userList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="考试时长" prop="duration">
          <el-input-number v-model="shareForm.duration" :min="30" :max="180"
            placeholder="请输入考试时长（分钟）"></el-input-number>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker v-model="shareForm.startTime" type="datetime" placeholder="选择开始时间"></el-date-picker>
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker v-model="shareForm.endTime" type="datetime" placeholder="选择结束时间"></el-date-picker>
        </el-form-item>
        <el-form-item label="选择试题">
          <el-transfer v-model="shareForm.selectedQuestions" :data="shareQuestionList" :props="{
            key: 'id',
            label: 'questionContent'
          }"></el-transfer>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="shareQuestionsVisible = false">取消</el-button>
          <el-button type="primary" @click="submitShare">确定发布</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import {
  createQuestionBank,
  deleteQuestionBank,
  deleteQuestionBankByIds,
  updateQuestionBank,
  findQuestionBank,
  getQuestionBankList,
  getQuestionsByBankId,
  createQuestion,
  deleteQuestion,
  getExamUsers
} from '@/api/Answermodule/questionBank'
import { getQuestionsListUser } from '@/api/Answermodule/questions'
import { createExam } from '@/api/Answermodule/exam'

// 全量引入格式化工具 请按需保留
import { getDictFunc, formatDate, formatBoolean, filterDict, filterDataSource, returnArrImg, onDownloadFile } from '@/utils/format'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ref, reactive, onMounted } from 'vue'
import { useAppStore } from "@/pinia"


defineOptions({
  name: 'QuestionBank'
})



// 导出组件
import ExportExcel from '@/components/exportExcel/exportExcel.vue';
// 导入组件
import ImportExcel from '@/components/exportExcel/importExcel.vue';
// 导出模板组件
import ExportTemplate from '@/components/exportExcel/exportTemplate.vue';

const condition = ref({}); // 查询条件
const limit = ref(10); // 最大条数限制
const offset = ref(0); // 偏移量
const order = ref('id desc'); // 排序条件

const handleSuccess = (res) => {
  console.log(res);
  // 导入成功的回调函数
};

const shareQuestionList = ref([])

// 添加当前时间变量
const currentDateTime = ref(new Date().toISOString())

// 计算属性：格式化的日期时间
const formattedDateTime = ref('')

// 更新时间并格式化
const updateCurrentTime = () => {
  const now = new Date()
  currentDateTime.value = now.toISOString()
  
  // 格式化为指定格式 例如：2025-03-17 09:20:12.376109 +00:00
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0')
  const timezone = String(now.getTimezoneOffset() / -60).padStart(2, '0')
  
  formattedDateTime.value = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds} +${timezone}:00`
}

// 添加试题
const AddQuestions = () => {
  addQuestionsVisible.value = true
  // 更新当前时间
  updateCurrentTime()
  // 根据当前行的typeId设置试题类型
  questionForm.value.type = detailFrom.value.typeId?.toString() || ''
  // 如果是判断题，初始化为两个选项
  if (detailFrom.value.typeId === 3) {
    questionForm.value.options = []
  } else {
    questionForm.value.options = [
      { content: '' },
      { content: '' }
    ]
  }
  resetQuestionForm(false) // 传入false表示不重置type
}

const LookQuestions = async () => {
  // 记录请求开始时的时间戳，用于防止并发请求产生的竞态问题
  const requestTimestamp = Date.now();
  lookQuestionsVisible.value = true;
  currentBank.value = detailFrom.value;

  try {
    // 确保获取到了当前题库ID和类型
    if (!detailFrom.value || !detailFrom.value.id) {
      ElMessage.warning('无法识别当前题库');
      return;
    }
    
    // 保存当前题库的类型ID，用于后续验证
    const currentTypeId = detailFrom.value.typeId;
    console.log(`当前查看的题库类型ID: ${currentTypeId}`);
    
    // 使用当前题库ID查询试题
    const res = await getQuestionsByBankId({
      bankId: currentTypeId,
      page: 1,
      pageSize: 100
    });
    
    // 检查是否在等待响应期间切换了题库
    if (detailFrom.value.typeId !== currentTypeId) {
      console.log('检测到题库已切换，放弃此次请求结果');
      return;
    }
    
    if (res.code === 0) {
      // 清除之前的数据，避免混合显示
      shareQuestionList.value = [];
      questionsList.value = [];
      
      // 设置新数据
      shareQuestionList.value = res.data.list;
      questionsList.value = res.data.list.map(item => {
        try {
          // 如果questionOptions是JSON字符串，解析它
          if (item.questionOptions) {
            item.questionOptions = JSON.parse(item.questionOptions);
          }
        } catch (e) {
          console.error('解析选项出错:', e);
        }
        return item;
      });
      
      // 设置当前bank_type_id，用于验证题库类型
      localStorage.setItem(`current_bank_type_${detailFrom.value.id}`, currentTypeId.toString());
      
      // 标记用户已查看过此题库的试题，并记录时间戳和题库类型
      localStorage.setItem(`viewed_bank_${detailFrom.value.id}`, 'true');
      localStorage.setItem(`viewed_bank_time_${detailFrom.value.id}`, Date.now().toString());
      localStorage.setItem(`viewed_bank_type_${detailFrom.value.id}`, currentTypeId.toString());
      
      // 如果没有试题，提示用户
      if (res.data.list.length === 0) {
        ElMessage.warning('当前题库没有试题，请先添加试题');
      } else {
        console.log(`成功加载题库类型(${currentTypeId})的试题，数量: ${res.data.list.length}`);
      }
    } else {
      ElMessage.error(res.msg || '获取试题列表失败');
    }
  } catch (err) {
    console.error('获取试题列表错误:', err);
    ElMessage.error('获取试题列表失败');
  }
};

//发布试题
const ShareQuestions = () => {
  console.log("发布试题测试");
  
  // 确保获取到了当前题库ID
  if (!detailFrom.value || !detailFrom.value.id) {
    ElMessage.warning('无法识别当前题库，请重新选择题库');
    return;
  }
  
  const currentBankId = detailFrom.value.id;
  const currentTypeId = detailFrom.value.typeId;
  
  // 检查题库是否有试题
  const hasQuestions = shareQuestionList.value && shareQuestionList.value.length > 0;
  
  // 从本地存储获取查看记录和时间戳
  const viewedRecord = localStorage.getItem(`viewed_bank_${currentBankId}`);
  const viewedTimestamp = localStorage.getItem(`viewed_bank_time_${currentBankId}`);
  const viewedType = localStorage.getItem(`viewed_bank_type_${currentBankId}`);
  
  // 验证查看记录的有效性和类型匹配性
  const isTypeMatched = viewedType === currentTypeId.toString();
  const now = Date.now();
  const isViewedRecordValid = viewedRecord === 'true' && viewedTimestamp && 
    (now - parseInt(viewedTimestamp)) < 12 * 60 * 60 * 1000 && isTypeMatched;
  
  // 当前会话中是否已查看且类型匹配
  const sessionViewedValid = questionsList.value && questionsList.value.length > 0 && 
    localStorage.getItem(`current_bank_type_${currentBankId}`) === currentTypeId.toString();
  
  // 检查用户是否已查看过当前题库的试题且类型匹配
  const hasViewedQuestions = isViewedRecordValid || sessionViewedValid;
  
  if (!hasQuestions && !sessionViewedValid) {
    ElMessage.warning('当前题库可能没有试题，请先添加或查看试题');
    return;
  }
  
  if (!hasViewedQuestions) {
    // 如果没有查看过试题或类型不匹配，提示用户先查看试题
    let message = '发布试题前，请先查看当前题库中的试题内容。';
    if (viewedRecord === 'true' && !isTypeMatched) {
      message = '您查看的是其他类型的题库内容，请查看当前题库的试题。';
    }
    
    ElMessageBox.confirm(
      message, 
      '提示', 
      {
        confirmButtonText: '去查看试题',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      // 用户选择去查看试题
      LookQuestions();
    }).catch(() => {
      // 用户取消操作
      ElMessage({
        type: 'info',
        message: '已取消发布试题'
      });
    });
    return;
  }
  
  // 已查看试题，继续发布流程
  getQuestionsListUser();
  shareQuestionsVisible.value = true;
}
const userList = ref([])
// 提交按钮loading
const btnLoading = ref(false)
const appStore = useAppStore()

// 控制更多查询条件显示/隐藏状态
const showAllQuery = ref(false)

// 自动化生成的字典（可能为空）以及字段
const formData = ref({
  title: '',
  description: '',
  typeId: undefined,
})



// 验证规则
const rule = reactive({
})


const elFormRef = ref()
const elSearchFormRef = ref()

// =========== 表格控制部分 ===========
const page = ref(1)
const total = ref(0)
const pageSize = ref(10)
const tableData = ref([])
const searchInfo = ref({})
// 重置
const onReset = () => {
  searchInfo.value = {}
  getTableData()
}

// 搜索
const onSubmit = () => {
  elSearchFormRef.value?.validate(async (valid) => {
    if (!valid) return
    page.value = 1
    getTableData()
  })
}

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val
  getTableData()
}

// 修改页面容量
const handleCurrentChange = (val) => {
  page.value = val
  getTableData()
}

//获取用户列表
const GetPeopleUser = async () => {
  try {
    const res = await getQuestionsListUser({
      page: 1,
      pageSize: 100
    })
    if (res.code === 0) {
      // 直接使用后端返回的格式化数据
      userList.value = res.data.list
    } else {
      ElMessage.error(res.msg || '获取用户列表失败')
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  }
}

// 在组件挂载时获取用户列表
onMounted(() => {
  GetPeopleUser()
})

// 查询
const getTableData = async () => {
  const table = await getQuestionBankList({ page: page.value, pageSize: pageSize.value, ...searchInfo.value })
  if (table.code === 0) {
    tableData.value = table.data.list
    total.value = table.data.total
    page.value = table.data.page
    pageSize.value = table.data.pageSize
  }
}

getTableData()

// ============== 表格控制部分结束 ===============

// 获取需要的字典 可能为空 按需保留
const setOptions = async () => {
}

// 获取需要的字典 可能为空 按需保留
setOptions()


// 多选数据
const multipleSelection = ref([])
// 多选
const handleSelectionChange = (val) => {
  multipleSelection.value = val
}

// 删除行
const deleteRow = (row) => {
  ElMessageBox.confirm('确定要删除吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    deleteQuestionBankFunc(row)
  })
}
const handleInput = () => {
  const min = 0;
  const max = 100;

  // 如果输入值小于最小值，设置为最小值
  if (value < min) {
    questionForm.value.score = min;
  }
  // 如果输入值大于最大值，设置为最大值
  else if (value > max) {
    questionForm.value.score = max;
  }
  // 否则，保留输入值
  else {
    questionForm.value.score = value;
  }
}
// 多选删除
const onDelete = async () => {
  ElMessageBox.confirm('确定要删除吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const titles = []
    if (multipleSelection.value.length === 0) {
      ElMessage({
        type: 'warning',
        message: '请选择要删除的数据'
      })
      return
    }
    multipleSelection.value &&
      multipleSelection.value.map(item => {
        titles.push(item.title)
      })
    const res = await deleteQuestionBankByIds({ titles })
    if (res.code === 0) {
      ElMessage({
        type: 'success',
        message: '删除成功'
      })
      if (tableData.value.length === titles.length && page.value > 1) {
        page.value--
      }
      getTableData()
    }
  })
}

// 行为控制标记（弹窗内部需要增还是改）
const type = ref('')

// 更新行
const updateQuestionBankFunc = async (row) => {
  const res = await findQuestionBank({ title: row.title })
  type.value = 'update'
  if (res.code === 0) {
    formData.value = res.data
    dialogFormVisible.value = true
  }
}


// 删除行
const deleteQuestionBankFunc = async (row) => {
  const res = await deleteQuestionBank({ title: row.title })
  if (res.code === 0) {
    ElMessage({
      type: 'success',
      message: '删除成功'
    })
    if (tableData.value.length === 1 && page.value > 1) {
      page.value--
    }
    getTableData()
  }
}

// 弹窗控制标记
const dialogFormVisible = ref(false)

// 打开弹窗
const openDialog = () => {
  type.value = 'create'
  dialogFormVisible.value = true
}

// 关闭弹窗
const closeDialog = () => {
  dialogFormVisible.value = false
  formData.value = {
    title: '',
    description: '',
    typeId: undefined,
  }
}
// 弹窗确定
const enterDialog = async () => {
  btnLoading.value = true
  elFormRef.value?.validate(async (valid) => {
    if (!valid) return btnLoading.value = false
    let res
    switch (type.value) {
      case 'create':
        res = await createQuestionBank(formData.value)
        break
      case 'update':
        res = await updateQuestionBank(formData.value)
        break
      default:
        res = await createQuestionBank(formData.value)
        break
    }
    btnLoading.value = false
    if (res.code === 0) {
      ElMessage({
        type: 'success',
        message: '创建/更改成功'
      })
      closeDialog()
      getTableData()
    }
  })
}


const detailFrom = ref({})

// 查看详情控制标记
const detailShow = ref(false)


// 打开详情弹窗
const openDetailShow = () => {
  detailShow.value = true
}


// 打开详情
const getDetails = async (row) => {
  console.log(row.id);
  localStorage.setItem("bank_id", row.id);
  
  // 获取前一个题库ID，用于比较是否切换了题库
  const previousBankId = detailFrom.value?.id;
  
  // 打开弹窗
  const res = await findQuestionBank({ title: row.title });
  if (res.code === 0) {
    detailFrom.value = res.data;
    
    // 检查是否切换了题库
    if (previousBankId !== res.data.id) {
      console.log('题库已切换，清除试题缓存');
      // 清空当前试题列表
      questionsList.value = [];
      shareQuestionList.value = [];
      
      // 清除之前题库的查看状态，使用当前题库的typeId识别题库类型
      if (res.data && res.data.id) {
        localStorage.removeItem(`viewed_bank_${res.data.id}`);
        localStorage.removeItem(`viewed_bank_time_${res.data.id}`);
      }
    }
    
    openDetailShow();
  }
};


// 关闭详情弹窗
const closeDetailShow = () => {
  detailShow.value = false
  detailFrom.value = {}
}

// 对话框显示状态
const addQuestionsVisible = ref(false)
const lookQuestionsVisible = ref(false)
const shareQuestionsVisible = ref(false)

// 试题表单数据
const questionForm = ref({
  type: '', // 试题类型
  questionContent: '', // 试题内容
  options: [ // 选项列表
    { content: '' },
    { content: '' }
  ],
  answer: '', // 单选/判断答案
  answers: [], // 多选答案
  score: 0 // 分值
})

// 发布表单数据
const shareForm = ref({
  title: '',
  people: '',
  duration: 60,
  startTime: '',
  endTime: '',
  selectedQuestions: []
})

// 试题列表数据
const questionsList = ref([])

// 试题类型映射
const questionTypeMap = {
  1: '单选题',
  2: '多选题',
  3: '判断题'
}

// 重置试题表单
const resetQuestionForm = (resetType = true) => {
  const currentType = questionForm.value.type
  questionForm.value = {
    type: resetType ? '' : currentType,
    questionContent: '',
    options: [
      { content: '' },
      { content: '' }
    ],
    answer: '',
    answers: [],
    score: 0, // 设置默认分值为0
  }
  // 如果是判断题，清空选项
  if (questionForm.value.type === '3') {
    questionForm.value.options = []
  }
}

// 添加选项
const addOption = () => {
  if (questionForm.value.options.length < 6) {
    questionForm.value.options.push({ content: '' })
  }
}

// 删除选项
const removeOption = (index) => {
  questionForm.value.options.splice(index, 1)
}

// 关闭添加试题对话框
const handleAddClose = () => {
  addQuestionsVisible.value = false
  resetQuestionForm()
}

// 提交试题
const submitQuestion = async () => {
  try {
    // 验证表单
    if (!questionForm.value.type) {
      ElMessage.warning('请选择试题类型')
      return
    }
    if (!questionForm.value.questionContent) {
      ElMessage.warning('请输入试题内容')
      return
    }
    if (!questionForm.value.score || questionForm.value.score <= 0) {
      ElMessage.warning('请输入有效的分值')
      return
    }

    // 处理选项
    let questionOptions = {}
    if (questionForm.value.type === '1' || questionForm.value.type === '2') {
      // 单选题或多选题需要处理选项
      if (!questionForm.value.options || questionForm.value.options.length < 2) {
        ElMessage.warning('请至少添加两个选项')
        return
      }
      // 检查选项是否都已填写
      if (questionForm.value.options.some(opt => !opt.content.trim())) {
        ElMessage.warning('请填写所有选项内容')
        return
      }
      // 转换选项数组为对象格式
      questionForm.value.options.forEach((opt, index) => {
        const key = String.fromCharCode(65 + index) // A, B, C...
        questionOptions[key] = opt.content
      })
    }

    // 处理答案
    let correctAnswer
    if (questionForm.value.type === '2') {
      // 多选题
      if (!questionForm.value.answers || questionForm.value.answers.length === 0) {
        ElMessage.warning('请选择正确答案')
        return
      }
      correctAnswer = questionForm.value.answers.sort() // 排序确保答案顺序一致
    } else {
      // 单选题或判断题
      if (!questionForm.value.answer) {
        ElMessage.warning('请选择正确答案')
        return
      }
      correctAnswer = questionForm.value.answer
    }

    const data = {
      questionType: questionForm.value.type,
      questionContent: questionForm.value.questionContent,
      questionOptions: JSON.stringify(questionOptions),
      correctAnswer: JSON.stringify(correctAnswer),
      score: parseFloat(questionForm.value.score)
    }

    console.log('提交的数据:', data)
    const res = await createQuestion(data)
    if (res.code === 0) {
      ElMessage.success('添加试题成功')
      handleAddClose()
    } else {
      ElMessage.error(res.msg || '添加试题失败')
    }
  } catch (error) {
    console.error('提交试题错误:', error)
    ElMessage.error('添加试题失败：' + error.message)
  }
}

// 获取试题列表
const getQuestionsList = async () => {
  try {
    // TODO: 实现获取试题列表的逻辑
    questionsList.value = []
  } catch (error) {
    ElMessage.error('获取试题列表失败')
  }
}

// 编辑试题
const editQuestion = (row) => {
  questionForm.value = { ...row }
  addQuestionsVisible.value = true
}

// 删除试题
const deleteQuestionBId = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该试题吗？', '提示', {
      type: 'warning'
    })
    // TODO: 实现删除试题的逻辑
    console.log(row.id);
    const res = await deleteQuestion({ id: row.id })
    questionsList.value = questionsList.value.filter(item => item.id !== row.id);
    console.log(questionsList.value);

    // await getTableData(); // 确保等待数据更新完成
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 提交发布
const submitShare = async () => {
  try {
    // 准备考试数据
    const examData = {
      title: shareForm.value.title,
      bankId: JSON.parse(localStorage.getItem("bank_id")),
      duration: shareForm.value.duration,
      startTime: shareForm.value.startTime,
      endTime: shareForm.value.endTime,
      selectedUsers: shareForm.value.people,
      selectedQuestions: shareForm.value.selectedQuestions
    }

    // 调用创建考试接口
    const res = await createExam(examData)
    if (res.code === 0) {
      ElMessage.success('发布成功')
      shareQuestionsVisible.value = false
      // 清空表单
      shareForm.value = {
        title: '',
        duration: 60,
        startTime: '',
        endTime: '',
        people: [],
        selectedQuestions: []
      }
    } else {
      ElMessage.error(res.msg || '发布失败')
    }
  } catch (error) {
    console.error('发布失败:', error)
    ElMessage.error('发布失败')
  }
}

// 当前选中的题库
const currentBank = ref(null)

// 获取题目类型名称
const getQuestionTypeName = (type) => {
  const typeMap = {
    1: '单选题',
    2: '多选题',
    3: '判断题'
  }
  return typeMap[type] || '未知类型'
}

// 格式化答案显示
const formatAnswer = (question) => {
  try {
    if (!question.correctAnswer) return ''

    // 解析JSON字符串并去掉引号
    let answer = question.correctAnswer.replace(/^"(.*)"$/, '$1')
    try {
      answer = JSON.parse(answer)
    } catch (e) {
      // 如果解析失败，使用原始值
      console.error('JSON解析出错:', e)
    }

    // 多选题处理
    if (Array.isArray(answer)) {
      return answer.join(',')
    }

    // 单选题处理
    if (question.questionType === 1) {
      return answer.toString().replace(/"/g, '')
    }

    // 其他情况
    return answer.toString()
  } catch (e) {
    console.error('格式化答案出错:', e)
    return question.correctAnswer
  }
}

</script>

<style>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-transfer) {
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.el-transfer-panel) {
  width: 300px;
}
</style>
