<template>
  <div class="help-guide">
    <!-- 帮助按钮 -->
    <div class="help-button" @click="toggleGuide" :class="{ active: showGuide }">
      <div class="help-icon">?</div>
      <span>操作指引</span>
    </div>

    <!-- 操作指引弹窗 -->
    <transition name="fade">
      <div class="guide-modal" v-if="showGuide" @click.self="closeGuide">
        <div class="guide-content">
          <div class="guide-header">
            <h2>操作指引</h2>
            <div class="close-btn" @click="closeGuide">×</div>
          </div>
          
          <div class="guide-body">
            <!-- 基础操作 -->
            <div class="guide-section">
              <h3>🖱️ 基础操作</h3>
              <div class="guide-item">
                <div class="key-combo">
                  <span class="key">鼠标滚轮</span>
                </div>
                <div class="description">缩放视角（控制相机远近）</div>
              </div>
              <div class="guide-item">
                <div class="key-combo">
                  <span class="key">柜子动效</span>
                </div>
                <div class="description">红色表示关闭，绿色表示开启</div>
              </div>
              <div class="guide-item">
                <div class="key-combo">
                  <span class="key">鼠标左键</span>
                  <span class="plus">+</span>
                  <span class="key">拖动</span>
                </div>
                <div class="description">旋转视角（围绕场景旋转）</div>
              </div>
              <div class="guide-item">
                <div class="key-combo">
                  <span class="key">鼠标右键</span>
                  <span class="plus">+</span>
                  <span class="key">拖动</span>
                </div>
                <div class="description">平移视角（左右上下移动）</div>
              </div>
            </div>

            <!-- 快捷操作 -->
            <div class="guide-section">
              <h3>⌨️ 快捷操作</h3>
              <div class="guide-item">
                <div class="key-combo">
                  <span class="key">Shift</span>
                  <span class="plus">+</span>
                  <span class="key">鼠标左键</span>
                </div>
                <div class="description">切换相机位置/快速定位</div>
              </div>
              <div class="guide-item">
                <div class="key-combo">
                  <span class="key">双击</span>
                </div>
                <div class="description">快速聚焦到点击位置</div>
              </div>
            </div>

            <!-- 功能模块 -->
            <div class="guide-section">
              <h3>📋 功能模块</h3>
              <div class="guide-item">
                <div class="module-name">首页</div>
                <div class="description">返回园区整体视图，查看全局场景</div>
              </div>
              <div class="guide-item">
                <div class="module-name">操作仿真</div>
                <div class="description">进入配电室仿真模式，可以点击配电室进行操作训练</div>
              </div>
              <div class="guide-item">
                <div class="module-name">线缆显示</div>
                <div class="description">查看园区电力线缆分布和走向</div>
              </div>
            </div>

            <!-- 配电室操作 -->
            <div class="guide-section">
              <h3>🔌 配电室操作</h3>
              <div class="guide-item">
                <div class="key-combo">
                  <span class="key">点击配电柜</span>
                </div>
                <div class="description">查看配电柜详细信息和回路状态</div>
              </div>
              <div class="guide-item">
                <div class="key-combo">
                  <span class="key">复原按钮</span>
                </div>
                <div class="description">重置当前视角到默认位置</div>
              </div>
              <div class="guide-item">
                <div class="key-combo">
                  <span class="key">回路面板</span>
                </div>
                <div class="description">点击回路可查看电路详情和设备状态</div>
              </div>
            </div>

            <!-- 提示信息 -->
            <div class="guide-tips">
              <div class="tip-title">💡 温馨提示</div>
              <ul>
                <li>首次使用建议先浏览全局视图，熟悉园区布局</li>
                <li>进入配电室后可通过左下角按钮切换不同配电室</li>
                <li>如视角丢失，可点击"复原"按钮重置</li>
                <li>鼠标悬停在设备上可查看设备名称</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'helpGuide',
  data() {
    return {
      showGuide: false
    };
  },
  methods: {
    toggleGuide() {
      this.showGuide = !this.showGuide;
    },
    closeGuide() {
      this.showGuide = false;
    }
  },
  mounted() {
    // 监听ESC键关闭弹窗
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.showGuide) {
        this.closeGuide();
      }
    });
  }
};
</script>

