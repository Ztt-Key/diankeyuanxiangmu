<template>
  <div>
    <div class="gva-search-box">
      <el-form ref="elSearchFormRef" :inline="true" :model="searchInfo" class="demo-form-inline" :rules="searchRule" @keyup.enter="onSubmit">
      <el-form-item label="创建日期" prop="createdAt">
      <template #label>
        <span>
          创建日期
          <el-tooltip content="搜索范围是开始日期（包含）至结束日期（不包含）">
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
        </span>
      </template>
      <el-date-picker v-model="searchInfo.startCreatedAt" type="datetime" placeholder="开始日期" :disabled-date="time=> searchInfo.endCreatedAt ? time.getTime() > searchInfo.endCreatedAt.getTime() : false"></el-date-picker>
       —
      <el-date-picker v-model="searchInfo.endCreatedAt" type="datetime" placeholder="结束日期" :disabled-date="time=> searchInfo.startCreatedAt ? time.getTime() < searchInfo.startCreatedAt.getTime() : false"></el-date-picker>
      </el-form-item>
      
        <el-form-item label="绑定模板ID" prop="templeId">
         <el-input v-model="searchInfo.templeId" placeholder="搜索条件" />
        </el-form-item>
        <el-form-item label="申请人姓名" prop="applicantName">
         <el-input v-model="searchInfo.applicantName" placeholder="搜索条件" />
        </el-form-item>

        <template v-if="showAllQuery">
          <!-- 将需要控制显示状态的查询条件添加到此范围内 -->
        </template>

        <el-form-item>
          <el-button type="primary" icon="search" @click="onSubmit">查询</el-button>
          <el-button icon="refresh" @click="onReset">重置</el-button>
          <el-button link type="primary" icon="arrow-down" @click="showAllQuery=true" v-if="!showAllQuery">展开</el-button>
          <el-button link type="primary" icon="arrow-up" @click="showAllQuery=false" v-else>收起</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
        <div class="gva-btn-list">
            <el-button  type="primary" icon="plus" @click="openDialog()">新增</el-button>
            <el-button  icon="delete" style="margin-left: 10px;" :disabled="!multipleSelection.length" @click="onDelete">删除</el-button>
            
        </div>
        <el-table
        ref="multipleTable"
        style="width: 100%"
        tooltip-effect="dark"
        :data="tableData"
        row-key="ID"
        @selection-change="handleSelectionChange"
        >
        <el-table-column type="selection" width="55" />
        
        <el-table-column align="left" label="日期" prop="createdAt"width="180">
            <template #default="scope">{{ formatDate(scope.row.CreatedAt) }}</template>
        </el-table-column>
        
          <el-table-column label="内容" prop="value" width="200">
              <template #default="scope">
                  <el-popover placement="right" trigger="hover" :width="400" popper-class="value-popover">
                      <template #reference>
                          <div class="value-preview">
                              {{ getPreviewContent(scope.row) }}
                          </div>
                      </template>

                      <!-- 浮窗内容 -->
                      <div class="popover-content">
                          <template v-if="parseValueData(scope.row.value)">
                              <div v-for="(field, index) in parseValueData(scope.row.value)" :key="index" class="popover-item">
                                  <div class="popover-label">{{ field.name }}</div>
                                  <div class="popover-value">
                                      <!-- 表格类型 -->
                                      <template v-if="field.type === 'table'">
                                          <el-table :data="field.value" border size="small" style="width: 100%">
                                              <el-table-column v-for="col in field.columns" :key="col.key" :prop="col.key" :label="col.title" :min-width="getColumnWidth(col.type)">
                                                  <template #default="scope">
                                                      <template v-if="col.type === 'checkbox'">
                                                          <el-tag :type="scope.row[col.key] ? 'success' : 'info'" size="small">
                                                              {{ scope.row[col.key] ? '是' : '否' }}
                                                          </el-tag>
                                                      </template>
                                                      <template v-else>
                                                          {{ scope.row[col.key] || '-' }}
                                                      </template>
                                                  </template>
                                              </el-table-column>
                                          </el-table>
                                      </template>

                                      <!-- 输入列表类型 -->
                                      <template v-else-if="field.type === 'input-list'">
                                          <div class="input-list-display">
                                              <el-tag v-for="(item, idx) in field.value" :key="idx" size="small" class="input-list-tag">
                                                  {{ item }}
                                              </el-tag>
                                          </div>
                                      </template>

                                      <!-- 日期时间范围类型 -->
                                      <template v-else-if="field.type === 'dateTimeRange'">
                                          <div class="datetime-range">
                                              {{ formatDateTime(field.value.start) }} 至 {{ formatDateTime(field.value.end) }}
                                          </div>
                                      </template>

                                      <!-- 签名类型 -->
                                      <template v-else-if="field.type === 'signature'">
                                          <img :src="field.value" class="signature-image" alt="签名" style="max-width: 200px; max-height: 100px; border: 1px solid #dcdfe6; border-radius: 2px; padding: 2px;" />
                                      </template>

                                      <!-- 文本类型（包括 textarea 和 input） -->
                                      <template v-else>
                                          <div class="text-content">{{ field.value || '-' }}</div>
                                      </template>
                                  </div>
                              </div>
                          </template>
                          <div v-else>无数据</div>
                      </div>
                  </el-popover>
              </template>
          </el-table-column>
          <el-table-column label="填写日志" prop="log" width="200">
              <template #default="scope">
                  [JSON]
              </template>
          </el-table-column>
          <el-table-column align="left" label="绑定模板ID" prop="templeId" width="120" />
          <el-table-column align="left" label="申请人ID" prop="applicantId" width="120" />
          <el-table-column align="left" label="申请人姓名" prop="applicantName" width="120" />
        <el-table-column align="left" label="操作" fixed="right" min-width="240">
            <template #default="scope">
            <el-button  type="primary" link class="table-button" @click="getDetails(scope.row)"><el-icon style="margin-right: 5px"><InfoFilled /></el-icon>查看</el-button>
            <el-button  type="primary" link icon="edit" class="table-button" @click="updateThreeTicketExamplesFunc(scope.row)">编辑</el-button>
            <el-button   type="primary" link icon="delete" @click="deleteRow(scope.row)">删除</el-button>
            </template>
        </el-table-column>
        </el-table>
        <div class="gva-pagination">
            <el-pagination
            layout="total, sizes, prev, pager, next, jumper"
            :current-page="page"
            :page-size="pageSize"
            :page-sizes="[10, 30, 50, 100]"
            :total="total"
            @current-change="handleCurrentChange"
            @size-change="handleSizeChange"
            />
        </div>
    </div>
    <el-drawer destroy-on-close size="800" v-model="dialogFormVisible" :show-close="false" :before-close="closeDialog">
       <template #header>
              <div class="flex justify-between items-center">
                <span class="text-lg">{{type==='create'?'新增':'编辑'}}</span>
                <div>
                  <el-button :loading="btnLoading" type="primary" @click="enterDialog">确 定</el-button>
                  <el-button @click="closeDialog">取 消</el-button>
                </div>
              </div>
            </template>

          <el-form :model="formData" label-position="top" ref="elFormRef" :rules="rule" label-width="80px">
            <el-form-item label="内容:"  prop="value" >
              <el-input
                v-model="inputValue"
                type="textarea"
                :rows="20"
                style="height: 500px;"
              />
            </el-form-item>
            <el-form-item label="填写日志:"  prop="log" >
              <el-input
                v-model="logInputValue"
                type="textarea"
                :rows="20"
                style="height: 500px;"
              />
            </el-form-item>
            <el-form-item label="绑定模板ID:"  prop="templeId" >
              <el-input v-model="formData.templeId" :clearable="true"  placeholder="请输入绑定模板ID" />
            </el-form-item>
            <el-form-item label="申请人ID:"  prop="applicantId" >
              <el-input v-model.number="formData.applicantId" :clearable="true" placeholder="请输入申请人ID" />
            </el-form-item>
            <el-form-item label="申请人姓名:"  prop="applicantName" >
              <el-input v-model="formData.applicantName" :clearable="true"  placeholder="请输入申请人姓名" />
            </el-form-item>
          </el-form>
    </el-drawer>

    <el-drawer destroy-on-close size="800" v-model="detailShow" :show-close="true" :before-close="closeDetailShow" title="查看">
            <el-descriptions :column="1" border>
                    <el-descriptions-item label="内容">
                        {{ detailFrom.value }}
                    </el-descriptions-item>
                    <el-descriptions-item label="填写日志">
                        {{ detailFrom.log }}
                    </el-descriptions-item>
                    <el-descriptions-item label="绑定模板ID">
                        {{ detailFrom.templeId }}
                    </el-descriptions-item>
                    <el-descriptions-item label="申请人ID">
                        {{ detailFrom.applicantId }}
                    </el-descriptions-item>
                    <el-descriptions-item label="申请人姓名">
                        {{ detailFrom.applicantName }}
                    </el-descriptions-item>
            </el-descriptions>
        </el-drawer>

  </div>
