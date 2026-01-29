<template>
  <div class="circuit" v-if="visible" @click.stop="handleContainerClick">
    <div class="circuit-header">
      <h2>电路图</h2>
      <div class="close-button" @click="hideCircuit">×</div>
    </div>
    <div class="circuit-background"></div>
    <div class="circuit-content">
      <div class="circuit-diagram">
        <!-- 线路图显示区域 -->
        <div class="circuit-container">
          <!-- 主电源节点 -->
          <div v-for="device in currentConfig.deviceList" :key="device.id" class="circuit-node main-node">
            <div class="node-content" :class="{ 'connected': device.connected }" @click="toggleDeviceConnection(device)">
              <div class="node-title">{{ device.title }}</div>
              <div class="connection-toggle">
                <div class="node-indicator" :class="{ 'connected': device.connected }"></div>
                <span class="connection-status">{{ device.connected ? '已接通' : '已断开' }}</span>
                <div v-if="device.isParent" class="expand-toggle" @click.stop="toggleExpand(device)">
                  {{ device.expanded !== false ? '收起' : '展开' }}
                </div>
              </div>
            </div>
            
            <!-- 一级子节点 -->
            <div class="children-container" v-if="device.isParent && device.children && device.children.length > 0 && device.expanded !== false">
              <div class="level-label">一级支路</div>
              <div class="branches-container">
                <div v-for="child in device.children" :key="child.id" class="circuit-branch">
                  <div class="circuit-line" :class="{ 'connected': child.connected && device.connected }"></div>
                  <div class="circuit-node child-node">
                    <div class="node-content" 
                         :class="{ 
                           'connected': child.connected && device.connected, 
                           'disabled': !device.connected,
                           'partially-connected': child.connected && !device.connected
                         }" 
                         @click="toggleDeviceConnection(child)">
                      <div class="node-title">{{ child.title }}</div>
                      <div class="connection-toggle">
                        <div class="node-indicator" :class="{ 
                          'connected': child.connected && device.connected,
                          'partially-connected': child.connected && !device.connected
                        }"></div>
                        <span class="connection-status">
                          <template v-if="!device.connected && child.connected">等待上级供电</template>
                          <template v-else>{{ child.connected ? '已接通' : '已断开' }}</template>
                        </span>
                        <div v-if="child.isParent" class="expand-toggle" @click.stop="toggleExpand(child)">
                          {{ child.expanded ? '收起' : '展开' }}
                        </div>
                      </div>
                    </div>
                    
                    <!-- 二级子节点 -->
                    <div class="children-container secondary" v-if="child.isParent && child.children && child.children.length > 0 && child.expanded">
                      <div class="level-label">二级支路</div>
                      <div class="branches-container">
                        <div v-for="grandchild in child.children" :key="grandchild.id" class="circuit-branch secondary">
                          <div class="circuit-line secondary" :class="{ 'connected': grandchild.connected && child.connected && device.connected }"></div>
                          <div class="circuit-node grandchild-node">
                            <div class="node-content" 
                                 :class="{ 
                                   'connected': grandchild.connected && child.connected && device.connected, 
                                   'end-device': grandchild.isEndDevice,
                                   'disabled': !child.connected || !device.connected,
                                   'partially-connected': grandchild.connected && (!child.connected || !device.connected)
                                 }" 
                                 @click="toggleDeviceConnection(grandchild)">
                              <div class="node-title">{{ grandchild.title }}</div>
                              <div class="connection-toggle">
                                <div class="node-indicator" :class="{ 
                                  'connected': grandchild.connected && child.connected && device.connected,
                                  'partially-connected': grandchild.connected && (!child.connected || !device.connected)
                                }"></div>
                                <span class="connection-status">
                                  <template v-if="(!child.connected || !device.connected) && grandchild.connected">等待上级供电</template>
                                  <template v-else>{{ grandchild.connected ? '已接通' : '已断开' }}</template>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 断电顺序提示 -->
      <div class="circuit-operation-guide">
        <div class="guide-title">断电操作顺序</div>
        <div class="guide-steps">
          <div class="guide-step">
            <div class="step-number">1</div>
            <div class="step-content">先断开终端设备（负载侧）</div>
          </div>
          <div class="guide-step">
            <div class="step-number">2</div>
            <div class="step-content">再断开分支线路</div>
          </div>
          <div class="guide-step">
            <div class="step-number">3</div>
            <div class="step-content">最后断开主电源</div>
          </div>
        </div>
      </div>
      
      <div class="circuit-description" v-if="currentConfig.description">
        {{ currentConfig.description }}
      </div>
    </div>
  </div>
