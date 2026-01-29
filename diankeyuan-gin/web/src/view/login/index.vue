<template>
  <div id="userLayout" class="relative w-full h-full">
    <!-- 背景图片层 -->
    <div class="absolute inset-0">
      <img src="@/assets/login.jpg" class="w-full h-full object-cover" alt="background" />
      <!-- 添加一个半透明遮罩 -->
      <div class="absolute inset-0 bg-black bg-opacity-30"></div>
    </div>

    <!-- 登录框内容 -->
    <div class="relative z-10 flex items-center justify-center w-full h-full p-4">
      <div class="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-2xl w-full max-w-md p-8">
        <div class="text-center mb-8">
          <img class="w-16 mx-auto mb-4" :src="$GIN_VUE_ADMIN.appLogo" alt="" />
          <h2 class="text-2xl font-bold text-gray-800">{{ $GIN_VUE_ADMIN.appName }}</h2>
        </div>

        <el-form
          ref="loginForm"
          :model="loginFormData"
          :rules="rules"
          :validate-on-rule-change="false"
          @keyup.enter="submitForm"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginFormData.username"
              size="large"
              placeholder="请输入用户名"
              class="h-12 rounded-md"
              suffix-icon="user"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginFormData.password"
              show-password
              size="large"
              type="password"
              placeholder="请输入密码"
              class="h-12 rounded-md"
            />
          </el-form-item>

          <el-form-item v-if="loginFormData.openCaptcha" prop="captcha">
            <div class="flex gap-4">
              <el-input
                v-model="loginFormData.captcha"
                placeholder="请输入验证码"
                size="large"
                class="flex-1 h-12 rounded-md"
              />
              <div class="w-32 h-12 bg-gray-100 rounded-md overflow-hidden">
                <img
                  v-if="picPath"
                  class="w-full h-full object-cover"
                  :src="picPath"
                  alt="验证码"
                  @click="loginVerify()"
                />
              </div>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button
              class="w-full h-12 text-lg font-medium rounded-md"
              type="primary"
              @click="submitForm"
            >登 录</el-button>
          </el-form-item>

          <!-- <el-form-item>
            <el-button
              class="w-full h-12 text-lg font-medium rounded-md"
              type="default"
              @click="checkInit"
            >前往初始化</el-button>
          </el-form-item> -->
        </el-form>

        <!-- <div class="flex justify-center gap-4 mt-6">
          <a href="https://www.gin-vue-admin.com/" target="_blank" class="text-gray-600 hover:text-blue-500">
            <img src="@/assets/docs.png" class="w-6 h-6" alt="文档" />
          </a>
          <a href="https://support.qq.com/product/371961" target="_blank" class="text-gray-600 hover:text-blue-500">
            <img src="@/assets/kefu.png" class="w-6 h-6" alt="客服" />
          </a>
          <a
            href="https://github.com/flipped-aurora/gin-vue-admin"
            target="_blank"
            class="text-gray-600 hover:text-blue-500"
          >
            <img src="@/assets/github.png" class="w-6 h-6" alt="github" />
          </a>
          <a href="https://space.bilibili.com/322210472" target="_blank" class="text-gray-600 hover:text-blue-500">
            <img src="@/assets/video.png" class="w-6 h-6" alt="背景" />
          </a>
        </div> -->
      </div>
    </div>
  </div>
</template>

<script setup>
  import { captcha } from '@/api/user'
  import { checkDB } from '@/api/initdb'
  import BottomInfo from '@/components/bottomInfo/bottomInfo.vue'
  import { reactive, ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import { useRouter } from 'vue-router'
  import { useUserStore } from '@/pinia/modules/user'

  defineOptions({
    name: 'Login'
  })

  const router = useRouter()
  // 验证函数
  const checkUsername = (rule, value, callback) => {
    if (value.length < 5) {
      return callback(new Error('请输入正确的用户名'))
    } else {
      callback()
    }
  }
  const checkPassword = (rule, value, callback) => {
    if (value.length < 6) {
      return callback(new Error('请输入正确的密码'))
    } else {
      callback()
    }
  }

  // 获取验证码
  const loginVerify = async () => {
    const ele = await captcha()
    rules.captcha.push({
      max: ele.data.captchaLength,
      min: ele.data.captchaLength,
      message: `请输入${ele.data.captchaLength}位验证码`,
      trigger: 'blur'
    })
    picPath.value = ele.data.picPath
    loginFormData.captchaId = ele.data.captchaId
    loginFormData.openCaptcha = ele.data.openCaptcha
  }
  loginVerify()

  // 登录相关操作
  const loginForm = ref(null)
  const picPath = ref('')
  const loginFormData = reactive({
    username: 'admin',
    password: '',
    captcha: '',
    captchaId: '',
    openCaptcha: false
  })
  const rules = reactive({
    username: [{ validator: checkUsername, trigger: 'blur' }],
    password: [{ validator: checkPassword, trigger: 'blur' }],
    captcha: [
      {
        message: '验证码格式不正确',
        trigger: 'blur'
      }
    ]
  })

  const userStore = useUserStore()
  const login = async () => {
    return await userStore.LoginIn(loginFormData)
  }
  const submitForm = () => {
    loginForm.value.validate(async (v) => {
      if (!v) {
        // 未通过前端静态验证
        ElMessage({
          type: 'error',
          message: '请正确填写登录信息',
          showClose: true
        })
        await loginVerify()
        return false
      }

      // 通过验证，请求登陆
      const flag = await login()

      // 登陆失败，刷新验证码
      if (!flag) {
        await loginVerify()
        return false
      }

      // 登陆成功
      return true
    })
  }

  // 跳转初始化
  const checkInit = async () => {
    const res = await checkDB()
    if (res.code === 0) {
      if (res.data?.needInit) {
        userStore.NeedInit()
        await router.push({ name: 'Init' })
      } else {
        ElMessage({
          type: 'info',
          message: '已配置数据库信息，无法初始化'
        })
      }
    }
  }
</script>

<style scoped>
#userLayout {
  min-height: 100vh;
  background-color: #f0f2f5;
}
</style>