</template>

<script setup>
import {
  createThreeTicketExamples,
  deleteThreeTicketExamples,
  deleteThreeTicketExamplesByIds,
  updateThreeTicketExamples,
  findThreeTicketExamples,
  getThreeTicketExamplesList
} from '@/plugin/threeTicket/api/threeTicketExamples'

// 全量引入格式化工具 请按需保留
import { getDictFunc, formatDate, formatBoolean, filterDict ,filterDataSource, returnArrImg, onDownloadFile } from '@/utils/format'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ref, reactive } from 'vue'




defineOptions({
    name: 'ThreeTicketExamples'
})

// 提交按钮loading
const btnLoading = ref(false)

// 控制更多查询条件显示/隐藏状态
const showAllQuery = ref(false)

// 自动化生成的字典（可能为空）以及字段
const formData = ref({
            value: {},
            log: {},
            templeId: '',
            applicantId: undefined,
            applicantName: '',
        })



// 验证规则
const rule = reactive({
})

const searchRule = reactive({
  createdAt: [
    { validator: (rule, value, callback) => {
      if (searchInfo.value.startCreatedAt && !searchInfo.value.endCreatedAt) {
        callback(new Error('请填写结束日期'))
      } else if (!searchInfo.value.startCreatedAt && searchInfo.value.endCreatedAt) {
        callback(new Error('请填写开始日期'))
      } else if (searchInfo.value.startCreatedAt && searchInfo.value.endCreatedAt && (searchInfo.value.startCreatedAt.getTime() === searchInfo.value.endCreatedAt.getTime() || searchInfo.value.startCreatedAt.getTime() > searchInfo.value.endCreatedAt.getTime())) {
        callback(new Error('开始日期应当早于结束日期'))
      } else {
        callback()
      }
    }, trigger: 'change' }
  ],
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
  elSearchFormRef.value?.validate(async(valid) => {
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

// 查询
const getTableData = async() => {
  const table = await getThreeTicketExamplesList({ page: page.value, pageSize: pageSize.value, ...searchInfo.value })
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
const setOptions = async () =>{
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
            deleteThreeTicketExamplesFunc(row)
        })
    }

// 多选删除
const onDelete = async() => {
  ElMessageBox.confirm('确定要删除吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async() => {
      const IDs = []
      if (multipleSelection.value.length === 0) {
        ElMessage({
          type: 'warning',
          message: '请选择要删除的数据'
        })
        return
      }
      multipleSelection.value &&
        multipleSelection.value.map(item => {
          IDs.push(item.ID)
        })
      const res = await deleteThreeTicketExamplesByIds({ IDs })
      if (res.code === 0) {
        ElMessage({
          type: 'success',
          message: '删除成功'
        })
        if (tableData.value.length === IDs.length && page.value > 1) {
          page.value--
        }
        getTableData()
      }
      })
    }

// 行为控制标记（弹窗内部需要增还是改）
const type = ref('')

// 更新行
const updateThreeTicketExamplesFunc = async(row) => {
    const res = await findThreeTicketExamples({ ID: row.ID })
    type.value = 'update'
    if (res.code === 0) {
        formData.value = res.data
        inputValue.value = JSON.stringify(res.data.value || {}, null, 2)
        logInputValue.value = JSON.stringify(res.data.log || {}, null, 2)
        dialogFormVisible.value = true
    }
}


// 删除行
const deleteThreeTicketExamplesFunc = async (row) => {
    const res = await deleteThreeTicketExamples({ ID: row.ID })
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
        value: {},
        log: {},
        templeId: '',
        applicantId: undefined,
        applicantName: '',
        }
}
// 弹窗确定
const enterDialog = async () => {
  btnLoading.value = true
  elFormRef.value?.validate(async (valid) => {
    if (!valid) return (btnLoading.value = false)
    try {
      formData.value.value = JSON.parse(inputValue.value)
      formData.value.log = JSON.parse(logInputValue.value)
    } catch (error) {
      ElMessage({
        type: 'error',
        message: 'JSON 格式错误'
      })
      btnLoading.value = false
      return
    }

    let res
    switch (type.value) {
      case 'create':
        res = await createThreeTicketExamples(formData.value)
        break
      case 'update':
        res = await updateThreeTicketExamples(formData.value)
        break
      default:
        res = await createThreeTicketExamples(formData.value)
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
  // 打开弹窗
  const res = await findThreeTicketExamples({ ID: row.ID })
  if (res.code === 0) {
    detailFrom.value = res.data
    openDetailShow()
  }
}


// 关闭详情弹窗
const closeDetailShow = () => {
  detailShow.value = false
  detailFrom.value = {}
}

// 中间变量用于存储输入框的值
const inputValue = ref(JSON.stringify(formData.value, null, 2))
const logInputValue = ref(JSON.stringify(formData.log, null, 2))

// 初始化时将 formData.value 和 formData.log 转换为字符串
inputValue.value = JSON.stringify(formData.value, null, 2)
logInputValue.value = JSON.stringify(formData.log, null, 2)

// 获取预览内容
const getPreviewContent = (row) => {
    try {
        const data = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
        const templateData = data?.templateData || {};
        return Object.entries(templateData)
            .map(([key, value]) => {
                if (typeof value === 'object') {
                    return `${key}: [对象]`;
                }
                return `${key}: ${value}`;
            })
            .join(', ');
    } catch (e) {
        return '无效数据';
    }
};

// 获取列宽度
const getColumnWidth = (type) => {
    switch (type) {
        case 'checkbox':
            return '80';
        default:
            return '120';
    }
};

// 格式化日期时间
const formatDateTime = (datetime) => {
    if (!datetime) return '-';
    return new Date(datetime).toLocaleString();
};

// 解析值数据
const parseValueData = (value) => {
    try {
        const data = typeof value === 'string' ? JSON.parse(value) : value;
        
        if (!data?.templateData) {
            return null;
        }

        return Object.entries(data.templateData).map(([key, value]) => {
            const field = {
                name: key,
                value: value
            };

            if (Array.isArray(value)) {
                if (value.length > 0 && typeof value[0] === 'object') {
                    // 表格类型
                    field.type = 'table';
                    field.value = value;
                    // 从第一行数据推断列
                    field.columns = Object.keys(value[0]).map(key => ({
                        key,
                        title: key,
                        type: typeof value[0][key] === 'boolean' ? 'checkbox' : 'text'
                    }));
                } else {
                    // 输入列表类型
                    field.type = 'input-list';
                }
            } else if (typeof value === 'object' && value !== null) {
                if (value.start && value.end) {
                    field.type = 'dateTimeRange';
                } else if (
                    // 增加签名判断条件
                    value.type === 'signature' || 
                    (typeof value === 'string' && value.startsWith('data:image')) ||
                    (typeof value === 'object' && value.signature && typeof value.signature === 'string' && value.signature.startsWith('data:image'))
                ) {
                    field.type = 'signature';
                    // 处理签名值
                    if (typeof value === 'object' && value.signature) {
                        field.value = value.signature;
                    } else if (typeof value === 'string' && value.startsWith('data:image')) {
                        field.value = value;
                    }
                } else {
                    field.type = 'object';
                }
            } else {
                field.type = typeof value === 'boolean' ? 'checkbox' : 'text';
            }

            return field;
        });
    } catch (e) {
        console.error('解析值数据失败:', e);
        return null;
    }
};

// 添加格式化日志值的函数
const formatLogValue = (value, key) => {
    // 处理签名字段
    if ((key.toLowerCase().includes('签名') || key === 'signature') && 
        typeof value === 'string' && 
        value.startsWith('data:image')) {
        return h('img', {
            src: value,
            class: 'signature-image-small',
            alt: '签名'
        });
    }
    
    // 处理对象类型的签名
    if (typeof value === 'object' && value !== null) {
        if (value.signature && typeof value.signature === 'string' && value.signature.startsWith('data:image')) {
            return h('img', {
                src: value.signature,
                class: 'signature-image-small',
                alt: '签名'
            });
        }
        return JSON.stringify(value);
    }
    
    return value;
};

// 处理表单数据回填
const handleFormData = (data) => {
    try {
        if (data && data.value) {
            // 解析 value 字段中的数据
            const formData = data.value
            
            // 处理 templateData
            if (formData.templateData) {
                Object.keys(formData.templateData).forEach(key => {
                    // 对于特殊字段(如JSON字符串)需要解析
                    if (typeof formData.templateData[key] === 'string' && 
                        (formData.templateData[key].startsWith('{') || 
                         formData.templateData[key].startsWith('['))) {
                        try {
                            formData.templateData[key] = JSON.parse(formData.templateData[key])
                        } catch (e) {
                            console.warn(`解析字段 ${key} 失败:`, e)
                        }
                    }
                })
            }
            
            this.form = formData
        }
    } catch (error) {
        console.error('处理表单数据失败:', error)
    }
}

</script>

<style>

/* 添加的样式 */
.value-preview {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 300px;
    font-size: 13px;
    line-height: 1.4;
}

.popover-content {
    max-height: 500px;
    overflow-y: auto;
}

.popover-item {
    padding: 8px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.popover-item:last-child {
    border-bottom: none;
}

.popover-label {
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
}

.popover-value {
    color: var(--el-text-color-regular);
    word-break: break-word;
}

:deep(.value-popover) {
    max-width: 500px;
    padding: 12px;
}

:deep(.value-popover .el-table) {
    margin: 8px 0;
}

:deep(.value-popover .el-table--small) {
    font-size: 12px;
}

:deep(.value-popover .el-tag) {
    margin: 2px;
}

/* 添加签名图片相关样式 */
.signature-image {
    max-width: 200px;
    max-height: 100px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 2px;
    padding: 2px;
    background-color: #fff;
    object-fit: contain;
}

.signature-image-small {
    max-width: 100px;
    max-height: 50px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 2px;
    padding: 2px;
    background-color: #fff;
    object-fit: contain;
}

/* 签名字段容器样式 */
.signature-field {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px;
}

</style>