</template>

<script>
import EventBus from '@/bus';

export default {
  name: 'circuit',
  components: {},
  props: {},
  data() {
    return {
      visible: false,
      currentConfig: null,
      deviceIdMap: {}
    };
  },
  methods: {
    handleContainerClick(event) {
      console.log('电路图内部点击，阻止冒泡');
      event.stopPropagation();
    },
    // 预处理配置数据，添加初始展开状态
    preprocessConfig(config) {
      if (!config) return null;
      
      const configCopy = JSON.parse(JSON.stringify(config));
      
      // 递归添加expanded属性，但保留connected状态
      const addExpandedProperty = (devices) => {
        for (const device of devices) {
          if (device.isParent) {
            // 为main-power设置默认展开
            if (device.id === 'main-power') {
              device.expanded = true; // 默认展开
            } else {
              device.expanded = false; // 默认折叠
            }
            
            if (device.children && device.children.length > 0) {
              addExpandedProperty(device.children);
            }
          }
        }
      };
      
      if (configCopy.deviceList && configCopy.deviceList.length > 0) {
        addExpandedProperty(configCopy.deviceList);
        
        // 生成并记录设备ID映射表，便于调试
        this.generateDeviceIdMap(configCopy.deviceList);
      }
      
      return configCopy;
    },
    
    // 新增：生成设备ID映射表
    generateDeviceIdMap(devices, prefix = '') {
      console.log('生成线路图设备ID映射表:');
      const idMap = {};
      
      const collectIds = (deviceList, path = '') => {
        for (const device of deviceList) {
          const currentPath = path ? `${path} > ${device.title}` : device.title;
          idMap[device.id] = {
            title: device.title,
            path: currentPath
          };
          
          // 输出每个设备的ID和路径
          console.log(`设备: ${device.id} - ${currentPath}`);
          
          if (device.children && device.children.length > 0) {
            collectIds(device.children, currentPath);
          }
        }
      };
      
      collectIds(devices);
      console.log('设备ID映射表完成，总计设备数:', Object.keys(idMap).length);
      
      // 存储映射表以供将来使用
      this.deviceIdMap = idMap;
    },
    hideCircuit() {
      this.visible = false;
      EventBus.$emit('showCircuit', { show: false });
    },
    // 切换设备的连接状态
    toggleDeviceConnection(device) {
      console.log('切换设备连接状态:', device.id, device.title);
      
      // 反转连接状态
      const newStatus = !device.connected;
      device.connected = newStatus;
      
      // 如果是父设备断开，则递归断开所有子设备的实际供电状态
      if (device.isParent && device.children && device.children.length > 0) {
        this.updateChildrenConnectionStatus(device);
      }
      
      // 更新父设备的状态
      this.updateParentConnectionStatus();
      
      // 触发事件通知其他组件
      EventBus.$emit('updateCircuitConnection', { 
        deviceId: device.id, 
        status: device.connected 
      });
      
      // 触发设备操作事件，与操作面板视频状态同步
      // 注意：这里的事件名和参数需要与操作面板组件中的事件监听保持一致
      EventBus.$emit('deviceOperation', {
        deviceId: device.id,
        operation: newStatus ? 'open' : 'close' // 根据新状态发送对应的操作
      });
      
      // 新方式：先确保Box组件显示，再发送高亮事件
      // 获取当前活动的房间ID，用于确定应该加载哪个boxConfig
      const activeRoomId = window.app ? window.app.activeRoomId || 'A' : 'A';
      console.log('当前活动房间:', activeRoomId);
      
      // 查找设备所属的配置组
      let configInfo = this.findDeviceConfigGroup(device.id, device.title);
      console.log('设备所属配置组:', configInfo);
      
      // 获取对应区域的配置
      const areaConfig = window.boxConfig && window.boxConfig[configInfo.area];
      
      // 检查是否有特定组的配置
      let selectedConfig = null;
      
      if (configInfo.groupId && areaConfig && areaConfig[configInfo.groupId]) {
        // 如果有指定组的配置，优先使用
        selectedConfig = areaConfig[configInfo.groupId];
        console.log(`使用${configInfo.area}区${configInfo.groupId}组配置`);
      } else if (configInfo.useSpecial) {
        // 特殊处理逻辑
        if (device.id === '15AL7-2' && areaConfig && areaConfig.eastElevatorConfig) {
          selectedConfig = areaConfig.eastElevatorConfig;
          console.log('使用特殊电梯配置');
        } else if (device.id === '15AL9-1' && areaConfig && areaConfig.waterHeaterConfig) {
          selectedConfig = areaConfig.waterHeaterConfig;
          console.log('使用特殊热水器配置');
        }
      }
      
      // 如果没找到特定配置，使用区域默认配置
      if (!selectedConfig && areaConfig && areaConfig.main) {
        selectedConfig = areaConfig.main;
        console.log(`使用${configInfo.area}区默认配置`);
      }
      
      // 检查floorManage.js中是否有相关配置
      const showBoxAndHighlight = () => {
        if (!selectedConfig) {
          console.error('未找到适合的Box配置，无法显示Box组件');
          return;
        }
        
        // 先显示Box组件
        EventBus.$emit('showBox', { 
          show: true, 
          config: selectedConfig
        });
        
        // 延迟一小段时间后发送高亮事件，确保Box组件已完成渲染
        setTimeout(() => {
          EventBus.$emit('highlightBoxGroup', {
            deviceId: device.id,
            title: device.title,
            status: device.connected
          });
        }, 200);
      };
      
      // 执行显示和高亮
      showBoxAndHighlight();
      
      // 如果是线路图尝试触发ID为15AL9-1的东侧电热开水器，特殊处理
      if (device.id === '15AL9-1' || (device.title && device.title.includes('东侧电热开水器'))) {
        console.log('检测到特定设备操作，尝试直接匹配东侧电热开水器设备');
        // 延迟发送特殊设备操作事件，确保Box组件已准备好
        setTimeout(() => {
          EventBus.$emit('specialDeviceOperation', {
            deviceId: '15AL9-1',
            title: '东侧电热开水器电源',
            status: device.connected,
            sourceComponent: 'circuit'
          });
        }, 300);
      }
      
      // 添加对15AL7-2的特殊处理
      if (device.id === '15AL7-2' || (device.title && device.title.includes('东侧电梯'))) {
        console.log('检测到东侧电梯操作，尝试直接匹配东侧电梯设备');
        // 延迟发送特殊设备操作事件，确保Box组件已准备好
        setTimeout(() => {
          EventBus.$emit('specialDeviceOperation', {
            deviceId: '15AL7-2',
            title: '东侧电梯(备)',
            status: device.connected,
            sourceComponent: 'circuit'
          });
        }, 300);
      }
    },
    // 新增：查找设备所属的配置组
    findDeviceConfigGroup(deviceId, deviceTitle) {
      // 根据设备ID或标题判断设备属于哪个配置组
      console.log('查找设备所属配置组:', deviceId, deviceTitle);
      
      // 解析ID前缀，获取设备组ID
      const getGroupId = (id) => {
        // 如果是形如15AL7-2的格式，提取15AL7作为组ID
        const match = id.match(/^(\d+[A-Z]L\d+)-\d+$/);
        if (match && match[1]) {
          return match[1]; // 返回15AL7这样的组ID
        }
        return id;
      };
      
      // 尝试获取设备组ID
      const groupId = getGroupId(deviceId);
      console.log('解析出的设备组ID:', groupId);
      
      // 根据前缀判断区域
      if (deviceId.startsWith('A-') || 
          deviceId === 'main-power' || 
          deviceId.includes('AL')) {
        // 特殊处理某些设备
        if (deviceId === '15AL7-2' || (deviceTitle && deviceTitle.includes('东侧电梯'))) {
          console.log('特殊处理东侧电梯设备，使用15AL7配置组');
          return {
            area: 'A',
            groupId: '15AL7', // 使用电梯所在的组ID
            useSpecial: true
          };
        }
        else if (deviceId === '15AL9-1' || (deviceTitle && deviceTitle.includes('东侧电热开水器'))) {
          console.log('特殊处理东侧电热开水器设备，使用15AL9配置组');
          return {
            area: 'A',
            groupId: '15AL9',
            useSpecial: true
          };
        }
        
        console.log('设备属于A区，组ID:', groupId);
        return {
          area: 'A',
          groupId: groupId
        };
      } else if (deviceId.startsWith('B-') || 
                deviceId === 'main-power-b' || 
                deviceId.includes('BL')) {
        console.log('设备属于B区，组ID:', groupId);
        return {
          area: 'B',
          groupId: groupId
        };
      } else if (deviceId.startsWith('D-') || 
                deviceId === 'main-power-d' || 
                deviceId.includes('DL')) {
        console.log('设备属于D区，组ID:', groupId);
        return {
          area: 'D',
          groupId: groupId
        };
      }
      
      // 如果通过ID无法判断，尝试通过标题判断
      if (deviceTitle) {
        if (deviceTitle.includes('A区')) {
          return {
            area: 'A',
            groupId: null
          };
        } else if (deviceTitle.includes('B区')) {
          return {
            area: 'B',
            groupId: null
          };
        } else if (deviceTitle.includes('D区')) {
          return {
            area: 'D',
            groupId: null
          };
        }
      }
      
      // 默认返回当前活动房间
      const defaultArea = window.app && window.app.activeRoomId ? window.app.activeRoomId : 'A';
      console.log('无法确定设备所属区域，默认使用:', defaultArea);
      return {
        area: defaultArea,
        groupId: null
      };
    },
    // 仅切换设备的展开/折叠状态
    toggleExpand(device) {
      console.log('切换设备展开状态:', device.id, device.title);
      if (device.isParent) {
        // Vue响应式处理：如果expanded属性不存在，添加它
        if (!device.hasOwnProperty('expanded')) {
          this.$set(device, 'expanded', true);
        } else {
          device.expanded = !device.expanded;
        }
      }
    },
    // 递归更新子设备的连接状态
    updateChildrenConnectionStatus(parentDevice) {
      if (!parentDevice.isParent || !parentDevice.children) return;
      
      for (const child of parentDevice.children) {
        // 不改变子设备的connected属性，只是在UI上根据父设备状态显示
        
        if (child.isParent && child.children && child.children.length > 0) {
          this.updateChildrenConnectionStatus(child);
        }
      }
    },
    // 更新所有父设备的连接状态
    updateParentConnectionStatus() {
      if (!this.currentConfig || !this.currentConfig.deviceList) return;
      
      const updateParent = (devices) => {
        for (const device of devices) {
          if (device.isParent && device.children && device.children.length > 0) {
            // 如果有任何子设备连接，父设备就连接
            // 但这只影响父设备自身的connected属性，不影响子设备的实际供电状态
            device.connected = device.children.some(child => child.connected);
            
            // 递归更新子设备
            updateParent(device.children);
          }
        }
      };
      
      // 不对主电源应用此规则，主电源状态由用户直接控制
      for (const mainDevice of this.currentConfig.deviceList) {
        if (mainDevice.children) {
          updateParent(mainDevice.children);
        }
      }
    },
    // 递归处理设备连接状态（外部事件触发）
    updateConnectionStatus(deviceId, status) {
      if (!this.currentConfig || !this.currentConfig.deviceList) return;
      
      // 递归查找设备并更新状态
      const updateDevice = (devices) => {
        for (const device of devices) {
          if (device.id === deviceId) {
            device.connected = status;
            
            // 如果是父设备，更新子设备的状态
            if (device.isParent && device.children && device.children.length > 0) {
              this.updateChildrenConnectionStatus(device);
            }
            
            return true;
          }
          
          if (device.children && device.children.length > 0) {
            if (updateDevice(device.children)) {
              return true;
            }
          }
        }
        return false;
      };
      
      updateDevice(this.currentConfig.deviceList);
      
      // 更新父设备的状态
      this.updateParentConnectionStatus();
    },
    // 高亮指定节点
    highlightNode(device) {
      // 查找对应的DOM元素
      let nodeElement = null;
      
      // 递归查找所有节点
      const searchAllNodes = () => {
        const allNodes = document.querySelectorAll('.node-content');
        for (let i = 0; i < allNodes.length; i++) {
          const node = allNodes[i];
          const title = node.querySelector('.node-title');
          if (title && title.textContent === device.title) {
            nodeElement = node;
            break;
          }
        }
      };
      
      searchAllNodes();
      
      if (nodeElement) {
        // 添加高亮CSS类
        nodeElement.classList.add('highlight-node');
        
        // 确保节点在视野内
        nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // 2秒后移除高亮效果
        setTimeout(() => {
          nodeElement.classList.remove('highlight-node');
        }, 2000);
      }
    }
  },
  mounted() {
    // 监听显示/隐藏事件
    console.log('电路图组件已挂载');

    // 先移除可能存在的事件监听，避免重复
    EventBus.$off('showCircuit');
    
    EventBus.$on('showCircuit', ({ show, config }) => {
      console.log('收到showCircuit事件', show, config);
      
      if (show) {
        if (config) {
          // 处理配置数据，添加展开/折叠状态
          this.currentConfig = this.preprocessConfig(config);
          this.visible = true;
        } else {
          console.error('电路图配置为空，无法显示');
          EventBus.$emit('showErrorMessage', '电路图配置加载失败');
        }
      } else {
        this.visible = false;
      }
    });
    
    // 先移除可能存在的事件监听，避免重复
    EventBus.$off('updateCircuitConnection');
    
    // 监听设备连接状态更新事件
    EventBus.$on('updateCircuitConnection', ({ deviceId, status }) => {
      console.log('收到更新连接状态事件', deviceId, status);
      this.updateConnectionStatus(deviceId, status);
    });
    
    // 监听重置所有连接状态的事件
    EventBus.$on('resetCircuitConnections', () => {
      console.log('重置所有电路连接状态');
      if (this.currentConfig && this.currentConfig.deviceList) {
        // 递归重置所有设备的连接状态
        const resetConnections = (devices) => {
          for (const device of devices) {
            // 保留主电源的连接状态
            if (device.id !== 'main-power' && 
                device.id !== 'main-power-b' && 
                device.id !== 'main-power-d') {
              device.connected = false;
            }
            
            if (device.children && device.children.length > 0) {
              resetConnections(device.children);
            }
          }
        };
        
        resetConnections(this.currentConfig.deviceList);
      }
    });
    
    // 监听来自操作面板的设备操作事件
    EventBus.$off('deviceOperationFromPanel');
    EventBus.$on('deviceOperationFromPanel', ({ deviceId, operation }) => {
      console.log('收到操作面板设备操作事件:', deviceId, operation);
      
      // 根据操作类型更新电路图中的设备状态
      const status = operation === 'open'; // open对应true，close对应false
      
      // 更新设备状态
      this.updateConnectionStatus(deviceId, status);
    });
    
    // 新增：监听来自Box的高亮请求
    EventBus.$off('highlightCircuitNode');
    EventBus.$on('highlightCircuitNode', ({ deviceId, title, status }) => {
      console.log('收到高亮线路图节点请求:', deviceId, title, status);
      
      if (!this.visible || !this.currentConfig) {
        console.warn('线路图未显示或配置为空，无法高亮节点:', deviceId);
        return;
      }
      
      console.log('线路图设备列表:', JSON.stringify(this.currentConfig.deviceList.map(d => ({id: d.id, title: d.title}))));
      
      // 查找对应设备节点
      const findNode = (devices) => {
        for (const device of devices) {
          console.log('比较设备:', device.id, deviceId, device.title, title);
          
          if (device.id === deviceId) {
            // 找到匹配设备，应用高亮效果
            console.log('通过ID找到匹配设备:', device.id, device.title);
            this.$nextTick(() => {
              this.highlightNode(device);
            });
            return true;
          }
          
          // 如果ID没匹配，尝试通过标题匹配
          if (device.title && title && device.title.includes(title)) {
            console.log('通过标题找到匹配设备:', device.id, device.title);
            // 记录ID映射关系，便于调试
            console.log(`ID映射: Box ID "${deviceId}" -> 线路图ID "${device.id}"`);
            this.$nextTick(() => {
              this.highlightNode(device);
            });
            return true;
          }
          
          if (device.children && device.children.length > 0) {
            if (findNode(device.children)) {
              return true;
            }
          }
        }
        return false;
      };
      
      if (this.currentConfig.deviceList) {
        if (!findNode(this.currentConfig.deviceList)) {
          console.error(`未在线路图中找到设备 ID: ${deviceId}, 标题: ${title}`);
        }
      }
    });

    // 新增：监听请求获取设备状态的事件
    EventBus.$off('requestCircuitStatus');
    EventBus.$on('requestCircuitStatus', ({ callback }) => {
      console.log('收到获取电路状态请求');
      
      if (!this.currentConfig || !this.currentConfig.deviceList) {
        console.warn('电路图未初始化或设备列表为空，无法提供状态');
        if (typeof callback === 'function') {
          callback(null);
        }
        return;
      }
      
      // 构建设备状态映射
      const deviceStatusMap = {};
      
      // 递归收集所有设备状态
      const collectDeviceStatus = (devices) => {
        for (const device of devices) {
          // 记录ID和连接状态
          deviceStatusMap[device.id] = device.connected;
          
          // 同时记录标题，便于模糊匹配
          if (device.title) {
            deviceStatusMap[device.id] = {
              id: device.id,
              title: device.title,
              status: device.connected,
              isParent: !!device.isParent
            };
          }
          
          // 递归处理子设备
          if (device.children && device.children.length > 0) {
            collectDeviceStatus(device.children);
          }
        }
      };
      
      collectDeviceStatus(this.currentConfig.deviceList);
      console.log('设备状态映射:', deviceStatusMap);
      
      // 通过回调返回状态映射
      if (typeof callback === 'function') {
        callback(deviceStatusMap);
      }
    });
  },
  beforeDestroy() {
    // 组件销毁前移除事件监听
    EventBus.$off('showCircuit');
    EventBus.$off('updateCircuitConnection');
    EventBus.$off('resetCircuitConnections');
    EventBus.$off('deviceOperationFromPanel');
    EventBus.$off('highlightCircuitNode'); // 新增：移除highlightCircuitNode事件监听
    EventBus.$off('requestCircuitStatus'); // 新增：移除requestCircuitStatus事件监听
  }
};
</script>

