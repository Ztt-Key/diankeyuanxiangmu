<template>
  <div class="container">
    <form>
      <label v-for="(item, index) in controls" @click="activeFun(item, index)">
        <input type="radio" name="radio" :checked="index === activeVar" />
        <span>{{ item.name }}</span>
      </label>
    </form>
    <!-- 楼层返回 -->
    <div class="back animated fadeIn" @click="backFloorBase" v-if="isShowFloorBack">
      <img src="./../assets/image/back.png" alt="" />
      <p>返回</p>
    </div>
    <!-- 楼层ui -->
    <layer :layers="layerData" :active="currentLayer" :styles="{ top: '55%', left: '72%', height: '400px' }"
      @change="changeLayer" v-if="isShowFloorBack"></layer>
    <tooltip :style="{
      visibility: roomTooltipStyle.show ? 'visible' : 'hidden',
      left: roomTooltipStyle.x + 'px',
      top: roomTooltipStyle.y + 'px'
    }" :data="roomTooltipStyle"></tooltip>
  </div>
</template>

<script>
import { loaderFloorManage, setModelLayer, removeElectricWireAnimation } from '@/three/floorManage';
import { loaderParkElectricity, destroyParkElectricity } from '@/three/parkElectricity';
import layer from '@/components/layer';
import { destroyControlGroup, setModelDefaultMatrial } from '@/three/loaderModel';
import tooltip from '@/components/tooltip';
import { parkData, cameraUrls } from '@/assets/mock/mock';
import { loaderParkWater, destroyParkWater } from '@/three/parkWater';
import { floorBaseMaterial, floorBaseMaterial2 } from '@/three/material';
import { addGlowEffectToPowerRoom, removeGlowEffectFromPowerRoom } from '@/three/powerRoomEffect';
import EventBus from '@/bus';


