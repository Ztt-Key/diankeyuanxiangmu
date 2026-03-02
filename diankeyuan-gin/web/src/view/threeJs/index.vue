<template>
  <div class="three-js-wrap">
    <div
      class="three-js-placeholder"
      :class="{ 'is-hidden': iframeLoaded }"
    />
    <div v-if="loadFailed" class="three-js-fail">
      <span>园区 3D 服务暂不可用，请确认已启动对应服务。</span>
      <div class="three-js-fail-urls">已尝试：{{ triedUrls }}</div>
    </div>
    <iframe
      v-show="iframeLoaded"
      ref="iframeRef"
      class="three-js-iframe"
      :src="iframeSrc"
      frameborder="0"
      @load="onIframeLoad"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

defineOptions({
  name: 'ThreeJsView'
})

// 园区 3D 候选地址（按优先级尝试），可随环境修改或通过环境变量扩展
const CANDIDATE_URLS = [
  
  'http://localhost:8081/',
  'http://localhost:8082/',
  'http://localhost:8083/',
  'http://localhost:8084/'
]

const iframeSrc = ref('')
const iframeLoaded = ref(false)
const loadFailed = ref(false)
const triedUrls = ref('')
const iframeRef = ref(null)
let mountRaf = null
let loadTimeout = null
let currentIndex = 0

const tryNextUrl = () => {
  if (loadTimeout != null) {
    clearTimeout(loadTimeout)
    loadTimeout = null
  }
  currentIndex += 1
  if (currentIndex >= CANDIDATE_URLS.length) {
    loadFailed.value = true
    triedUrls.value = CANDIDATE_URLS.join('、')
    return
  }
  const url = CANDIDATE_URLS[currentIndex]
  iframeSrc.value = url
  loadTimeout = setTimeout(tryNextUrl, 8000)
}

const onIframeLoad = () => {
  if (loadTimeout != null) {
    clearTimeout(loadTimeout)
    loadTimeout = null
  }
  iframeLoaded.value = true
}

onMounted(() => {
  mountRaf = requestAnimationFrame(() => {
    if (CANDIDATE_URLS.length === 0) {
      loadFailed.value = true
      triedUrls.value = '（未配置候选地址）'
      return
    }
    currentIndex = 0
    iframeSrc.value = CANDIDATE_URLS[0]
    loadTimeout = setTimeout(tryNextUrl, 8000)
  })
})

onBeforeUnmount(() => {
  if (mountRaf != null) cancelAnimationFrame(mountRaf)
  if (loadTimeout != null) clearTimeout(loadTimeout)
  iframeLoaded.value = false
  loadFailed.value = false
})
</script>

<style scoped>
.three-js-wrap {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  min-height: 100%;
  background: var(--el-bg-color-page, #f2f3f5);
  z-index: 10;
}

.dark .three-js-wrap {
  background: var(--el-bg-color-page);
}

.three-js-placeholder {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: var(--el-bg-color-page, #f2f3f5);
  transition: opacity 0.15s ease-out;
  z-index: 0;
}

.three-js-placeholder.is-hidden {
  opacity: 0;
  pointer-events: none;
}

.three-js-iframe {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  min-height: 100%;
  border: none;
  z-index: 1;
}

.three-js-fail {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  z-index: 2;
}

.three-js-fail-urls {
  margin-top: 12px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
