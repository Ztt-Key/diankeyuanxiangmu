import * as THREE from 'three';
import { floorBaseMaterial2 } from './material';
import { parkData } from '@/assets/mock/mock';
import { Notification } from 'element-ui';
import EventBus from '../bus';
import { setModelDefaultMatrial } from '@/three/loaderModel';
import { wireMaterial, trunkMaterial, secondaryMaterial } from './material';

export function loaderParkElectricity(app) {
  // 保存原始的floorBaseMaterial2，以便后续恢复
  if (!app.originalFloorBaseMaterial2) {
    app.originalFloorBaseMaterial2 = floorBaseMaterial2.clone();
  }

  // 创建一个暗色版本的线框材质 - 每次都创建新的实例，避免共享材质
  const darkWireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0x003344, // 深蓝色，比原来的颜色更暗
    transparent: true,
    opacity: 0.05, // 降低不透明度
    wireframe: true
  });

  // 应用暗色线框材质到非线缆模型，但不影响已经是线框模式的模型
  app.model.traverse((obj) => {
    if (obj.isMesh && obj.name.indexOf('线缆') === -1 && obj.name.indexOf('电表') === -1) {
      // 检查是否已经是线框模式
      const isWireframe = obj.material && obj.material.wireframe === true;
      
      // 如果不是线框模式，才保存原始材质并应用暗色线框材质
      if (!isWireframe) {
        // 保存原始材质以便恢复
        if (!obj.userData.originalMaterial) {
          obj.userData.originalMaterial = obj.material;
        }
        // 应用暗色线框材质
        obj.material = darkWireframeMaterial.clone(); // 使用克隆的材质，避免共享
      }
    }
  });

  app.flyTo({
    position: [-1.2679514873881814, 28.65360186645963, -108.803245854144],
    controls: [-33.00252797102643, 10.097251845886115, -69.72984719629221],
    done: () => {
      createElectricityModel(app);
      setupCableAnimation(app);
    }
  });
}

export function createElectricityModel(app) {
  let notifIndex = 0;
  app.model.traverse((obj) => {
    if (obj.isMesh) {
      if (obj.name.indexOf('电表') === -1) {
        obj.material = floorBaseMaterial2;
      } else {
        // 获取到每一个电表的值
        const floorName = obj.parent.parent.name;
        const layerName = obj.parent.name.substr(0, 2);
        const roomName = obj.name.substr(0, 3);
        const value = parkData[floorName][layerName][roomName]['电'];
        // 定义阈值
        if (value > 460) {
          app.selectedObjects.push(obj);
          if (notifIndex < 6) {
            setTimeout(() => {
              Notification({
                title: '警告',
                message: `${floorName}的${layerName}${roomName}的用电量为${value}度, 已超过平均标准，请留意`,
                type: 'warning',
                duration: 6000
              });
            }, notifIndex * 200);
            notifIndex++;
          }
          app.rayModel.push(obj);
        }
      }
    }
  });

  app.initRaycaster(
    (activeObj, app, event) => {
      if (activeObj.object) {
        const obj = activeObj.object;
        const floorName = obj.parent.parent.name;
        const layerName = obj.parent.name.substr(0, 2);
        const roomName = obj.name.substr(0, 3);
        const value = parkData[floorName][layerName][roomName]['电'];
        EventBus.$emit('changeTooltip', {
          楼栋: floorName,
          楼层: layerName,
          房间号: roomName,
          度数: value,
          name: obj.name,
          type: '电',
          x: event.x,
          y: event.y,
          show: true
        });
      } else {
        EventBus.$emit('changeTooltip', {
          show: false
        });
      }
    },
    app.rayModel,
    'click'
  );
}

function setupCableAnimation(app) {
  // 线缆模型名称关键词
  const cableKeyword = '线缆';
  
  // 存储找到的线缆模型，用于后续动画更新
  const cableModels = [];

  // 创建一个基础版本的线缆材质，使用trunkMaterial而不是wireMaterial
  const baseCableMaterial = wireMaterial.clone();
  baseCableMaterial.color = new THREE.Color(0xff3300); // 基础红色
  
  // 确保纹理设置正确
  if (baseCableMaterial.map) {
    baseCableMaterial.map.wrapS = baseCableMaterial.map.wrapT = THREE.RepeatWrapping;
    baseCableMaterial.map.repeat.set(1, 1);
  }

  // 遍历app.model查找线缆模型并应用材质
  app.model.traverse((obj) => {
    if (obj.isMesh && obj.name.indexOf(cableKeyword) !== -1) {
      console.log('找到线缆模型:', obj.name);
      // 保存原始材质以便需要时恢复
      obj.userData.originalMaterial = obj.material;
      // 应用基础线缆材质
      obj.material = baseCableMaterial.clone(); // 克隆材质以避免影响原始材质
      // 将找到的线缆模型添加到数组中
      cableModels.push(obj);
    }
  });

  // 创建时间变量用于闪烁效果
  let time = 0;

  // 创建更新函数 - 添加闪烁效果
  window.updateCableAnimation = () => {
    // 更新时间变量
    time += 0.05;
    
    // 计算闪烁值 (0.8-2.0范围，比之前的0.5-1.5更亮)
    const blinkValue = Math.sin(time) * 0.6 + 1.4;
    
    // 遍历所有找到的线缆模型
    cableModels.forEach(obj => {
      if (obj && obj.material) {
        // 更新纹理偏移
        if (obj.material.map) {
          obj.material.map.offset.y += 0.001; // 使用0.001的偏移量
        }
        
        // 更新材质颜色亮度
        const color = new THREE.Color(0xff3300); // 基础红色
        color.multiplyScalar(blinkValue); // 使颜色亮度随时间变化，更亮
        obj.material.color = color;
        
        // 如果材质支持发光，也更新发光强度
        if (obj.material.emissive) {
          const emissiveColor = new THREE.Color(0xff0000); // 发光红色
          emissiveColor.multiplyScalar(blinkValue * 0.7); // 发光强度随时间变化，更强
          obj.material.emissive = emissiveColor;
        }
      }
    });
  };

  // 将更新函数添加到EventBus
  EventBus.$emit('addRenderTask', 'cableAnimation', window.updateCableAnimation);
}