<style lang="less" scoped>
.help-guide {
  position: fixed;
  z-index: 1002;
}

// 帮助按钮
.help-button {
  position: fixed;
  top: 30px;
  right: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 80px;
  background: rgba(0, 42, 75, 0.7);
  border: 1px solid #1890ff;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover, &.active {
    background: rgba(0, 58, 102, 0.9);
    transform: scale(1.05);
    border-color: #40a9ff;
  }
  
  .help-icon {
    width: 32px;
    height: 32px;
    margin-bottom: 5px;
    background: linear-gradient(135deg, #1890ff, #40a9ff);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: bold;
    color: #fff;
  }
  
  span {
    color: #91d5ff;
    font-size: 12px;
    text-align: center;
  }
}

// 弹窗遮罩和内容
.guide-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.guide-content {
  width: 600px;
  max-width: 90%;
  max-height: 85vh;
  background: linear-gradient(180deg, rgba(0, 42, 75, 0.95) 0%, rgba(0, 30, 55, 0.98) 100%);
  border: 1px solid #1890ff;
  border-radius: 10px;
  box-shadow: 0 0 30px rgba(24, 144, 255, 0.3);
  overflow: hidden;
}

.guide-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background: linear-gradient(90deg, rgba(24, 144, 255, 0.3) 0%, rgba(24, 144, 255, 0.1) 100%);
  border-bottom: 1px solid rgba(24, 144, 255, 0.3);
  
  h2 {
    margin: 0;
    color: #fff;
    font-size: 20px;
    font-weight: 500;
  }
  
  .close-btn {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: #91d5ff;
    cursor: pointer;
    border-radius: 50%;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }
  }
}

.guide-body {
  padding: 20px;
  max-height: calc(85vh - 60px);
  overflow-y: auto;
  
  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(24, 144, 255, 0.5);
    border-radius: 3px;
    
    &:hover {
      background: rgba(24, 144, 255, 0.8);
    }
  }
}

.guide-section {
  margin-bottom: 20px;
  
  h3 {
    margin: 0 0 12px 0;
    color: #40a9ff;
    font-size: 16px;
    font-weight: 500;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(24, 144, 255, 0.2);
  }
}

.guide-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(24, 144, 255, 0.1);
  }
  
  .key-combo {
    display: flex;
    align-items: center;
    min-width: 180px;
    
    .key {
      padding: 4px 10px;
      background: linear-gradient(180deg, #3a3a5c 0%, #2a2a4c 100%);
      border: 1px solid #4a4a6c;
      border-radius: 4px;
      color: #fff;
      font-size: 13px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    
    .plus {
      margin: 0 8px;
      color: #91d5ff;
      font-size: 14px;
    }
  }
  
  .module-name {
    min-width: 180px;
    padding: 4px 12px;
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    border-radius: 4px;
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    text-align: center;
  }
  
  .description {
    flex: 1;
    color: #b8d4e8;
    font-size: 14px;
    padding-left: 15px;
  }
}

.guide-tips {
  margin-top: 20px;
  padding: 15px;
  background: rgba(250, 173, 20, 0.1);
  border: 1px solid rgba(250, 173, 20, 0.3);
  border-radius: 8px;
  
  .tip-title {
    color: #faad14;
    font-size: 15px;
    font-weight: 500;
    margin-bottom: 10px;
  }
  
  ul {
    margin: 0;
    padding-left: 20px;
    
    li {
      color: #d4c4a8;
      font-size: 13px;
      line-height: 1.8;
      
      &::marker {
        color: #faad14;
      }
    }
  }
}

// 过渡动画
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

.fade-enter-active .guide-content {
  animation: slideIn 0.3s ease;
}

.fade-leave-active .guide-content {
  animation: slideOut 0.2s ease;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-20px);
    opacity: 0;
  }
}
</style>