<style scoped>
.circuit {
  position: fixed;
  top: 120px;
  right: 90px;
  width: 650px; /* 增加宽度以适应更多信息 */
  height: auto;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  animation: fadeIn 0.3s ease-in-out;
  z-index: 1000;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}

.circuit-header {
  width: 100%;
  height: 60px;
  background: url('~@/assets/image/header.png') no-repeat center center;
  background-size: 100% 100%;
  text-align: center;
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: center;
}

.circuit-header h2 {
  color: #bde4ff;
  font-size: 24px;
  line-height: 60px;
  letter-spacing: 5px;
  margin: 0;
  text-shadow: 0 0 10px #4dc4ff;
}

.close-button {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #bde4ff;
  font-size: 24px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-button:hover {
  background-color: rgba(189, 228, 255, 0.2);
  box-shadow: 0 0 10px rgba(77, 196, 255, 0.5);
}

.circuit-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('~@/assets/image/card_bg.png');
  background-size: cover;
  background-position: center;
  z-index: -1;
  box-shadow: 0 0 20px rgba(77, 196, 255, 0.5);
  border: 1px solid rgba(77, 196, 255, 0.7);
}

.circuit-content {
  position: relative;
  padding: 20px;
  overflow-y: auto;
  max-height: calc(80vh - 60px);
  z-index: 2;
  scroll-behavior: smooth;
}