export function destroyParkElectricity(app) {
  try {
    // 清空选中对象
    if (app.selectedObjects) {
      app.selectedObjects = [];
      if (app.outlinePass) {
        app.outlinePass.selectedObjects = app.selectedObjects;
      }
    }
    
    // 隐藏提示
    EventBus.$emit('changeTooltip', {
      show: false
    });
    
    // 通过EventBus移除渲染任务
    EventBus.$emit('removeRenderTask', 'cableAnimation');
    
    // 移除所有渲染任务
    if (app.renderTasks) {
      Object.keys(app.renderTasks).forEach(taskId => {
        if (taskId.startsWith('blink_') || taskId === 'cableAnimation') {
          EventBus.$emit('removeRenderTask', taskId);
          delete app.renderTasks[taskId];
        }
      });
    }
    
    // 清理所有高亮和闪烁对象
    if (app.cableHighlightedObjects && app.cableHighlightedObjects.length > 0) {
      app.cableHighlightedObjects.forEach(obj => {
        if (obj && obj.userData.originalMaterial) {
          obj.material = obj.userData.originalMaterial;
          delete obj.userData.originalMaterial;
        }
      });
      app.cableHighlightedObjects = [];
    }
    
    if (app.blinkObjects && app.blinkObjects.length > 0) {
      app.blinkObjects.forEach(obj => {
        if (obj && obj.userData.originalMaterial) {
          obj.material = obj.userData.originalMaterial;
          delete obj.userData.originalMaterial;
        }
        if (obj && obj.userData.blinkTaskId) {
          delete obj.userData.blinkTaskId;
        }
      });
      app.blinkObjects = [];
    }
    
    // 恢复原始的floorBaseMaterial2
    if (app.originalFloorBaseMaterial2) {
      // 创建一个新的材质实例，避免共享引用
      floorBaseMaterial2.color.copy(app.originalFloorBaseMaterial2.color);
      floorBaseMaterial2.opacity = app.originalFloorBaseMaterial2.opacity;
      floorBaseMaterial2.transparent = app.originalFloorBaseMaterial2.transparent;
      floorBaseMaterial2.wireframe = app.originalFloorBaseMaterial2.wireframe;
    }
    
    // 遍历所有模型并恢复原始材质
    app.model.traverse((obj) => {
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
        
        // 特别处理车流线模型，确保它们使用正确的材质
        if (obj.name.indexOf('车流线1') > -1) {
          obj.material = secondaryMaterial;
        } else if (obj.name.indexOf('车流线2') > -1 || obj.name.indexOf('车流线3') > -1) {
          obj.material = trunkMaterial;
        }
      }
    });
    
    // 销毁射线检测器
    if (typeof app.destroyRaycaster === 'function') {
      app.destroyRaycaster('click');
    }
  } catch (error) {
    console.error('destroyParkElectricity 函数执行出错:', error);
    
    // 即使出错，也尝试恢复车流线材质和所有模型的原始材质
    try {
      app.model.traverse((obj) => {
        if (obj.isMesh) {
          // 恢复原始材质
          if (obj.userData.originalMaterial) {
            obj.material = obj.userData.originalMaterial;
            delete obj.userData.originalMaterial;
          }
          
          // 处理车流线模型
          if (obj.name.indexOf('车流线1') > -1) {
            obj.material = secondaryMaterial;
          } else if (obj.name.indexOf('车流线2') > -1 || obj.name.indexOf('车流线3') > -1) {
            obj.material = trunkMaterial;
          }
        }
      });
    } catch (e) {
      console.error('恢复模型材质时出错:', e);
    }
  }
  
  // 最后调用setModelDefaultMatrial确保所有材质都被正确恢复
  try {
    setModelDefaultMatrial(app);
  } catch (error) {
    console.error('调用setModelDefaultMatrial时出错:', error);
  }
}
