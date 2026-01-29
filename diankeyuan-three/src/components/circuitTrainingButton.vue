<template>
  <div class="circuit-training-button" v-if="visible" @click.stop="toggleCircuitTraining">
    <div class="circuit-icon"></div>
    <span>电路培训</span>
  </div>
</template>

<script>
import EventBus from '@/bus';
import circuitConfig from '@/config/circuitConfig';
import { roomACircuit } from '@/config/circuitConfig';

export default {
  name: 'circuitTrainingButton',
  data() {
    return {
      visible: false,
      showCircuit: false,
      currentRoomId: null
    };
  },
  methods: {
    toggleCircuitTraining() {
      this.showCircuit = !this.showCircuit;
      
      // 获取当前房间ID
      const roomId = window.app ? window.app.activeRoomId || 'A' : 'A';
      this.currentRoomId = roomId;
      
      // 根据当前房间获取正确的电路配置
      let config = null;
      
      switch(roomId) {
        case 'A':
          config = roomACircuit;
          break;
        // 可以根据需要添加其他房间的配置
        default:
          config = roomACircuit; // 默认使用A房间配置
      }
      
      console.log('触发培训模式显示/隐藏事件', this.showCircuit, config);
      
      // 通过EventBus触发显示或隐藏培训电路图的事件
      if (this.showCircuit) {
        EventBus.$emit('startCircuitTraining', config);
      } else {
        EventBus.$emit('endCircuitTraining');
      }
    }
  },
  mounted() {
    // 监听房间变更，根据房间设置按钮可见性
    EventBus.$on('roomChanged', (data) => {
      if (data && data.roomId) {
        this.currentRoomId = data.roomId;
        // 根据房间ID判断是否显示电路按钮
        this.visible = ['A', 'B', 'D'].includes(this.currentRoomId);
      }
    });
    
    // 初始化检查当前房间
    setTimeout(() => {
      const roomId = window.app ? window.app.activeRoomId || 'A' : 'A';
      this.currentRoomId = roomId;
      this.visible = ['A', 'B', 'D'].includes(this.currentRoomId);
    }, 500);
  },
  beforeDestroy() {
    // 移除事件监听
    EventBus.$off('roomChanged');
  }
}
</script>

<style lang="less" scoped>
.circuit-training-button {
  position: fixed;
  top: 210px; // 位置在普通电路图按钮下方
  right: 20px;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 80px;
  background: rgba(0, 42, 75, 0.7);
  border: 1px solid #52c41a; // 使用绿色边框区分培训模式
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 58, 102, 0.9);
    transform: scale(1.05);
  }
  
  .circuit-icon {
    width: 32px;
    height: 32px;
    margin-bottom: 5px;
    background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzJweCIgaGVpZ2h0PSIzMnB4IiB2aWV3Qm94PSIwIDAgMzIgMzIiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cmVjdCBzdHJva2U9IiM1MmM0MWEiIHN0cm9rZS13aWR0aD0iMS41IiB4PSIzIiB5PSIzIiB3aWR0aD0iMjYiIGhlaWdodD0iMjYiIHJ4PSIyIj48L3JlY3Q+PGNpcmNsZSBmaWxsPSIjNTJjNDFhIiBjeD0iOCIgY3k9IjgiIHI9IjIiPjwvY2lyY2xlPjxjaXJjbGUgZmlsbD0iIzUyYzQxYSIgY3g9IjgiIGN5PSIxNiIgcj0iMiI+PC9jaXJjbGU+PGNpcmNsZSBmaWxsPSIjNTJjNDFhIiBjeD0iOCIgY3k9IjI0IiByPSIyIj48L2NpcmNsZT48Y2lyY2xlIGZpbGw9IiM1MmM0MWEiIGN4PSIyNCIgY3k9IjgiIHI9IjIiPjwvY2lyY2xlPjxjaXJjbGUgZmlsbD0iIzUyYzQxYSIgY3g9IjI0IiBjeT0iMTYiIHI9IjIiPjwvY2lyY2xlPjxjaXJjbGUgZmlsbD0iIzUyYzQxYSIgY3g9IjI0IiBjeT0iMjQiIHI9IjIiPjwvY2lyY2xlPjxsaW5lIHgxPSIxMCIgeTE9IjgiIHgyPSIyMiIgeTI9IjgiIHN0cm9rZT0iIzUyYzQxYSIgc3Ryb2tlLXdpZHRoPSIxLjUiPjwvbGluZT48bGluZSB4MT0iMTAiIHkxPSIxNiIgeDI9IjIyIiB5Mj0iMTYiIHN0cm9rZT0iIzUyYzQxYSIgc3Ryb2tlLXdpZHRoPSIxLjUiPjwvbGluZT48bGluZSB4MT0iMTAiIHkxPSIyNCIgeDI9IjIyIiB5Mj0iMjQiIHN0cm9rZT0iIzUyYzQxYSIgc3Ryb2tlLXdpZHRoPSIxLjUiPjwvbGluZT48bGluZSB4MT0iOCIgeTE9IjEwIiB4Mj0iOCIgeTI9IjE0IiBzdHJva2U9IiM1MmM0MWEiIHN0cm9rZS13aWR0aD0iMS41Ij48L2xpbmU+PGxpbmUgeDE9IjgiIHkxPSIxOCIgeDI9IjgiIHkyPSIyMiIgc3Ryb2tlPSIjNTJjNDFhIiBzdHJva2Utd2lkdGg9IjEuNSI+PC9saW5lPjwvZz48L3N2Zz4=');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }
  
  span {
    color: #d9f7be;
    font-size: 14px;
    text-align: center;
  }
}
</style> 