export default {
  name: '',
  components: {
    layer,
    tooltip
  },
  props: {},
  data() {
    return {
      roomTooltipStyle: {
        show: false,
        x: 0,
        y: 0,
        name: 'xxx'
      },
      isShowFloorBack: false,
      layerData: [],
      currentLayer: '全楼',
      curFloorModel: null,
      controls: [
        {
          name: '首页',
          goFunction: () => {
            window.app.flyTo({
              position: [40.672568371153744, 96.15288680991578, -18.321015281826696],
              controls: [-19.265339753753807, 31.91865695374252, -35.958997358413164],
              duration: 1000
            });

            // 如果A-room模型可见，则隐藏它并显示原始模型
            if (window.app.aRoomModel && window.app.aRoomModel.visible) {
              removeElectricWireAnimation(window.app);
            }
            
            // 如果B-room模型可见，则隐藏它并显示原始模型
            if (window.app.bRoomModel && window.app.bRoomModel.visible) {
              removeElectricWireAnimation(window.app);
            }
            
            // 如果D-room模型可见，则隐藏它并显示原始模型
            if (window.app.dRoomModel && window.app.dRoomModel.visible) {
              removeElectricWireAnimation(window.app);
              // 调用returnToMainScene函数确保正确返回
              const { returnToMainScene } = require('@/three/floorManage');
              returnToMainScene(window.app);
            }
            
            // 移除所有渲染任务
            if (window.app.renderTasks) {
              // 获取EventBus实例
              const EventBus = require('@/bus').default;
              
              Object.keys(window.app.renderTasks).forEach(taskId => {
                if (taskId.startsWith('blink_') || taskId === 'cableAnimation') {
                  // 使用导入的EventBus
                  EventBus.$emit('removeRenderTask', taskId);
                  delete window.app.renderTasks[taskId];
                }
              });
            }
            
            // 清理所有高亮和闪烁对象
            if (window.app.cableHighlightedObjects && window.app.cableHighlightedObjects.length > 0) {
              window.app.cableHighlightedObjects.forEach(obj => {
                if (obj && obj.userData.originalMaterial) {
                  obj.material = obj.userData.originalMaterial;
                  delete obj.userData.originalMaterial;
                }
              });
              window.app.cableHighlightedObjects = [];
            }
            
            if (window.app.blinkObjects && window.app.blinkObjects.length > 0) {
              window.app.blinkObjects.forEach(obj => {
                if (obj && obj.userData.originalMaterial) {
                  obj.material = obj.userData.originalMaterial;
                  delete obj.userData.originalMaterial;
                }
                if (obj && obj.userData.blinkTaskId) {
                  delete obj.userData.blinkTaskId;
                }
              });
              window.app.blinkObjects = [];
            }
            
            // 清空selectedObjects数组
            if (window.app.selectedObjects) {
              window.app.selectedObjects = [];
              
              // 更新outlinePass
              if (window.app.outlinePass) {
                window.app.outlinePass.selectedObjects = [];
              }
            }
            
            // 恢复原始的floorBaseMaterial2
            if (window.app.originalFloorBaseMaterial2) {
              const { floorBaseMaterial2 } = require('@/three/material');
              // 创建一个新的材质实例，避免共享引用
              floorBaseMaterial2.color.copy(window.app.originalFloorBaseMaterial2.color);
              floorBaseMaterial2.opacity = window.app.originalFloorBaseMaterial2.opacity;
              floorBaseMaterial2.transparent = window.app.originalFloorBaseMaterial2.transparent;
              floorBaseMaterial2.wireframe = window.app.originalFloorBaseMaterial2.wireframe;
            }
            
            // 导入材质
            const { secondaryMaterial, trunkMaterial } = require('@/three/material');
            
            // 遍历所有模型并恢复原始材质
            window.app.model.traverse((obj) => {
              if (obj.isMesh) {
                // 恢复原始可见性
                if (obj.name == "平面017_1") obj.visible = true;
                if (obj.name == "平面017_2") obj.visible = true;
                if (obj.name == "平面017_3") obj.visible = true;
                if (obj.name == "平面017_4") obj.visible = true;
                if (obj.name == "车流线1") obj.visible = true;
                
                // 恢复原始材质
                if (obj.userData.originalMaterial) {
                  obj.material = obj.userData.originalMaterial;
                  delete obj.userData.originalMaterial;
                }
                
                // 特别处理车流线模型
                if (obj.name.indexOf('车流线1') > -1) {
                  obj.visible = true;
                  obj.material = secondaryMaterial;
                }
                if (obj.name.indexOf('车流线2') > -1 || obj.name.indexOf('车流线3') > -1) {
                  obj.material = trunkMaterial;
                }
              }
            });
            
            // 最后调用setModelDefaultMatrial确保所有材质都被正确恢复
            setModelDefaultMatrial(window.app);
          },
          backFunction: () => { }
        },
        {
          name: '操作仿真',
          goFunction: () => {
            // 先将模型设置为线框模式，除了配电室
            window.app.model.traverse((obj) => {
              if (obj.isMesh && obj.name.indexOf('配电室') === -1) {
                // 保存原始材质以便恢复

                // 跳过名为"平面017_1"的模型
                if (obj.name == "平面017_1") obj.visible = false;
                if (obj.name == "平面017_2") obj.visible = false;
                if (obj.name == "平面017_3") obj.visible = false;
                if (obj.name == "平面017_4") obj.visible = false;
                if (obj.name == "车流线1") obj.visible = false;

                if (!obj.userData.originalMaterial) {
                  obj.userData.originalMaterial = obj.material;
                }
                // 应用线框材质
                obj.material = floorBaseMaterial2;
              }
            });

            // 为配电室模型添加发光效果
            addGlowEffectToPowerRoom(window.app);

            // 激活楼层管理功能（不再加载，只是激活）
            loaderFloorManage(window.app);
            
            // 触发进入操作仿真事件，显示三个按钮
            console.log('进入操作仿真模块，触发enterPowerRoom事件');
            EventBus.$emit('enterPowerRoom', 'simulation');
          },
          backFunction: () => {
            // 移除发光效果
            removeGlowEffectFromPowerRoom(window.app);

            // 销毁控制组
            destroyControlGroup(window.app, 'floorText-3d');

            // 恢复所有隐藏的模型
            window.app.model.traverse((obj) => {
              if (obj.isMesh) {
                // 恢复原始可见性
                if (obj.name == "平面017_1") obj.visible = true;
                if (obj.name == "平面017_2") obj.visible = true;
                if (obj.name == "平面017_3") obj.visible = true;
                if (obj.name == "平面017_4") obj.visible = true;
                if (obj.name == "车流线1") obj.visible = true;

                // 恢复原始材质
                if (obj.userData.originalMaterial) {
                  obj.material = obj.userData.originalMaterial;
                  obj.userData.originalMaterial = null;
                }
              }
            });

            // 如果A-room模型可见，则隐藏它并显示原始模型
            if (window.app.aRoomModel && window.app.aRoomModel.visible) {
              // 移除电线动画并恢复光照
              removeElectricWireAnimation(window.app);
            }
            
            // 触发离开操作仿真事件，隐藏三个按钮
            console.log('退出操作仿真模块，触发leavePowerRoom事件');
            EventBus.$emit('leavePowerRoom');
          }
        },
        {
          name: '线缆显示',
          goFunction: function() {
            console.log('激活线缆显示功能');
            try {
              // 首先清理当前的配电室视图
              // 如果A-room模型可见，则隐藏它并显示原始模型
              if (window.app.aRoomModel && window.app.aRoomModel.visible) {
                removeElectricWireAnimation(window.app);
              }
              
              // 如果B-room模型可见，则隐藏它并显示原始模型
              if (window.app.bRoomModel && window.app.bRoomModel.visible) {
                removeElectricWireAnimation(window.app);
              }
              
              // 如果D-room模型可见，则隐藏它并显示原始模型
              if (window.app.dRoomModel && window.app.dRoomModel.visible) {
                removeElectricWireAnimation(window.app);
                // 调用returnToMainScene函数确保正确返回
                const { returnToMainScene } = require('@/three/floorManage');
                returnToMainScene(window.app);
              }
              
              // 然后激活线缆显示功能
              loaderParkElectricity(window.app);
              // 显示线缆面板，使用全局EventBus
              console.log('触发showCable事件');
              const EventBus = require('@/bus').default;
              EventBus.$emit('showCable', true);
            } catch (error) {
              console.error('激活线缆显示功能时出错:', error);
            }
          },
          backFunction: function() {
            console.log('关闭线缆显示功能');
            try {
              // 直接调用destroyParkElectricity函数
              destroyParkElectricity(window.app);
              
              // 使用全局EventBus触发事件
              const EventBus = require('@/bus').default;
              EventBus.$emit('showCable', false);
              
              // 确保所有模型材质被正确恢复
              setModelDefaultMatrial(window.app);
              
              // 确保所有模型的可见性恢复
              const { secondaryMaterial, trunkMaterial } = require('@/three/material');
              window.app.model.traverse((obj) => {
                if (obj.isMesh) {
                  // 恢复原始可见性
                  if (obj.name == "平面017_1") obj.visible = true;
                  if (obj.name == "平面017_2") obj.visible = true;
                  if (obj.name == "平面017_3") obj.visible = true;
                  if (obj.name == "平面017_4") obj.visible = true;
                  if (obj.name == "车流线1") obj.visible = true;
                  
                  // 处理车流线模型
                  if (obj.name.indexOf('车流线1') > -1) {
                    obj.material = secondaryMaterial;
                  } else if (obj.name.indexOf('车流线2') > -1 || obj.name.indexOf('车流线3') > -1) {
                    obj.material = trunkMaterial;
                  }
                }
              });
            } catch (error) {
              console.error('关闭线缆显示功能时出错:', error);
              
              // 尝试恢复车流线材质
              try {
                const { secondaryMaterial, trunkMaterial } = require('@/three/material');
                window.app.model.traverse((obj) => {
                  if (obj.isMesh) {
                    // 恢复原始材质
                    if (obj.userData.originalMaterial) {
                      obj.material = obj.userData.originalMaterial;
                      delete obj.userData.originalMaterial;
                    }
                    
                    // 恢复原始可见性
                    if (obj.name == "平面017_1") obj.visible = true;
                    if (obj.name == "平面017_2") obj.visible = true;
                    if (obj.name == "平面017_3") obj.visible = true;
                    if (obj.name == "平面017_4") obj.visible = true;
                    if (obj.name == "车流线1") obj.visible = true;
                    
                    // 处理车流线模型
                    if (obj.name.indexOf('车流线1') > -1) {
                      obj.material = secondaryMaterial;
                    } else if (obj.name.indexOf('车流线2') > -1 || obj.name.indexOf('车流线3') > -1) {
                      obj.material = trunkMaterial;
                    }
                  }
                });
                
                // 即使出错也尝试调用setModelDefaultMatrial
                setModelDefaultMatrial(window.app);
              } catch (e) {
                console.error('恢复模型材质时出错:', e);
              }
            }
          }
        },

        // {
        //   name: '水力监测',
        //   goFunction: () => {
        //     loaderParkWater(window.app);
        //   },
        //   backFunction: () => {
        //     destroyParkWater(window.app);
        //   }
        // }
      ],
      activeVar: 0
    };
  },
  watch: {
    activeVar(newVal, oldVal) {
      const self = this; // 保存this引用
      const oldControl = this.controls.filter((item) => item.name === this.controls[oldVal].name);
      const oldBackFunction = oldControl[0].backFunction;
      
      // 使用call方法确保this指向组件实例
      if (typeof oldBackFunction === 'function') {
        oldBackFunction.call(self);
      }
      
      const newControl = this.controls.filter((item) => item.name === this.controls[newVal].name);
      const newGoFunction = newControl[0].goFunction;
      
      // 使用call方法确保this指向组件实例
      if (typeof newGoFunction === 'function') {
        newGoFunction.call(self);
      }
    }
  },
  methods: {
    activeFun(item, index) {
      this.activeVar = index;
    },
    // 返回到楼层初始化状态
    backFloorBase() {
      this.isShowFloorBack = false;
      this.roomTooltipStyle.show = false;

      if (this.curFloorModel && this.currentLayer !== '全楼') {
        this.currentLayer = '全楼';
        setModelLayer(window.app, this.curFloorModel, this.currentLayer, this.layerData, () => {
          setModelDefaultMatrial(window.app);
          loaderFloorManage(window.app);
          this.curFloorModel = null;
        });
      } else {
        setModelDefaultMatrial(window.app);
        loaderFloorManage(window.app);
      }
    },
    // 改变楼层函数
    changeLayer(layer) {
      this.currentLayer = layer;
      this.roomTooltipStyle.show = false;
      setModelLayer(window.app, this.curFloorModel, layer, this.layerData);
    }
  },
  mounted() {
    this.$EventBus.$on('changeFloorUI', (obj) => {
      this.isShowFloorBack = obj.isShowFloorBack;
      this.curFloorModel = obj.model;
      const layerNames = obj.model.children
        .filter((item) => item.name.indexOf('F') > -1)
        .map((item) => {
          const name = item.name.substr(0, item.name.indexOf('F') + 1);
          return name;
        });
      this.currentLayer = '全楼';
      this.layerData = [this.currentLayer].concat(layerNames);
    });

    this.$EventBus.$on('changeRoomTooltip', (obj) => {
      const data = parkData[this.curFloorModel.name];
      if (obj.name.indexOf('摄像头') > -1) {
        this.roomTooltipStyle = Object.assign(
          {
            楼栋: this.curFloorModel.name,
            楼层: this.currentLayer,
            摄像头: obj.name,
            视频: cameraUrls[obj.name.substr(0, 4)]
          },
          obj
        );
      } else {
        const roomName = obj.name.substr(0, 3);
        this.roomTooltipStyle = Object.assign(
          {
            楼栋: this.curFloorModel.name,
            楼层: this.currentLayer,
            房间号: roomName,
            度数: data[this.currentLayer][roomName][obj.type]
          },
          obj
        );
      }
    });

    this.$EventBus.$on('changeTooltip', (obj) => {
      this.roomTooltipStyle = obj;
    });
  }
};
</script>
<style lang="less" scoped>
.back {
  width: 48px;
  position: fixed;
  bottom: 4%;
  left: 25%;
  z-index: 3;
  cursor: pointer;
  font-size: 18px;

  img {
    width: 100%;
  }

  p {
    color: #fff;
    text-align: center;
  }
}

.container form {
  display: flex;
  flex-wrap: wrap;
}

.container label {
  display: flex;
  cursor: pointer;
  font-weight: 500;
  position: relative;
  overflow: hidden;
  margin-bottom: 0.375em;
}

.container label input {
  position: absolute;
  left: -9999px;
}

.container label input:checked+span {
  background-color: #414181;
  color: white;
}

.container label input:checked+span:before {
  box-shadow: inset 0 0 0 0.4375em #00005c;
}

.container label span {
  display: flex;
  align-items: center;
  padding: 0.375em 0.75em 0.375em 0.375em;
  border-radius: 99em;
  transition: 0.25s ease;
  color: #414181;
}

.container label span:hover {
  background-color: #d6d6e5;
}

.container label span:before {
  display: flex;
  flex-shrink: 0;
  content: '';
  background-color: #fff;
  width: 1.5em;
  height: 1.5em;
  border-radius: 50%;
  margin-right: 0.375em;
  transition: 0.25s ease;
  box-shadow: inset 0 0 0 0.125em #00005c;
}
</style>