/* 自定义滚动条 */
.circuit-content::-webkit-scrollbar {
  width: 6px;
}

.circuit-content::-webkit-scrollbar-track {
  background: rgba(12, 29, 47, 0.5);
}

.circuit-content::-webkit-scrollbar-thumb {
  background: rgba(77, 196, 255, 0.5);
  border-radius: 3px;
}

.circuit-content::-webkit-scrollbar-thumb:hover {
  background: rgba(77, 196, 255, 0.8);
}

/* 线路图样式 */
.circuit-diagram {
  width: 100%;
  padding: 20px 0;
}

.circuit-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.circuit-node {
  position: relative;
  margin: 10px 0;
  z-index: 2;
  width: 100%;
}

.node-content {
  padding: 12px 15px;
  background-color: rgba(12, 29, 47, 0.7);
  border: 1px solid rgba(189, 228, 255, 0.3);
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 180px;
}

.node-content:hover {
  background-color: rgba(18, 40, 64, 0.8);
  border-color: rgba(189, 228, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(77, 196, 255, 0.3);
}

.node-content.connected {
  background-color: rgba(18, 45, 70, 0.8);
  border-color: rgba(189, 228, 255, 0.7);
  box-shadow: 0 0 15px rgba(77, 196, 255, 0.4);
}

/* 禁用状态 */
.node-content.disabled {
  opacity: 0.7;
  cursor: pointer;
}

/* 部分连接状态（等待上级供电） */
.node-content.partially-connected {
  background-color: rgba(70, 45, 18, 0.8);
  border-color: rgba(255, 189, 77, 0.7);
}

.node-content.partially-connected:hover {
  background-color: rgba(80, 50, 20, 0.9);
}

/* 终端设备样式 */
.node-content.end-device {
  background-color: rgba(25, 35, 55, 0.8);
  border: 1px dashed rgba(189, 228, 255, 0.5);
}

.node-content.end-device:hover {
  background-color: rgba(30, 45, 70, 0.9);
  border-color: rgba(189, 228, 255, 0.8);
}

.node-content.end-device.connected {
  background-color: rgba(22, 55, 85, 0.9);
  border-style: solid;
}

.node-title {
  color: #bde4ff;
  font-size: 16px;
  flex: 1;
}

.connection-toggle {
  display: flex;
  align-items: center;
}

.connection-status {
  color: #bde4ff;
  font-size: 14px;
  margin-left: 8px;
  min-width: 80px;
  text-align: center;
}

.expand-toggle {
  color: #4dc4ff;
  font-size: 14px;
  margin-left: 15px;
  padding: 3px 8px;
  border: 1px solid rgba(77, 196, 255, 0.5);
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.expand-toggle:hover {
  background-color: rgba(77, 196, 255, 0.2);
}

.node-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #ff4d4f;
  box-shadow: 0 0 5px #ff4d4f;
  transition: all 0.5s ease;
}

.node-indicator.connected {
  background-color: #52c41a;
  box-shadow: 0 0 10px #52c41a;
  animation: pulse 1.5s infinite;
}

.node-indicator.partially-connected {
  background-color: #faad14;
  box-shadow: 0 0 10px #faad14;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 5px currentColor; }
  50% { box-shadow: 0 0 15px currentColor; }
  100% { box-shadow: 0 0 5px currentColor; }
}

/* 主节点样式 */
.main-node {
  margin-bottom: 30px;
}

.main-node .node-content {
  background-color: rgba(22, 55, 85, 0.9);
  border-color: rgba(189, 228, 255, 0.7);
  min-width: 200px;
}

/* 子节点容器 */
.children-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 30px;
  position: relative;
  width: 100%;
}

