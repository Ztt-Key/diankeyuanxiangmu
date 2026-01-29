<template>
  <div class="circuit-training" v-if="visible" @click.stop="handleContainerClick">
    <!-- 操作前准备对话框 -->
    <div class="preparation-dialog" v-if="showPreparationDialog && !trainingCompleted">
      <div class="dialog-content">
        <h3>操作前准备</h3>
        <div class="preparation-steps">
          <div class="step">
            <div class="step-icon safety"></div>
            <div class="step-text">穿戴绝缘手套、护目镜等 PPE，检查工具绝缘性</div>
          </div>
          <div class="step">
            <div class="step-icon check"></div>
            <div class="step-text">核对操作票内容，确认需断电的回路及设备</div>
          </div>
        </div>
        <div class="training-mode-selection">
          <h4>请选择培训模式：</h4>
          <div class="mode-options">
            <div class="mode-option" 
                 :class="{ 'selected': selectedMode === 'powerOn' }"
                 @click="selectedMode = 'powerOn'">
              <div class="mode-icon power-on"></div>
              <div class="mode-label">送电培训</div>
              <div class="mode-description">学习正确的送电顺序：先接通主电源，再接通负载设备</div>
            </div>
            <div class="mode-option" 
                 :class="{ 'selected': selectedMode === 'powerOff' }"
                 @click="selectedMode = 'powerOff'">
              <div class="mode-icon power-off"></div>
              <div class="mode-label">断电培训</div>
              <div class="mode-description">学习正确的断电顺序：先断开负载设备，再断开主电源</div>
            </div>
          </div>
        </div>
        <div class="dialog-buttons">
          <button class="dialog-button cancel" @click="cancelTraining">取消</button>
          <button class="dialog-button confirm" @click="confirmPreparation" :disabled="!selectedMode">开始培训</button>
        </div>
      </div>
    </div>

    <!-- 操作错误提示对话框 -->
    <div class="error-dialog" v-if="errorDialogVisible && !trainingCompleted">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>操作提示</h3>
          <div class="close-icon" @click="closeErrorDialog">×</div>
        </div>
        <div class="error-message">
          <div class="error-icon"></div>
          <div class="error-text">{{ errorMessage }}</div>
        </div>
        <div class="correct-operation">
          <h4>正确的操作顺序：</h4>
          <div class="operation-steps">
            <template v-if="trainingMode === 'powerOn'">
              <p>1. 先接通主电源</p>
              <p>2. 再接通负载设备</p>
            </template>
            <template v-else>
              <p>1. 先断开负载设备</p>
              <p>2. 再断开主电源</p>
            </template>
          </div>
        </div>
        <div class="dialog-buttons">
          <button class="dialog-button confirm" @click="closeErrorDialog">我知道了</button>
        </div>
      </div>
    </div>

    <!-- 培训完成状态 - 当培训完成时，这是唯一显示的部分 -->
    <div class="training-completion-overlay" v-if="trainingCompleted">
      <div class="training-completion">
        <div class="completion-icon"></div>
        <div class="completion-content">
          <div class="completion-title">恭喜！培训完成</div>
          <div class="completion-message">
            您已成功完成所有{{ trainingMode === 'powerOn' ? '送电' : '断电' }}培训任务！
          </div>
          <div class="completion-summary">
            <div class="summary-title">培训总结：</div>
            <div class="summary-content">
              <p>您已掌握了正确的{{ trainingMode === 'powerOn' ? '送电' : '断电' }}顺序</p>
            </div>
          </div>
          <div class="completion-buttons">
            <button class="completion-button restart" @click="resetTraining">重新开始</button>
            <button class="completion-button exit" @click="exitTraining">退出培训</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 以下内容只在培训未完成时显示 -->
    <div v-if="!trainingCompleted">
      <div class="circuit-header">
        <h2>{{ trainingMode === 'powerOn' ? '送电培训' : '断电培训' }}</h2>
        <div class="close-button" @click="hideCircuit">×</div>
      </div>
      <div class="circuit-background"></div>
      <div class="circuit-content">
        <div class="training-status">
          <div class="training-progress">
            <div class="progress-title">培训进度:</div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${progressPercentage}%` }"></div>
            </div>
            <div class="progress-text">{{ completedGroups }}/{{ totalGroups }} 组</div>
          </div>
          <div class="training-mode">
            <div class="mode-label">当前模式:</div>
            <div class="mode-value">{{ trainingMode === 'powerOn' ? '送电培训' : '断电培训' }}</div>
          </div>
        </div>
        
        <div class="training-instruction">
          <div class="instruction-icon" :class="{ 'power-on': trainingMode === 'powerOn', 'power-off': trainingMode === 'powerOff' }"></div>
          <div class="instruction-text">
            <template v-if="trainingMode === 'powerOn'">
              <p>送电顺序: 1. 先接通主电源 → 2. 再接通负载设备</p>
              <p v-if="currentStepMessage">{{ currentStepMessage }}</p>
            </template>
            <template v-else>
              <p>断电顺序: 1. 先断开负载设备 → 2. 再断开主电源</p>
              <p v-if="currentStepMessage">{{ currentStepMessage }}</p>
            </template>
          </div>
        </div>
        
        <div class="circuit-diagram">
          <!-- 线路图显示区域 -->
          <div class="circuit-container">
            <!-- 主电源节点 -->
            <div v-for="device in currentConfig.deviceList" :key="device.id" class="circuit-node main-node">
              <div class="node-content" 
                   :class="{ 
                     'connected': device.connected, 
                     'allowed': isDeviceAllowed(device),
                     'forbidden': !isDeviceAllowed(device),
                     'completed': isDeviceCompleted(device)
                   }" 
                   @click="toggleDeviceConnection(device)">
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
                             'partially-connected': child.connected && !device.connected,
                             'allowed': isDeviceAllowed(child),
                             'forbidden': !isDeviceAllowed(child),
                             'completed': isDeviceCompleted(child)
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
                                     'partially-connected': grandchild.connected && (!child.connected || !device.connected),
                                     'allowed': isDeviceAllowed(grandchild),
                                     'forbidden': !isDeviceAllowed(grandchild),
                                     'completed': isDeviceCompleted(grandchild)
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
        
        <div class="training-feedback" v-if="feedbackMessage">
          <div class="feedback-icon" :class="feedbackType"></div>
          <div class="feedback-message">{{ feedbackMessage }}</div>
        </div>
        
        <div class="training-controls">
          <button class="control-button reset-button" @click="resetTraining">重置培训</button>
          <button class="control-button mode-button" @click="showModeSelectionDialog">
            切换培训模式
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import EventBus from '@/bus';

export default {
  name: 'circuitTraining',
  data() {
    return {
      visible: false,
      currentConfig: null,
      trainingMode: 'powerOn', // 'powerOn' 或 'powerOff'
      groupStatus: {}, // 记录每个组的完成状态
      completedGroups: 0,
      totalGroups: 2, // 假设总共有2组(15AL1和16AL1-1)
      currentStepMessage: '',
      feedbackMessage: '',
      feedbackType: 'info', // 'success', 'error', 'info'
      trainingCompleted: false, // 培训是否完成
      
      // 新增：准备对话框相关
      showPreparationDialog: false,
      selectedMode: null,
      
      // 新增：错误对话框相关
      errorDialogVisible: false,
      errorMessage: '',
    };
  },
  computed: {
    progressPercentage() {
      return (this.completedGroups / this.totalGroups) * 100;
    }
  },
  methods: {
    handleContainerClick(event) {
      // 阻止冒泡，避免点击内部区域时关闭整个组件
      event.stopPropagation();
    },
    
    // 显示或隐藏电路图培训组件
    hideCircuit() {
      this.visible = false;
      EventBus.$emit('endCircuitTraining');
    },
    
    // 新增：显示模式选择对话框
    showModeSelectionDialog() {
      this.selectedMode = this.trainingMode; // 默认选中当前模式
      this.showPreparationDialog = true;
    },
    
    // 新增：确认准备完成，开始培训
    confirmPreparation() {
      if (!this.selectedMode) return;
      
      this.trainingMode = this.selectedMode;
      this.showPreparationDialog = false;
      
      // 重置培训状态
      this.resetTraining();
      
      // 显示开始培训提示
      this.showFeedback(`${this.trainingMode === 'powerOn' ? '送电' : '断电'}培训已开始，请按正确顺序操作`, 'info');
    },
    
    // 新增：取消培训
    cancelTraining() {
      if (this.currentConfig) {
        // 如果是首次显示准备对话框，则关闭整个培训界面
        this.hideCircuit();
      } else {
        // 如果是切换模式，则只关闭对话框
        this.showPreparationDialog = false;
      }
    },
    
    // 新增：显示错误对话框
    showErrorDialog(message) {
      this.errorMessage = message;
      this.errorDialogVisible = true;
    },
    
    // 新增：关闭错误对话框
    closeErrorDialog() {
      this.errorDialogVisible = false;
    },
    
    // 预处理配置数据，添加初始展开状态和培训相关状态
    preprocessConfig(config) {
      if (!config) return null;
      
      const configCopy = JSON.parse(JSON.stringify(config));
      
      // 递归添加expanded属性和其他培训相关属性
      const addTrainingProperties = (devices, parent = null) => {
        for (const device of devices) {
          // 添加培训相关属性
          if (!device.hasOwnProperty('trainingCompleted')) {
            this.$set(device, 'trainingCompleted', false);
          }
          
          // 添加parent属性，用于识别父子关系
          if (parent) {
            this.$set(device, 'parent', parent.id);
          }
          
          if (device.isParent) {
            // 为main-power设置默认展开
            if (device.type === 'main-power') {
              device.expanded = true; // 默认展开
            } else {
              device.expanded = false; // 默认折叠
            }
            
            if (device.children && device.children.length > 0) {
              // 递归处理子设备，传递父设备
              addTrainingProperties(device.children, device);
            }
          }
          
          // 如果设备没有type属性，根据isEndDevice属性设置默认类型
          if (!device.type) {
            if (device.isEndDevice) {
              this.$set(device, 'type', 'equipment');
            } else if (device.isParent) {
              this.$set(device, 'type', 'branch');
            }
          }
        }
      };
      
      // 初始化组状态
      this.groupStatus = {
        '15AL1': { completed: false, mainPowerOn: false, equipmentOn: false },
        '16AL1-1': { completed: false, mainPowerOn: false, equipmentOn: false }
      };
      
      if (configCopy.deviceList && configCopy.deviceList.length > 0) {
        addTrainingProperties(configCopy.deviceList);
        this.updateTrainingStepMessage();
      }
      
      return configCopy;
    },
    
    // 检查设备是否允许操作（用于高亮显示和控制操作）
    isDeviceAllowed(device) {
      const isPowerOn = this.trainingMode === 'powerOn';
      
      // 送电培训逻辑
      if (isPowerOn) {
        // 如果设备已完成培训，不允许再操作
        if (device.trainingCompleted) {
          return false;
        }
        
        // 第一步：允许操作main-power类型的设备
        if (device.type === 'main-power') {
          return true;
        }
        
        // 如果是15AL1组下的设备，检查其主电源是否已接通
        if (this.isDeviceInGroup(device, '15AL1')) {
          // 如果15AL1的主电源已开启，允许操作其子设备
          return this.groupStatus['15AL1'].mainPowerOn;
        }
        
        // 同理处理16AL1-1组
        if (this.isDeviceInGroup(device, '16AL1-1')) {
          return this.groupStatus['16AL1-1'].mainPowerOn;
        }
        
        // 默认不允许操作
        return false;
      }
      // 断电培训逻辑
      else {
        // 如果设备已完成培训，不允许再操作
        if (device.trainingCompleted) {
          return false;
        }
        
        // 先检查设备是否属于15AL1组
        if (this.isDeviceInGroup(device, '15AL1')) {
          // 第一步：允许操作equipment类型的设备
          if (device.type === 'equipment' && device.connected) {
            return true;
          }
          
          // 第二步：只有当该组的所有equipment类型设备都已断开时，才允许操作main-power
          if (device.type === 'main-power' && device.connected) {
            // 检查该组的equipment类型设备是否都已断开
            return !this.hasConnectedEquipment('15AL1');
          }
        }
        
        // 同理处理16AL1-1组
        if (this.isDeviceInGroup(device, '16AL1-1')) {
          if (device.type === 'equipment' && device.connected) {
            return true;
          }
          
          if (device.type === 'main-power' && device.connected) {
            return !this.hasConnectedEquipment('16AL1-1');
          }
        }
        
        // 默认不允许操作
        return false;
      }
    },
    
    // 检查设备是否已完成培训
    isDeviceCompleted(device) {
      return device.trainingCompleted === true;
    },
    
    // 检查设备是否属于指定组
    isDeviceInGroup(device, groupId) {
      // 根据设备ID的前缀判断所属组
      if (device.id === groupId || device.id.startsWith(groupId + '-') || device.id.startsWith(groupId + '/')) {
        return true;
      }
      
      // 递归检查父设备
      if (device.parent) {
        const parent = this.findDeviceById(device.parent);
        if (parent) {
          return this.isDeviceInGroup(parent, groupId);
        }
      }
      
      return false;
    },
    
    // 根据ID查找设备
    findDeviceById(deviceId) {
      // 递归查找设备
      const findDevice = (devices) => {
        for (const device of devices) {
          if (device.id === deviceId) {
            return device;
          }
          
          if (device.children && device.children.length > 0) {
            const found = findDevice(device.children);
            if (found) {
              return found;
            }
          }
        }
        return null;
      };
      
      return this.currentConfig && this.currentConfig.deviceList ? 
        findDevice(this.currentConfig.deviceList) : null;
    },
    
    // 检查指定组中是否有连接的equipment类型设备
    hasConnectedEquipment(groupId) {
      // 递归检查设备及其子设备
      const checkDevices = (devices) => {
        for (const device of devices) {
          // 检查设备是否属于指定组，并且是equipment类型，并且已连接
          if (this.isDeviceInGroup(device, groupId) && 
              device.type === 'equipment' && 
              device.connected) {
            return true;
          }
          
          // 递归检查子设备
          if (device.children && device.children.length > 0) {
            if (checkDevices(device.children)) {
              return true;
            }
          }
        }
        return false;
      };
      
      return this.currentConfig && this.currentConfig.deviceList ? 
        checkDevices(this.currentConfig.deviceList) : false;
    },
    
    // 切换设备的连接状态
    toggleDeviceConnection(device) {
      console.log('切换设备连接状态:', device.id, device.title);
      
      // 检查设备是否允许操作
      const isAllowed = this.isDeviceAllowed(device);
      
      if (!isAllowed) {
        // 根据培训模式和设备类型生成错误消息
        let errorMessage = '';
        
        if (this.trainingMode === 'powerOn') {
          if (device.type === 'equipment') {
            errorMessage = '操作错误：送电时应先接通主电源，再接通负载设备';
          } else {
            errorMessage = '操作错误：请按照正确的送电顺序操作';
          }
        } else {
          if (device.type === 'main-power') {
            errorMessage = '操作错误：断电时应先断开负载设备，再断开主电源';
          } else {
            errorMessage = '操作错误：请按照正确的断电顺序操作';
          }
        }
        
        // 显示错误对话框
        this.errorDialogVisible = true;
        this.errorMessage = errorMessage;
        return;
      }
      
      // 反转连接状态
      const newStatus = !device.connected;
      device.connected = newStatus;
      
      // 更新组状态
      this.updateGroupStatus(device, newStatus);
      
      // 检查培训进度
      this.checkTrainingProgress();
      
      // 更新培训步骤提示
      this.updateTrainingStepMessage();
      
      // 如果是父设备，更新子设备的状态
      if (device.isParent && device.children && device.children.length > 0) {
        this.updateChildrenConnectionStatus(device);
      }
      
      // 发送事件通知其他组件
      EventBus.$emit('deviceOperationFromTraining', {
        deviceId: device.id,
        status: device.connected,
        trainingMode: this.trainingMode
      });
    },
    
    // 更新组状态
    updateGroupStatus(device, status) {
      // 检查设备所属组
      if (this.isDeviceInGroup(device, '15AL1')) {
        if (device.type === 'main-power') {
          this.groupStatus['15AL1'].mainPowerOn = status;
        } else if (device.type === 'equipment') {
          // 更新equipment状态，如果关闭了某些设备，需要重新检查
          this.groupStatus['15AL1'].equipmentOn = this.checkGroupEquipmentStatus('15AL1');
        }
      }
      
      if (this.isDeviceInGroup(device, '16AL1-1')) {
        if (device.type === 'main-power') {
          this.groupStatus['16AL1-1'].mainPowerOn = status;
        } else if (device.type === 'equipment') {
          this.groupStatus['16AL1-1'].equipmentOn = this.checkGroupEquipmentStatus('16AL1-1');
        }
      }
    },
    
    // 检查组内equipment设备状态
    checkGroupEquipmentStatus(groupId) {
      // 递归检查设备及其子设备
      const checkDevices = (devices) => {
        let hasEquipment = false;
        let allConnected = true;
        
        for (const device of devices) {
          if (this.isDeviceInGroup(device, groupId) && device.type === 'equipment') {
            hasEquipment = true;
            if (!device.connected) {
              allConnected = false;
            }
          }
          
          if (device.children && device.children.length > 0) {
            const result = checkDevices(device.children);
            if (result.hasEquipment) {
              hasEquipment = true;
              if (!result.allConnected) {
                allConnected = false;
              }
            }
          }
        }
        
        return { hasEquipment, allConnected };
      };
      
      const result = this.currentConfig && this.currentConfig.deviceList ? 
        checkDevices(this.currentConfig.deviceList) : { hasEquipment: false, allConnected: false };
      
      return result.hasEquipment && result.allConnected;
    },
    
    // 检查培训进度
    checkTrainingProgress() {
      let completedCount = 0;
      
      // 送电培训逻辑
      if (this.trainingMode === 'powerOn') {
        // 15AL1组完成条件：主电源开启且所有设备开启
        if (this.groupStatus['15AL1'].mainPowerOn && this.groupStatus['15AL1'].equipmentOn) {
          if (!this.groupStatus['15AL1'].completed) {
            this.groupStatus['15AL1'].completed = true;
            this.showFeedback('恭喜！成功完成15AL1组的送电培训！', 'success');
            
            // 标记该组设备为已完成
            this.markGroupDevicesAsCompleted('15AL1');
          }
        }
        
        // 16AL1-1组完成条件：主电源开启且所有设备开启
        if (this.groupStatus['16AL1-1'].mainPowerOn && this.groupStatus['16AL1-1'].equipmentOn) {
          if (!this.groupStatus['16AL1-1'].completed) {
            this.groupStatus['16AL1-1'].completed = true;
            this.showFeedback('恭喜！成功完成16AL1-1组的送电培训！', 'success');
            
            // 标记该组设备为已完成
            this.markGroupDevicesAsCompleted('16AL1-1');
          }
        }
      } 
      // 断电培训逻辑
      else {
        // 15AL1组完成条件：所有设备断开且主电源断开
        if (!this.hasConnectedEquipment('15AL1') && 
            !this.groupStatus['15AL1'].mainPowerOn) {
          if (!this.groupStatus['15AL1'].completed) {
            this.groupStatus['15AL1'].completed = true;
            this.showFeedback('恭喜！成功完成15AL1组的断电培训！', 'success');
            
            // 标记该组设备为已完成
            this.markGroupDevicesAsCompleted('15AL1');
          }
        }
        
        // 16AL1-1组完成条件：所有设备断开且主电源断开
        if (!this.hasConnectedEquipment('16AL1-1') && 
            !this.groupStatus['16AL1-1'].mainPowerOn) {
          if (!this.groupStatus['16AL1-1'].completed) {
            this.groupStatus['16AL1-1'].completed = true;
            this.showFeedback('恭喜！成功完成16AL1-1组的断电培训！', 'success');
            
            // 标记该组设备为已完成
            this.markGroupDevicesAsCompleted('16AL1-1');
          }
        }
      }
      
      // 计算已完成的组数
      Object.values(this.groupStatus).forEach(status => {
        if (status.completed) {
          completedCount++;
        }
      });
      
      this.completedGroups = completedCount;
      
      // 检查是否所有组都已完成
      if (completedCount === this.totalGroups) {
        const completionMessage = `恭喜！您已成功完成所有${this.trainingMode === 'powerOn' ? '送电' : '断电'}培训任务！`;
        this.showFeedback(completionMessage, 'success');
        
        // 设置培训完成状态
        this.trainingCompleted = true;
        
        // 发送培训完成事件
        EventBus.$emit('circuitTrainingComplete', {
          success: true,
          completionText: completionMessage,
          mode: this.trainingMode
        });
      }
    },
    
    // 标记组内设备为已完成状态
    markGroupDevicesAsCompleted(groupId) {
      const markDevices = (devices) => {
        for (const device of devices) {
          if (this.isDeviceInGroup(device, groupId)) {
            device.trainingCompleted = true;
          }
          
          if (device.children && device.children.length > 0) {
            markDevices(device.children);
          }
        }
      };
      
      if (this.currentConfig && this.currentConfig.deviceList) {
        markDevices(this.currentConfig.deviceList);
      }
    },
    
    // 显示培训完成状态
    showTrainingCompletionStatus() {
      const completionMessage = `恭喜！您已成功完成所有${this.trainingMode === 'powerOn' ? '送电' : '断电'}培训任务！`;
      
      // 使用反馈消息显示成功状态
      this.feedbackMessage = completionMessage;
      this.feedbackType = 'success';
      
      // 保持反馈消息显示
      clearTimeout(this.feedbackTimeout);
      
      // 添加一个特殊的CSS类到反馈消息元素
      setTimeout(() => {
        const feedbackElement = document.querySelector('.training-feedback');
        if (feedbackElement) {
          feedbackElement.classList.add('completion-feedback');
        }
      }, 100);
    },
    
    // 更新培训步骤提示
    updateTrainingStepMessage() {
      if (this.trainingMode === 'powerOn') {
        // 送电培训提示
        const uncompletedGroups = Object.entries(this.groupStatus)
          .filter(([_, status]) => !status.completed);
        
        if (uncompletedGroups.length > 0) {
          const [groupId, status] = uncompletedGroups[0];
          const groupName = groupId === '15AL1' ? '15AL1' : '16AL1-1';
          
          if (!status.mainPowerOn) {
            this.currentStepMessage = `当前任务: 接通${groupName}组的主电源`;
          } else if (!status.equipmentOn) {
            this.currentStepMessage = `当前任务: 接通${groupName}组的所有负载设备`;
          }
        } else {
          this.currentStepMessage = '所有送电任务已完成！';
        }
      } else {
        // 断电培训提示
        const uncompletedGroups = Object.entries(this.groupStatus)
          .filter(([_, status]) => !status.completed);
        
        if (uncompletedGroups.length > 0) {
          const [groupId, status] = uncompletedGroups[0];
          const groupName = groupId === '15AL1' ? '15AL1' : '16AL1-1';
          
          if (this.hasConnectedEquipment(groupId)) {
            this.currentStepMessage = `当前任务: 断开${groupName}组的所有负载设备`;
          } else if (status.mainPowerOn) {
            this.currentStepMessage = `当前任务: 断开${groupName}组的主电源`;
          }
        } else {
          this.currentStepMessage = '所有断电任务已完成！';
        }
      }
    },
    
    // 显示反馈信息
    showFeedback(message, type = 'info') {
      this.feedbackMessage = message;
      this.feedbackType = type;
      
      // 如果是培训完成消息，不自动清除
      if (this.trainingCompleted && type === 'success' && message.includes('成功完成所有')) {
        return;
      }
      
      // 3秒后自动清除反馈
      setTimeout(() => {
        this.feedbackMessage = '';
      }, 3000);
    },
    
    // 切换设备的展开/折叠状态
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
        // 如果父设备断开，子设备也应断开
        if (!parentDevice.connected && child.connected) {
          child.connected = false;
          
          // 更新组状态
          this.updateGroupStatus(child, false);
          
          // 发送事件通知其他组件
          EventBus.$emit('deviceOperationFromTraining', {
            deviceId: child.id,
            status: false,
            trainingMode: this.trainingMode
          });
        }
        
        // 递归处理子设备的子设备
        if (child.isParent && child.children && child.children.length > 0) {
          this.updateChildrenConnectionStatus(child);
        }
      }
    },
    
    // 重置培训
    resetTraining() {
      if (!this.currentConfig || !this.currentConfig.deviceList) return;
      
      // 重置所有设备状态
      const resetDevices = (devices) => {
        for (const device of devices) {
          device.connected = false;
          device.trainingCompleted = false;
          
          if (device.children && device.children.length > 0) {
            resetDevices(device.children);
          }
        }
      };
      
      resetDevices(this.currentConfig.deviceList);
      
      // 重置组状态
      this.groupStatus = {
        '15AL1': { completed: false, mainPowerOn: false, equipmentOn: false },
        '16AL1-1': { completed: false, mainPowerOn: false, equipmentOn: false }
      };
      
      // 重置完成计数
      this.completedGroups = 0;
      
      // 重置培训完成状态
      this.trainingCompleted = false;
      
      // 清除反馈消息
      this.feedbackMessage = '';
      
      // 更新培训步骤提示
      this.updateTrainingStepMessage();
      
      this.showFeedback('培训已重置，请重新开始', 'info');
    },
    // 关闭培训完成对话框
    closeCompletionDialog() {
      this.trainingCompleted = false;
    },
    
    // 新增：退出培训
    exitTraining() {
      this.visible = false;
      EventBus.$emit('endCircuitTraining');
    },
  },
  mounted() {
    // 监听显示/隐藏事件
    console.log('电路培训组件已挂载');
    
    // 先移除可能存在的事件监听，避免重复
    EventBus.$off('startCircuitTraining');
    EventBus.$off('endCircuitTraining');
    EventBus.$off('showCircuitTraining');
    
    // 监听开始培训事件
    EventBus.$on('startCircuitTraining', (config) => {
      console.log('收到startCircuitTraining事件', config);
      
      if (config) {
        // 处理配置数据，添加培训相关状态
        this.currentConfig = this.preprocessConfig(config);
        this.visible = true;
        
        // 显示准备对话框
        this.showPreparationDialog = true;
        this.selectedMode = 'powerOn'; // 默认选择送电培训
      } else {
        console.error('电路培训配置为空，无法显示');
        EventBus.$emit('showErrorMessage', '电路培训配置加载失败');
      }
    });
    
    // 监听showCircuitTraining事件（从circuitTrainingButton发送）
    EventBus.$on('showCircuitTraining', (data) => {
      console.log('收到showCircuitTraining事件', data);
      
      if (data && data.show && data.config) {
        // 处理配置数据，添加培训相关状态
        this.currentConfig = this.preprocessConfig(data.config);
        this.visible = true;
        
        // 显示准备对话框
        this.showPreparationDialog = true;
        this.selectedMode = 'powerOn'; // 默认选择送电培训
      } else {
        // 隐藏培训组件
        this.visible = false;
      }
    });
    
    // 监听结束培训事件
    EventBus.$on('endCircuitTraining', () => {
      console.log('收到endCircuitTraining事件');
      this.visible = false;
    });
  },
  beforeDestroy() {
    // 组件销毁前移除事件监听
    EventBus.$off('startCircuitTraining');
    EventBus.$off('endCircuitTraining');
    EventBus.$off('showCircuitTraining');
  }
};
</script>

<style scoped>
.circuit-training {
  position: fixed;
  top: 80px;
  right: 90px;
  width: 700px;
  height: auto;
  max-height: 85vh;
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

/* 准备对话框样式 */
.preparation-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  animation: fadeIn 0.3s ease;
}

.error-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  animation: fadeIn 0.3s ease;
}

.dialog-content {
  background-image: url('~@/assets/image/card_bg.png');
  background-size: cover;
  background-position: center;
  border: 1px solid rgba(77, 196, 255, 0.7);
  border-radius: 8px;
  padding: 25px;
  width: 600px;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 0 20px rgba(77, 196, 255, 0.5);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.close-icon {
  color: #bde4ff;
  font-size: 24px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-icon:hover {
  background-color: rgba(189, 228, 255, 0.2);
}

.dialog-content h3 {
  color: #4dc4ff;
  font-size: 22px;
  margin-bottom: 20px;
  text-align: center;
  text-shadow: 0 0 10px rgba(77, 196, 255, 0.5);
}

.dialog-content h4 {
  color: #bde4ff;
  font-size: 18px;
  margin: 15px 0 10px;
}

.preparation-steps {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 25px;
}

.step {
  display: flex;
  align-items: center;
  background-color: rgba(12, 29, 47, 0.7);
  padding: 12px;
  border-radius: 6px;
  border: 1px solid rgba(77, 196, 255, 0.3);
}

.step-icon {
  width: 32px;
  height: 32px;
  margin-right: 15px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.step-icon.safety {
  background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTYgMkM4LjI2IDIgMiA4LjI2IDIgMTZDMiAyMy43NCA4LjI2IDMwIDE2IDMwQzIzLjc0IDMwIDMwIDIzLjc0IDMwIDE2QzMwIDguMjYgMjMuNzQgMiAxNiAyWk0xNiA2QzE4LjIxIDYgMjAgNy43OSAyMCAxMEMyMCAxMi4yMSAxOC4yMSAxNCAxNiAxNEMxMy43OSAxNCAxMiAxMi4yMSAxMiAxMEMxMiA3Ljc5IDEzLjc5IDYgMTYgNlpNMTYgMjZDMTIuNjcgMjYgOS42IDI0LjMzIDggMjEuNjVDOC4wNyAxOC44MyAxMy42NyAxNy41IDE2IDE3LjVDMTguMzEgMTcuNSAyMy45MyAxOC44MyAyNCAyMS42NUMyMi40IDI0LjMzIDE5LjMzIDI2IDE2IDI2WiIgZmlsbD0iIzREQzRGRiIvPjwvc3ZnPg==');
}

.step-icon.check {
  background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjYgNEgxMkM5LjggNCA4IDUuOCA4IDhWMjRDOCAyNi4yIDkuOCAyOCAxMiAyOEgyNkMyOC4yIDI4IDMwIDI2LjIgMzAgMjRWOEMzMCA1LjggMjguMiA0IDI2IDRaTTI2IDI0SDEyVjhIMjZWMjRaTTYgMTJINFYyOEM0IDMwLjIgNS44IDMyIDggMzJIMjRWMzBIOFYxMlpNMjIgMTBIMTZWMTJIMjJWMTBaTTIyIDE0SDE2VjE2SDIyVjE0Wk0yMiAxOEgxNlYyMEgyMlYxOFpNMTQgMTBIMTJWMTJIMTRWMTBaTTE0IDE0SDEyVjE2SDE0VjE0Wk0xNCAxOEgxMlYyMEgxNFYxOFoiIGZpbGw9IiM0REM0RkYiLz48L3N2Zz4=');
}

.step-text {
  color: #bde4ff;
  font-size: 16px;
  line-height: 1.4;
}

.training-mode-selection {
  margin-top: 20px;
}

.mode-options {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.mode-option {
  flex: 1;
  background-color: rgba(12, 29, 47, 0.7);
  border: 1px solid rgba(77, 196, 255, 0.3);
  border-radius: 6px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mode-option:hover {
  background-color: rgba(18, 40, 64, 0.8);
  transform: translateY(-2px);
}

.mode-option.selected {
  background-color: rgba(18, 45, 70, 0.9);
  border-color: rgba(77, 196, 255, 0.8);
  box-shadow: 0 0 15px rgba(77, 196, 255, 0.4);
}

.mode-icon {
  width: 40px;
  height: 40px;
  margin: 0 auto 10px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.mode-icon.power-on {
  background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgNEM5LjQgNCAyIDExLjQgMiAyMkMyIDMwLjQgNy42IDM3LjQgMTYgMzlMMTcuOCAzNS44QzExIDM0LjYgNi4yIDI5LjIgNi4yIDIyQzYuMiAxMy44IDEyLjQgNy42IDIwIDcuNkMyNy42IDcuNiAzMy44IDEzLjggMzMuOCAyMkMzMy44IDI5LjQgMjkgMzQuNiAyMi4yIDM1LjhMMjQgMzlDMzIuNCwzNy40IDM4IDMwLjYgMzggMjJDMzggMTEuNCAzMC42LDQgMjAgNFpNMjAgMTEuOFYyMkgzMS4yQzMxLjIsMTYuMiAyNi4yLDExLjggMjAsMTEuOFoiIGZpbGw9IiM0REM0RkYiLz48L3N2Zz4=');
}

.mode-icon.power-off {
  background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgNEM5LjQgNCAyIDExLjQgMiAyMkMyIDMyLjYgMTAuOCA0MCAyMCA0MEMyOS4yIDQwIDM4IDMyLjYgMzggMjJDMzggMTEuNCAzMC42IDQgMjAgNFpNMjAgNy42QzI3LjYgNy42IDMzLjggMTMuOCAzMy44IDIyQzMzLjggMzAuMiAyOC40IDM2LjQgMjAgMzYuNEMxMS42IDM2LjQgNi4yIDMwLjIgNi4yIDIyQzYuMiAxMy44IDEyLjQgNy42IDIwIDcuNlpNMjAgMTEuOEMxMy44IDExLjggOC44IDE2LjIgOC44IDIyQzguOCAyNy44IDEzLjIgMzIuMiAyMCAzMi4yQzI2LjggMzIuMiAzMS4yIDI3LjggMzEuMiAyMkMzMS4yIDE2LjIgMjYuMiAxMS44IDIwIDExLjhaIiBmaWxsPSIjRkY0RDRGIi8+PC9zdmc+');
}

.mode-label {
  color: #4dc4ff;
  font-size: 18px;
  text-align: center;
  margin-bottom: 8px;
}

.mode-description {
  color: #bde4ff;
  font-size: 14px;
  text-align: center;
  line-height: 1.4;
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 25px;
}

.dialog-button {
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dialog-button.confirm {
  background-color: rgba(77, 196, 255, 0.8);
  border: 1px solid #4dc4ff;
  color: #fff;
}

.dialog-button.confirm:hover {
  background-color: rgba(77, 196, 255, 0.9);
  box-shadow: 0 0 10px rgba(77, 196, 255, 0.5);
}

.dialog-button.confirm:disabled {
  background-color: rgba(77, 196, 255, 0.3);
  cursor: not-allowed;
}

.dialog-button.cancel {
  background-color: rgba(255, 77, 79, 0.8);
  border: 1px solid #ff4d4f;
  color: #fff;
}

.dialog-button.cancel:hover {
  background-color: rgba(255, 77, 79, 0.9);
  box-shadow: 0 0 10px rgba(255, 77, 79, 0.5);
}

/* 错误对话框样式 */
.error-message {
  display: flex;
  align-items: center;
  background-color: rgba(255, 77, 79, 0.2);
  border: 1px solid rgba(255, 77, 79, 0.5);
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
}

.error-icon {
  width: 24px;
  height: 24px;
  margin-right: 15px;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjUgMiAyIDYuNSAyIDEyQzIgMTcuNSA2LjUgMjIgMTIgMjJDMTcuNSAyMiAyMiAxNy41IDIyIDEyQzIyIDYuNSAxNy41IDIgMTIgMlpNMTcgMTUuNkwxNS42IDE3TDEyIDEzLjRMOC40IDE3TDcgMTUuNkwxMC42IDEyTDcgOC40TDguNCA3TDEyIDEwLjZMMTUuNiA3TDE3IDguNEwxMy40IDEyTDE3IDE1LjZaIiBmaWxsPSIjRkY0RDRGIi8+PC9zdmc+');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.error-text {
  color: #ff4d4f;
  font-size: 16px;
  line-height: 1.4;
}

.operation-steps {
  background-color: rgba(12, 29, 47, 0.7);
  border: 1px solid rgba(77, 196, 255, 0.3);
  border-radius: 6px;
  padding: 15px;
}

.operation-steps p {
  color: #bde4ff;
  font-size: 16px;
  margin: 8px 0;
}

/* 其他原有样式保持不变 */
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
  max-height: calc(85vh - 60px);
  z-index: 2;
  scroll-behavior: smooth;
}

/* 培训状态样式 */
.training-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: rgba(12, 29, 47, 0.7);
  border: 1px solid rgba(77, 196, 255, 0.5);
  border-radius: 5px;
  margin-bottom: 15px;
}

.training-progress {
  display: flex;
  flex-direction: column;
  width: 60%;
}

.progress-title {
  color: #bde4ff;
  font-size: 16px;
  margin-bottom: 8px;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background-color: rgba(189, 228, 255, 0.2);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 5px;
}

.progress-fill {
  height: 100%;
  background-color: #4dc4ff;
  border-radius: 6px;
  transition: width 0.5s ease;
}

.progress-text {
  color: #bde4ff;
  font-size: 14px;
  text-align: center;
}

.training-mode {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mode-label {
  color: #bde4ff;
  font-size: 14px;
  margin-bottom: 5px;
}

.mode-value {
  color: #4dc4ff;
  font-size: 18px;
  font-weight: bold;
}

/* 培训指导样式 */
.training-instruction {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: rgba(18, 40, 64, 0.8);
  border: 1px solid rgba(77, 196, 255, 0.5);
  border-radius: 5px;
  margin-bottom: 20px;
}

.instruction-icon {
  width: 40px;
  height: 40px;
  margin-right: 15px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.instruction-text {
  color: #bde4ff;
  font-size: 14px;
  line-height: 1.5;
}

.instruction-text p {
  margin: 5px 0;
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

/* 高亮可操作设备 */
.node-content.highlight {
  border-color: rgba(82, 196, 26, 0.7);
  box-shadow: 0 0 10px rgba(82, 196, 26, 0.4);
}

.node-content.highlight:hover {
  box-shadow: 0 0 15px rgba(82, 196, 26, 0.6);
}

/* 已完成培训的设备样式 */
.node-content.completed {
  background-color: rgba(18, 55, 30, 0.8);
  border-color: rgba(82, 196, 26, 0.9);
  box-shadow: 0 0 10px rgba(82, 196, 26, 0.5);
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
  background-color: rgba(80, 50, 10, 0.8);
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

/* 培训反馈样式 */
.training-feedback {
  margin: 15px 0;
  padding: 12px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  background-color: rgba(18, 40, 64, 0.8);
  border: 1px solid rgba(77, 196, 255, 0.5);
  animation: fadeInUp 0.5s ease;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.feedback-icon {
  width: 24px;
  height: 24px;
  margin-right: 10px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.feedback-icon.success {
  background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjUgMiAyIDYuNSAyIDEyQzIgMTcuNSA2LjUgMjIgMTIgMjJDMTcuNSAyMiAyMiAxNy41IDIyIDEyQzIyIDYuNSAxNy41IDIgMTIgMlpNMTAgMTdMNSAxMkw2LjQgMTAuNkwxMCAxNC4yTDE3LjYgNi42TDE5IDhMMTAgMTdaIiBmaWxsPSIjNTJDNDFBIi8+PC9zdmc+');
}

.feedback-icon.error {
  background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjUgMiAyIDYuNSAyIDEyQzIgMTcuNSA2LjUgMjIgMTIgMjJDMTcuNSAyMiAyMiAxNy41IDIyIDEyQzIyIDYuNSAxNy41IDIgMTIgMlpNMTcgMTUuNkwxNS42IDE3TDEyIDEzLjRMOC40IDE3TDcgMTUuNkwxMC42IDEyTDcgOC40TDguNCA3TDEyIDEwLjZMMTUuNiA3TDE3IDguNEwxMy40IDEyTDE3IDE1LjZaIiBmaWxsPSIjRkY0RDRGIi8+PC9zdmc+');
}

.feedback-icon.info {
  background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjUgMiAyIDYuNSAyIDEyQzIgMTcuNSA2LjUgMjIgMTIgMjJDMTcuNSAyMiAyMiAxNy41IDIyIDEyQzIyIDYuNSAxNy41IDIgMTIgMlpNMTMgMTdIMTFWMTFIMTNWMTdaTTEzIDlIMTFWN0gxM1Y5WiIgZmlsbD0iIzREQzRGRiIvPjwvc3ZnPg==');
}

.feedback-message {
  color: #bde4ff;
  font-size: 14px;
  line-height: 1.4;
}

/* 培训控制按钮样式 */
.training-controls {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.control-button {
  padding: 10px 15px;
  border-radius: 5px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #fff;
  font-weight: bold;
  min-width: 120px;
}

.reset-button {
  background-color: rgba(255, 77, 79, 0.8);
  border: 1px solid #ff4d4f;
}

.reset-button:hover {
  background-color: rgba(255, 77, 79, 0.9);
  box-shadow: 0 0 10px rgba(255, 77, 79, 0.5);
}

.mode-button {
  background-color: rgba(77, 196, 255, 0.8);
  border: 1px solid #4dc4ff;
}

.mode-button:hover {
  background-color: rgba(77, 196, 255, 0.9);
  box-shadow: 0 0 10px rgba(77, 196, 255, 0.5);
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

/* 成功对话框样式 */
.success-dialog {
  background-image: url('~@/assets/image/card_bg.png');
  background-size: cover;
  background-position: center;
  border: 1px solid rgba(82, 196, 26, 0.7) !important;
  box-shadow: 0 0 20px rgba(82, 196, 26, 0.5) !important;
}

.success-icon {
  background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjUgMiAyIDYuNSAyIDEyQzIgMTcuNSA2LjUgMjIgMTIgMjJDMTcuNSAyMiAyMiAxNy41IDIyIDEyQzIyIDYuNSAxNy41IDIgMTIgMlpNMTAgMTdMNSAxMkw2LjQgMTAuNkwxMCAxNC4yTDE3LjYgNi42TDE5IDhMMTAgMTdaIiBmaWxsPSIjNTJDNDFBIi8+PC9zdmc+') !important;
}

.success-text {
  color: #52c41a !important;
}

/* 培训完成反馈样式 */
.training-feedback.completion-feedback {
  background-color: rgba(18, 55, 30, 0.8);
  border: 1px solid rgba(82, 196, 26, 0.7);
  box-shadow: 0 0 15px rgba(82, 196, 26, 0.5);
  padding: 15px;
  font-size: 16px;
  font-weight: bold;
  animation: pulse 2s infinite;
}

/* 培训完成状态样式 */
.training-completion {
  margin: 0;
  padding: 30px;
  border-radius: 10px;
  background-image: url('~@/assets/image/card_bg.png');
  background-size: cover;
  background-position: center;
  border: 2px solid rgba(82, 196, 26, 0.8);
  box-shadow: 0 0 30px rgba(82, 196, 26, 0.6);
  display: flex;
  align-items: center;
  animation: fadeInScale 0.5s ease;
  max-width: 600px;
  width: 90%;
}

.completion-buttons {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  margin-top: 20px;
}

.completion-button {
  flex: 1;
  padding: 12px 20px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
  text-align: center;
}

.completion-button.restart {
  background-color: rgba(82, 196, 26, 0.8);
  border: 1px solid #52c41a;
  color: #fff;
}

.completion-button.restart:hover {
  background-color: rgba(82, 196, 26, 0.9);
  box-shadow: 0 0 10px rgba(82, 196, 26, 0.5);
}

.completion-button.exit {
  background-color: rgba(77, 196, 255, 0.8);
  border: 1px solid #4dc4ff;
  color: #fff;
}

.completion-button.exit:hover {
  background-color: rgba(77, 196, 255, 0.9);
  box-shadow: 0 0 10px rgba(77, 196, 255, 0.5);
}

@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

.completion-icon {
  width: 48px;
  height: 48px;
  margin-right: 20px;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjQgNEMxMyA0IDQgMTMgNCAyNEM0IDM1IDEzIDQ0IDI0IDQ0QzM1IDQ0IDQ0IDM1IDQ0IDI0QzQ0IDEzIDM1IDQgMjQgNFpNMjAgMzRMMTAgMjRMMTIuOCAyMS4yTDIwIDI4LjRMMzUuMiAxMy4yTDM4IDE2TDIwIDM0WiIgZmlsbD0iIzUyQzQxQSIvPjwvc3ZnPg==');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  animation: pulse 2s infinite;
}

.completion-content {
  flex: 1;
}

.completion-title {
  color: #52c41a;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
  text-shadow: 0 0 10px rgba(82, 196, 26, 0.5);
}

.completion-message {
  color: #bde4ff;
  font-size: 18px;
  margin-bottom: 15px;
}

.completion-summary {
  background-color: rgba(12, 29, 47, 0.7);
  border: 1px solid rgba(82, 196, 26, 0.5);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 15px;
}

.summary-title {
  color: #52c41a;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
}

.summary-content {
  color: #bde4ff;
  font-size: 14px;
  line-height: 1.5;
}

/* 培训完成覆盖层 */
.training-completion-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  animation: fadeIn 0.5s ease;
}
                                                                                                                                                    
</style>
                                                             