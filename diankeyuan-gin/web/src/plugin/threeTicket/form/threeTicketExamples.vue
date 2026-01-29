
<template>
  <div>
    <div class="gva-form-box">
      <el-form :model="formData" ref="elFormRef" label-position="right" :rules="rule" label-width="80px">
        <el-form-item label="内容:" prop="value">
          // 此字段为json结构，可以前端自行控制展示和数据绑定模式 需绑定json的key为 formData.value 后端会按照json的类型进行存取
          {{ formData.value }}
       </el-form-item>
        <el-form-item label="填写日志:" prop="log">
          // 此字段为json结构，可以前端自行控制展示和数据绑定模式 需绑定json的key为 formData.log 后端会按照json的类型进行存取
          {{ formData.log }}
       </el-form-item>
        <el-form-item label="绑定模板ID:" prop="templeId">
          <el-input v-model="formData.templeId" :clearable="true"  placeholder="请输入绑定模板ID" />
       </el-form-item>
        <el-form-item label="申请人ID:" prop="applicantId">
          <el-input v-model.number="formData.applicantId" :clearable="true" placeholder="请输入" />
       </el-form-item>
        <el-form-item label="申请人姓名:" prop="applicantName">
          <el-input v-model="formData.applicantName" :clearable="true"  placeholder="请输入申请人姓名" />
       </el-form-item>
        <el-form-item>
          <el-button :loading="btnLoading" type="primary" @click="save">保存</el-button>
          <el-button type="primary" @click="back">返回</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import {
  createThreeTicketExamples,
  updateThreeTicketExamples,
  findThreeTicketExamples
} from '@/api/threeTicket/threeTicketExamples'

defineOptions({
    name: 'ThreeTicketExamplesForm'
})

// 自动获取字典
import { getDictFunc } from '@/utils/format'
import { useRoute, useRouter } from "vue-router"
import { ElMessage } from 'element-plus'
import { ref, reactive } from 'vue'


const route = useRoute()
const router = useRouter()

// 提交按钮loading
const btnLoading = ref(false)

const type = ref('')
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

const elFormRef = ref()

// 初始化方法
const init = async () => {
 // 建议通过url传参获取目标数据ID 调用 find方法进行查询数据操作 从而决定本页面是create还是update 以下为id作为url参数示例
    if (route.query.id) {
      const res = await findThreeTicketExamples({ ID: route.query.id })
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
const save = async() => {
      btnLoading.value = true
      elFormRef.value?.validate( async (valid) => {
         if (!valid) return btnLoading.value = false
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
           }
       })
}

// 返回按钮
const back = () => {
    router.go(-1)
}

</script>

<style>
</style>