.level-label {
  position: absolute;
  top: -20px;
  left: 0;
  color: #4dc4ff;
  font-size: 14px;
  background-color: rgba(12, 29, 47, 0.7);
  padding: 2px 8px;
  border-radius: 3px;
  border: 1px solid rgba(77, 196, 255, 0.3);
}

.branches-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
}

/* 分支样式 */
.circuit-branch {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 15px;
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 300px;
}

/* 连接线样式 */
.circuit-line {
  width: 2px;
  height: 30px;
  background-color: rgba(189, 228, 255, 0.3);
  position: relative;
  transition: all 0.5s ease;
}

.circuit-line.connected {
  background-color: #52c41a;
  box-shadow: 0 0 10px #52c41a;
}

/* 二级子节点样式 */
.children-container.secondary {
  margin-top: 30px;
}

.circuit-branch.secondary {
  margin: 0 10px;
  min-width: 150px;
}

.circuit-line.secondary {
  height: 20px;
}

.grandchild-node .node-content {
  min-width: 150px;
  font-size: 14px;
  padding: 8px 12px;
}

/* 断电顺序指南 */
.circuit-operation-guide {
  margin: 20px 0;
  padding: 15px;
  background-color: rgba(12, 29, 47, 0.7);
  border: 1px solid rgba(189, 228, 255, 0.5);
  border-radius: 5px;
}

