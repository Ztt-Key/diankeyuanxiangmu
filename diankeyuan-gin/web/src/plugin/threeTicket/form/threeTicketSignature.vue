
<template>
  <div>
    <div class="gva-form-box">
      <el-form :model="formData" ref="elFormRef" label-position="right" :rules="rule" label-width="80px">
        <el-form-item label="用户ID:" prop="userId">
          <el-input v-model="formData.userId" :clearable="true"  placeholder="请输入用户ID" />
       </el-form-item>
        <el-form-item label="签名图片地址:" prop="imgUrl">
          <el-input v-model="formData.imgUrl" :clearable="true"  placeholder="请输入签名图片地址" />
       </el-form-item>
        <el-form-item label="密码:" prop="passWord">
          <el-input v-model="formData.passWord" :clearable="true"  placeholder="请输入密码" />
       </el-form-item>
        <el-form-item label="扩展字段:" prop="info">
          // 此字段为json结构，可以前端自行控制展示和数据绑定模式 需绑定json的key为 formData.info 后端会按照json的类型进行存取
          {{ formData.info }}
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
  createThreeTicketSignature,
  updateThreeTicketSignature,
  findThreeTicketSignature
} from '@/api/threeTicket/threeTicketSignature'

defineOptions({
    name: 'ThreeTicketSignatureForm'
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
            userId: '',
            imgUrl: '',
            passWord: '',
            info: {},
        })
// 验证规则
const rule = reactive({
})

const elFormRef = ref()

// 初始化方法
const init = async () => {
 // 建议通过url传参获取目标数据ID 调用 find方法进行查询数据操作 从而决定本页面是create还是update 以下为id作为url参数示例
    if (route.query.id) {
      const res = await findThreeTicketSignature({ ID: route.query.id })
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
               res = await createThreeTicketSignature(formData.value)
               break
             case 'update':
               res = await updateThreeTicketSignature(formData.value)
               break
             default:
               res = await createThreeTicketSignature(formData.value)
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
