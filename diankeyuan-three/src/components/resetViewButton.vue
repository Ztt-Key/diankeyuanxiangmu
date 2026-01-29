<template>
  <div class="reset-view-button" v-if="visible" @click.stop="resetView">
    <div class="reset-icon"></div>
    <span>复原</span>
  </div>
</template>

<script>
import EventBus from '@/bus';

// 各楼座的初始相机位置配置
const INITIAL_CAMERA_POSITIONS = {
  simulation: {
    // 操作仿真模块的初始视角
    position: [16.89, 93.81, -46.26],
    controls: [-32.01, 24.14, -47.11]
  },
  A: {
    position: [-205.62253965798172, 206.3879616074446, -188.64123015669873],
    controls: [-91.7307044491467, -16.647123247703064, 1.4329682345023118]
  },
  B: {
    position: [24.151990295168915, 100.26721464448161, -122.52672864267403],
    controls: [-24.595566220945525, 5.193444765493946, -7.445519158492129]
  },
  D: {
    position: [-209.0643556789758, 158.67033052041282, -301.35525738101046],
    controls: [-6.592623149935286, -27.650576206871794, -103.42556654567807]
  }
};

export default {
  name: 'resetViewButton',
  data() {
    return {
      visible: false,
      currentRoomId: null
    };
  },
  methods: {
    resetView() {
      // 获取当前房间ID
      let roomId = this.currentRoomId;
      
      // 如果当前是操作仿真模式，使用simulation配置
      if (roomId === 'simulation') {
        console.log('复原视角到操作仿真初始视角');
      } else {
        // 尝试从 currentBuilding 获取楼座ID
        roomId = window.currentBuilding || (window.app ? window.app.activeRoomId : null);
        
        // 提取楼座字母（A, B, D等）
        if (roomId && roomId.includes('-')) {
          roomId = roomId.split('-')[0];
        }
        
        // 如果没有找到配置，回退到操作仿真
        if (!INITIAL_CAMERA_POSITIONS[roomId]) {
          roomId = 'simulation';
        }
      }
      
      console.log('复原视角，当前模式:', roomId);
      
      // 获取对应楼座的初始相机位置
      const cameraConfig = INITIAL_CAMERA_POSITIONS[roomId];
      
      if (!cameraConfig) {
        console.warn('未找到初始相机配置:', roomId);
        return;
      }
      
      // 隐藏所有详情面板
      EventBus.$emit('showBox', { show: false });
      EventBus.$emit('showCircuit', { show: false });
      
      // 清除柜子高亮
      EventBus.$emit('clearCabinetHighlight');
      
      // 飞行到初始位置
      if (window.app && window.app.flyTo) {
        window.app.flyTo({
          position: cameraConfig.position,
          controls: cameraConfig.controls,
          duration: 1000,
          done: () => {
            console.log('视角已复原到', roomId, '座初始位置');
          }
        });
      }
    }
  },
  mounted() {
    // 监听进入配电室事件，显示按钮
    EventBus.$on('enterPowerRoom', (roomId) => {
      this.visible = true;
      this.currentRoomId = roomId;
    });
    
    // 监听离开配电室事件，隐藏按钮
    EventBus.$on('leavePowerRoom', () => {
      this.visible = false;
    });
    
    // 监听房间变更
    EventBus.$on('roomChanged', (data) => {
      if (data && data.roomId) {
        this.currentRoomId = data.roomId;
        this.visible = ['A', 'B', 'D'].includes(this.currentRoomId);
      }
    });
    
    // 初始化检查当前房间
    setTimeout(() => {
      const roomId = window.app ? window.app.activeRoomId || 'A' : 'A';
      this.currentRoomId = roomId;
      // 只有在配电室模型可见时才显示按钮
      if (window.app) {
        const inPowerRoom = (window.app.aRoomModel && window.app.aRoomModel.visible) ||
                           (window.app.bRoomModel && window.app.bRoomModel.visible) ||
                           (window.app.dRoomModel && window.app.dRoomModel.visible);
        this.visible = inPowerRoom;
      }
    }, 500);
  },
  beforeDestroy() {
    EventBus.$off('enterPowerRoom');
    EventBus.$off('leavePowerRoom');
    EventBus.$off('roomChanged');
  }
}
</script>

<style lang="less" scoped>
.reset-view-button {
  position: fixed;
  top: 300px; // 位置在培训模式按钮下方
  right: 20px;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 80px;
  background: rgba(0, 42, 75, 0.7);
  border: 1px solid #faad14; // 使用橙色边框
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 58, 102, 0.9);
    transform: scale(1.05);
    border-color: #ffc53d;
  }
  
  .reset-icon {
    width: 32px;
    height: 32px;
    margin-bottom: 5px;
    background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzJweCIgaGVpZ2h0PSIzMnB4IiB2aWV3Qm94PSIwIDAgMzIgMzIiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cmVjdCBzdHJva2U9IiNmYWFkMTQiIHN0cm9rZS13aWR0aD0iMS41IiB4PSIzIiB5PSIzIiB3aWR0aD0iMjYiIGhlaWdodD0iMjYiIHJ4PSIyIj48L3JlY3Q+PHBhdGggZD0iTTkgMTJDOS41IDkgMTIuNSA3IDE2IDdDMjAuNSA3IDI0IDEwLjUgMjQgMTVDMjQgMTkuNSAyMC41IDIzIDE2IDIzQzEzIDIzIDEwLjUgMjEuNSA5IDE5IiBzdHJva2U9IiNmYWFkMTQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBmaWxsPSJub25lIj48L3BhdGg+PHBhdGggZD0iTTkgN0w5IDEyTDE0IDEyIiBzdHJva2U9IiNmYWFkMTQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBmaWxsPSJub25lIj48L3BhdGg+PGNpcmNsZSBmaWxsPSIjZmFhZDE0IiBjeD0iMTYiIGN5PSIxNSIgcj0iMiI+PC9jaXJjbGU+PC9nPjwvc3ZnPg==');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }
  
  span {
    color: #ffe58f;
    font-size: 14px;
    text-align: center;
  }
}
</style>