.guide-title {
  color: #4dc4ff;
  font-size: 18px;
  text-align: center;
  margin-bottom: 15px;
  font-weight: bold;
}

.guide-steps {
  display: flex;
  justify-content: space-around;
}

.guide-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 30%;
}

.step-number {
  width: 30px;
  height: 30px;
  background-color: rgba(77, 196, 255, 0.2);
  border: 2px solid #4dc4ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bde4ff;
  font-weight: bold;
  margin-bottom: 10px;
}

.step-content {
  color: #bde4ff;
  text-align: center;
  font-size: 14px;
  line-height: 1.4;
}

.circuit-description {
  margin-top: 15px;
  padding: 10px;
  border-top: 1px solid rgba(189, 228, 255, 0.3);
  background-color: rgba(12, 29, 47, 0.5);
  border-radius: 4px;
  font-size: 14px;
  color: #bde4ff;
  line-height: 1.4;
  text-align: center;
}

/* 节点高亮样式 */
.highlight-node {
  animation: node-highlight 2s ease-in-out;
  position: relative;
  box-shadow: 0 0 20px rgba(82, 196, 26, 0.8);
  border-color: rgba(82, 196, 26, 0.8) !important;
  transform: translateY(-2px);
  z-index: 100;
}

@keyframes node-highlight {
  0% { box-shadow: 0 0 10px rgba(82, 196, 26, 0.5); }
  50% { box-shadow: 0 0 20px rgba(82, 196, 26, 0.9); }
  100% { box-shadow: 0 0 10px rgba(82, 196, 26, 0.5); }
}
</style> 