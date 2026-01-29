<template>
  <div class="circuit-button" v-if="visible" @click.stop="toggleCircuit">
    <div class="circuit-icon"></div>
    <span>电路图</span>
  </div>
</template>

<script>
import EventBus from '@/bus';
import circuitConfig from '@/config/circuitConfig';
import { roomACircuit } from '@/config/circuitConfig';

export default {
  name: 'circuitButton',
  data() {
    return {
      visible: false,
      showCircuit: false,
      currentRoomId: null
    };
  },
  methods: {
    toggleCircuit() {
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
      
      // 通过EventBus触发显示或隐藏电路图的事件
      EventBus.$emit('showCircuit', {
        show: this.showCircuit,
        config: this.showCircuit ? config : null
      });
    }
  },
  mounted() {
    console.log('电路图按钮组件已挂载');
    
    // 监听进入配电室事件，显示按钮
    EventBus.$on('enterPowerRoom', (roomId) => {
      console.log('电路图按钮: 收到enterPowerRoom事件, roomId:', roomId);
      this.visible = true;
      this.currentRoomId = roomId;
      this.showCircuit = false; // 重置电路图显示状态
    });
    
    // 监听离开配电室事件，隐藏按钮
    EventBus.$on('leavePowerRoom', () => {
      console.log('电路图按钮: 收到leavePowerRoom事件');
      this.visible = false;
      this.showCircuit = false;
      // 隐藏电路图
      EventBus.$emit('showCircuit', { show: false });
    });
    
    // 初始化检查当前房间状态
    setTimeout(() => {
      if (window.app) {
        const inPowerRoom = (window.app.aRoomModel && window.app.aRoomModel.visible) ||
                           (window.app.bRoomModel && window.app.bRoomModel.visible) ||
                           (window.app.dRoomModel && window.app.dRoomModel.visible);
        this.visible = inPowerRoom;
      }
    }, 500);
  },
  beforeDestroy() {
    // 移除事件监听
    EventBus.$off('enterPowerRoom');
    EventBus.$off('leavePowerRoom');
  }
}
</script>

<style lang="less" scoped>
.circuit-button {
  position: fixed;
  top: 120px;
  right: 20px;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 80px;
  background: rgba(0, 42, 75, 0.7);
  border: 1px solid #4dc4ff;
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
    background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzJweCIgaGVpZ2h0PSIzMnB4IiB2aWV3Qm94PSIwIDAgMzIgMzIiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cmVjdCBzdHJva2U9IiM0REM0RkYiIHN0cm9rZS13aWR0aD0iMS41IiB4PSIzIiB5PSIzIiB3aWR0aD0iMjYiIGhlaWdodD0iMjYiIHJ4PSIyIj48L3JlY3Q+PGNpcmNsZSBmaWxsPSIjNERDNEZGIiBjeD0iOCIgY3k9IjgiIHI9IjIiPjwvY2lyY2xlPjxjaXJjbGUgZmlsbD0iIzREQzRGRiIgY3g9IjgiIGN5PSIxNiIgcj0iMiI+PC9jaXJjbGU+PGNpcmNsZSBmaWxsPSIjNERDNEZGIiBjeD0iOCIgY3k9IjI0IiByPSIyIj48L2NpcmNsZT48Y2lyY2xlIGZpbGw9IiM0REM0RkYiIGN4PSIyNCIgY3k9IjgiIHI9IjIiPjwvY2lyY2xlPjxjaXJjbGUgZmlsbD0iIzREQzRGRiIgY3g9IjI0IiBjeT0iMTYiIHI9IjIiPjwvY2lyY2xlPjxjaXJjbGUgZmlsbD0iIzREQzRGRiIgY3g9IjI0IiBjeT0iMjQiIHI9IjIiPjwvY2lyY2xlPjxsaW5lIHgxPSIxMCIgeTE9IjgiIHgyPSIyMiIgeTI9IjgiIHN0cm9rZT0iIzREQzRGRiIgc3Ryb2tlLXdpZHRoPSIxLjUiPjwvbGluZT48bGluZSB4MT0iMTAiIHkxPSIxNiIgeDI9IjIyIiB5Mj0iMTYiIHN0cm9rZT0iIzREQzRGRiIgc3Ryb2tlLXdpZHRoPSIxLjUiPjwvbGluZT48bGluZSB4MT0iMTAiIHkxPSIyNCIgeDI9IjIyIiB5Mj0iMjQiIHN0cm9rZT0iIzREQzRGRiIgc3Ryb2tlLXdpZHRoPSIxLjUiPjwvbGluZT48bGluZSB4MT0iOCIgeTE9IjEwIiB4Mj0iOCIgeTI9IjE0IiBzdHJva2U9IiM0REM0RkYiIHN0cm9rZS13aWR0aD0iMS41Ij48L2xpbmU+PGxpbmUgeDE9IjgiIHkxPSIxOCIgeDI9IjgiIHkyPSIyMiIgc3Ryb2tlPSIjNERDNEZGIiBzdHJva2Utd2lkdGg9IjEuNSI+PC9saW5lPjwvZz48L3N2Zz4=');
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