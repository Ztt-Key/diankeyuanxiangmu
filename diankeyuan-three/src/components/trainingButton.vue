<template>
  <div class="training-button" v-if="visible" @click.stop="toggleTraining">
    <div class="training-icon"></div>
    <span>培训模式</span>
  </div>
</template>

<script>
import EventBus from '@/bus';
import { roomACircuit } from '@/config/circuitConfig';

export default {
  name: 'trainingButton',
  data() {
    return {
      visible: false,
      showTraining: false,
      currentRoomId: null
    };
  },
  methods: {
    toggleTraining() {
      this.showTraining = !this.showTraining;
      
      // 获取当前房间的电路配置
      const circuitData = this.getCurrentRoomCircuitConfig();
      console.log('触发培训模式显示/隐藏事件', this.showTraining, circuitData);
      
      // 通过事件总线触发显示/隐藏培训模式事件
      if (this.showTraining) {
        EventBus.$emit('startCircuitTraining', circuitData);
      } else {
        EventBus.$emit('endCircuitTraining');
      }
    },
    
    getCurrentRoomCircuitConfig() {
      // 临时解决方案：固定使用A座配电室配置
      if (this.currentRoomId === 'A-PowerRoom') {
        console.log('使用A座配电室配置');
        return roomACircuit;
      }
      
      return roomACircuit; // 找不到配置时返回A座配置作为默认
    },
    
    // 新增：显示成功消息
    showSuccessMessage(message) {
      // 这里可以添加一个提示框或其他视觉反馈
      console.log('培训成功:', message);
      
      // 例如，可以通过事件总线触发一个全局通知
      EventBus.$emit('showNotification', {
        type: 'success',
        title: '培训完成',
        message: message || '您已成功完成培训！'
      });
    }
  },
  mounted() {
    console.log('培训按钮组件已挂载');
    
    // 监听房间切换事件，显示或隐藏按钮
    EventBus.$on('enterPowerRoom', (roomId) => {
      console.log('收到enterPowerRoom事件, roomId:', roomId);
      this.visible = true;
      this.currentRoomId = roomId;
      this.showTraining = false; // 重置培训模式显示状态
    });
    
    EventBus.$on('leavePowerRoom', () => {
      this.visible = false;
      this.showTraining = false;
      // 隐藏培训模式
      EventBus.$emit('endCircuitTraining');
    });
    
    // 监听培训完成事件
    EventBus.$on('circuitTrainingComplete', (data) => {
      console.log('收到培训完成事件:', data);
      
      // 如果培训成功，显示成功消息
      if (data.success) {
        // 可以在这里添加显示成功消息的逻辑
        this.showSuccessMessage(data.completionText);
      }
      
      // 培训完成后不自动关闭培训模式，让用户手动关闭
    });
  },
  beforeDestroy() {
    // 移除事件监听
    EventBus.$off('enterPowerRoom');
    EventBus.$off('leavePowerRoom');
    EventBus.$off('circuitTrainingComplete');
  }
};
</script>

<style lang="less" scoped>
.training-button {
  position: fixed;
  top: 210px; // 位于电路图按钮下方
  right: 20px;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 80px;
  background: rgba(0, 42, 75, 0.7);
  border: 1px solid #4dff9e; // 使用不同的颜色区分
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 58, 102, 0.9);
    transform: scale(1.05);
  }
  
  .training-icon {
    width: 32px;
    height: 32px;
    margin-bottom: 5px;
    background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzJweCIgaGVpZ2h0PSIzMnB4IiB2aWV3Qm94PSIwIDAgMzIgMzIiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cmVjdCBzdHJva2U9IiM0REZGOUUiIHN0cm9rZS13aWR0aD0iMS41IiB4PSI2IiB5PSI0IiB3aWR0aD0iMjAiIGhlaWdodD0iMjQiIHJ4PSIyIj48L3JlY3Q+PHBhdGggZD0iTTEyLDEyIEwyMCwxMiBMMjAsMTQgTDEyLDE0IEwxMiwxMiBaIE0xMiwxNiBMMjAsMTYgTDIwLDE4IEwxMiwxOCBMMTIsMTYgWiBNMTIsMjAgTDIwLDIwIEwyMCwyMiBMMTIsMjIgTDEyLDIwIFoiIGZpbGw9IiM0REZGOUUiPjwvcGF0aD48Y2lyY2xlIGZpbGw9IiM0REZGOUUiIGN4PSIxNiIgY3k9IjgiIHI9IjMiPjwvY2lyY2xlPjwvZz48L3N2Zz4=');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }
  
  span {
    color: #bde4ff;
    font-size: 14px;
    text-align: center;
  }
}
</style> 