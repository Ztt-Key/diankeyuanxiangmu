<template>
  <div class="question-bank-container">
    <div class="gva-form-box">
      <el-form :model="formData" ref="elFormRef" label-position="right" :rules="rule" label-width="80px">
        <el-form-item label="题库标题:" prop="title">
          <el-input v-model="formData.title" :clearable="true" placeholder="请输入题库标题" />
        </el-form-item>
        <el-form-item label="题库描述:" prop="description">
          <el-input v-model="formData.description" :clearable="true" placeholder="请输入题库描述" />
        </el-form-item>
        <el-form-item label="1：单选 2：多选 3：判断:" prop="typeId">
          <el-select v-model="formData.typeId" placeholder="请选择">
            <el-option label="1" :value="1" />
            <el-option label="2" :value="2" />
            <el-option label="3" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button :loading="btnLoading" type="primary" @click="saveNewBank">新建</el-button>
          <el-button type="primary" @click="back">清空</el-button>
        </el-form-item>
      </el-form>
      <questionBank />
    </div>
  </div>
</template>

<script setup>
import {
  createQuestionBank,
  updateQuestionBank,
  findQuestionBank
} from '@/api/Answermodule/questionBank'

defineOptions({
  name: 'QuestionBankForm'
})

// 自动获取字典
import { getDictFunc } from '@/utils/format'
import { useRoute, useRouter } from "vue-router"
import { ElMessage } from 'element-plus'
import { ref, reactive } from 'vue'
import questionBank from './questionBank.vue'

const route = useRoute()
const router = useRouter()

// 提交按钮loading
const btnLoading = ref(false)

const type = ref('')
const formData = ref({
  title: '',
  description: '',
  typeId: undefined,
})
// 验证规则
const rule = reactive({
})
const elFormRef = ref()

// 初始化方法
const init = async () => {
  // 建议通过url传参获取目标数据ID 调用 find方法进行查询数据操作 从而决定本页面是create还是update 以下为id作为url参数示例
  if (route.query.id) {
    const res = await findQuestionBank({ ID: route.query.id })
    if (res.code === 0) {
      formData.value = res.data
      type.value = 'update'
    }
  } else {
    type.value = 'create'
  }
}

init()
// 保存按钮
const saveNewBank = async () => {
  if (formData.value.title === '' || formData.value.description === '' || formData.value.typeId === '') {
    ElMessage({
      type: 'error',
      message: '请填完整'
    })
    return
  }
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
    }
  })
}

// 返回按钮
const back = () => {
  formData.value = { title: '', description: '', typeId: undefined }
}

</script>

<style scoped>
.question-bank-container {
  padding: 20px;
  background-color: var(--el-bg-color-page, #f5f7fa);
  min-height: 100vh;
}

.gva-form-box {
  background-color: var(--el-bg-color, #ffffff);
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  color: var(--el-text-color-primary, #303133);
}

:deep(.el-input__inner) {
  background-color: var(--el-input-bg-color, #ffffff);
  color: var(--el-text-color-primary, #303133);
  border-color: var(--el-border-color, #dcdfe6);
}

:deep(.el-button) {
  margin-right: 10px;
}

:deep(.el-select) {
  width: 100%;
}
</style>
