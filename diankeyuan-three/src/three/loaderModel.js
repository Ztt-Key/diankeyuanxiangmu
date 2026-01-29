import * as THREE from 'three';
import EventBus from '../bus';
import { secondaryMaterial, trunkMaterial, primaryMaterial } from './material';
import { loaderFloorManage } from './floorManage';

export function loaderModel(app) {
  return new Promise((resolve) => {
    // 模型控制组
    app.controlGroup = new THREE.Group();
    // 用于存储模型的所有材质
    app.modelMaterials = {};
    // 储存需要交互的模型
    app.rayModel = [];
    app.lineTextures = [];
    app.scene.add(app.controlGroup);
    
    // 创建射线检测器
    app.raycaster = new THREE.Raycaster();
    app.mouse = new THREE.Vector2();
    
    // 添加标志位来控制是否开启点击检测
    app.enableRaycast = false;
    
    // 添加键盘事件监听
    window.addEventListener('keydown', (event) => {
      if (event.key === 'p' || event.key === 'P') {
        // 切换射线检测状态
        app.enableRaycast = !app.enableRaycast;
        
        // 输出当前相机位置和Target
        console.log('相机位置:', app.camera.position);
        console.log('相机Target:', app.controls.target);
        console.log('射线检测状态:', app.enableRaycast ? '已开启' : '已关闭');
      }
    });
    
    // 点击事件
    window.addEventListener('click', (event) => {
      // 只有在启用射线检测时才处理点击事件
      if (!app.enableRaycast) return;
      
      // 计算鼠标在归一化设备坐标中的位置
      app.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      app.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      // 更新射线
      app.raycaster.setFromCamera(app.mouse, app.camera);
      
      // 检测射线与模型的交叉
      if (app.model) {
        // 获取 "A座配电室" 模型
        const aRoomModel = app.model.getObjectByName('A座配电室');
        
        // if (aRoomModel) {
        //   const intersects = app.raycaster.intersectObject(aRoomModel, true); // 只检测 "A座配电室" 模型
        //   if (intersects.length > 0) {
        //     const object = intersects[0].object;
        //     console.log('点击的对象:', object.name, object);
            
        //     // 如果需要，可以在这里添加高亮显示被点击对象的代码
        //     if (app.outlinePass && app.selectedObjects) {
        //       app.selectedObjects = [object];
        //       app.outlinePass.selectedObjects = app.selectedObjects;
        //     }
        //   }
        // }
      }
      if (app.model) {
        const intersects = app.raycaster.intersectObjects(app.model.children, true);
    // 筛选可见的模型
    // const intersects = app.raycaster.intersectObjects(app.model.children.filter(child => child.visible), true);
    if (intersects.length > 0) {
      const object = intersects[0].object;
      console.log('点击的对象:', object.name, object);
      
      // 如果需要，可以在这里添加高亮显示被点击对象的代码
      if (app.outlinePass && app.selectedObjects) {
        app.selectedObjects = [object];
        app.outlinePass.selectedObjects = app.selectedObjects;
      }
    }
  }
    });
    
    const urls = [
      {
        type: 'rgbe',
        url: 'texture/royal_esplanade_1k.hdr',
        onLoad: (texture) => {
          const pmremGenerator = new THREE.PMREMGenerator(app.renderer);
          pmremGenerator.compileEquirectangularShader();
          app.envMap = pmremGenerator.fromEquirectangular(texture).texture;
        }
      },
      {
        // type: 'glb',
        // url: 'model/model.glb',
        type: 'gltf',
        url: 'model/diankeyuan/diankeyuan.gltf',
        onLoad: (object) => {
          console.log(object);

          app.model = object.scene;
          // const floorLight = new THREE.PointLight('#ffffff', 1, 10);
          // floorLight.castShadow = false;
          // const roadLight = new THREE.PointLight('#ffffff', 1, 30);
          // roadLight.castShadow = false;
          const receiveModels = ['平面017_1', '平面017_2', '平面017_3', '平面017_4'];
          const bloomModels = ['楼间隔', '承重柱', '玻璃', '路灯面', '停车线', '顶亮面', '车流线'];
          
          // 查找 shu04008_1 对象并在其上方添加光源
          let targetObject = null;
          
          app.model.traverse((obj) => {
            // 找到 shu04008_1 对象
            if (obj.name === 'shu04008_1') {
              targetObject = obj;
            }
            
            // 将所有模型的材质储存在app.modelMaterials，在后续改变材质使用
            if (obj.material) {
              app.modelMaterials[obj.name] = {
                material: obj.material
              };
              if (obj.name === '其余建筑_1') {
                obj.material.envMap = app.envMap;
              }
            }
            // 将模型的坐标也储存一份，在做楼层动画使用
            let { x, y, z } = obj.position;
            obj.position_tmp = { x, y, z };

            // 接收投影设置
            if (receiveModels.includes(obj.name)) {
              obj.receiveShadow = true;
            } else {
              obj.castShadow = true;
              obj.receiveShadow = false;
            }

            if (obj.name.indexOf('车流线1') > -1) {
              obj.material = secondaryMaterial;
            }

            if (obj.name.indexOf('车流线2') > -1) {
              obj.material = trunkMaterial;
            }

            if (obj.name.indexOf('车流线3') > -1) {
              obj.material = trunkMaterial;
            }
            if (obj.name.indexOf('墙面') > -1 || obj.name.indexOf('-墙面') > -1) {
              obj.layers.enable(1);
              if (obj.material) {
                obj.material.emissive = new THREE.Color(0x666666);
                obj.material.emissiveIntensity = 1;
              }
  
              // console.log('墙面对象已设置发光:', obj.name);
            } else {
              // 检查是否匹配任何需要发光的模型名称
              for (let i = 0; i < bloomModels.length; i++) {
                const value = bloomModels[i];
                if (obj.name.indexOf(value) > -1) {
                  obj.layers.enable(1);
                  break;
                }
              }
            }
          });
          
          // 如果找到了 shu04008_1，在其上方添加光源
          if (targetObject) {
            // 获取目标对象的世界位置
            const worldPosition = new THREE.Vector3();
            targetObject.getWorldPosition(worldPosition);
            
            // 在世界位置的基础上调整光源位置
            worldPosition.y += 10;
            // worldPosition.z += 10;
            
            // 创建点光源，增加强度和照射范围
            const objectLight = new THREE.PointLight('#ffffff', 5, 50);
            objectLight.position.copy(worldPosition);
            objectLight.castShadow = true;
            
            // 设置阴影参数
            objectLight.shadow.mapSize.width = 2048;
            objectLight.shadow.mapSize.height = 2048;
            objectLight.shadow.camera.near = 0.5;
            objectLight.shadow.camera.far = 60;
            
            // 添加到场景
            app.scene.add(objectLight);
            
            // 不再添加光源辅助对象
            
            console.log('在 shu04008_1 上方添加了增强光源');
          } else {
            console.warn('未找到 shu04008_1 对象');
          }
        }
      },
      // 直接在主模型加载过程中加载A-room模型
      {
        type: 'gltf',
        url: 'model/A-room/A-room.gltf',
        onLoad: (object) => {
          // 保存模型但不添加到场景
          app.aRoomModel = object.scene;
          
          // 缩小模型0.1倍
          app.aRoomModel.scale.set(0.3, 0.3, 0.3);
          
          // 隐藏模型
          app.aRoomModel.visible = false;
          
          console.log('A-room模型加载完成');
        }
      },
      {
        type: 'gltf',
        url: 'model/B-room/B-room.gltf',
        onLoad: (object) => {
          // 保存模型但不添加到场景
          app.bRoomModel = object.scene;
          
          // 缩小模型0.3倍
          app.bRoomModel.scale.set(0.3, 0.3, 0.3);
          
          // 隐藏模型
          app.bRoomModel.visible = false;
          
          console.log('B-room模型加载完成');
        }
      },
      {
        type: 'gltf',
        url: 'model/D-room/D-room.gltf',
        onLoad: (object) => {
          // 保存模型但不添加到场景
          app.dRoomModel = object.scene;
          
          // 缩小模型0.3倍
          app.dRoomModel.scale.set(0.3, 0.3, 0.3);
          
          // 隐藏模型
          app.dRoomModel.visible = false;
          
          console.log('D-room模型加载完成');
        }
      }
    ];

    let urlsLength = urls.length;
    app.iterateLoad(
      urls,
      (xhr) => {
        let proportion = parseInt((xhr.loaded / xhr.total) * 100);
        if (proportion === 100) {
          EventBus.$emit('changeLoaidng', parseInt(100 / urlsLength));
          urlsLength--;
          if (urlsLength <= 1) {
            EventBus.$emit('changeScene', true);
          }
        }
      },
      () => {
        app.scene.add(app.model);
        
        // 将A-room模型添加到场景但保持隐藏状态
        if (app.aRoomModel) {
          app.scene.add(app.aRoomModel);
          console.log('A-room模型已添加到场景（隐藏状态）');
        }
        
        resolve();
      }
    );
  });
}

/**
 * 设置模型默认材质
 * @param {*} app
 */
export function setModelDefaultMatrial(app) {
  // 导入车流线需要的材质
  const { secondaryMaterial, trunkMaterial } = require('./material');
  
  app.model.traverse((obj) => {
    if (obj.material) {
      // 特别处理车流线模型
      if (obj.name.indexOf('车流线1') > -1) {
        obj.material = secondaryMaterial;
      } else if (obj.name.indexOf('车流线2') > -1 || obj.name.indexOf('车流线3') > -1) {
        obj.material = trunkMaterial;
      }
      // 如果存在userData中的originalMaterial，优先使用它
      else if (obj.userData.originalMaterial) {
        obj.material = obj.userData.originalMaterial;
        delete obj.userData.originalMaterial;
      } 
      // 否则尝试从app.modelMaterials中恢复
      else if (app.modelMaterials[obj.name] && app.modelMaterials[obj.name].material) {
        obj.material = app.modelMaterials[obj.name].material;
      }
      
      // 移除可能存在的红色材质
      if (obj.material && obj.material.color && 
          obj.material.color.r > 0.9 && obj.material.color.g < 0.3 && obj.material.color.b < 0.3) {
        // 这可能是一个红色材质，尝试恢复
        if (app.modelMaterials[obj.name] && app.modelMaterials[obj.name].material) {
          obj.material = app.modelMaterials[obj.name].material;
        }
      }
    }
  });
}

/**
 * 清空控制器组
 * @param {*} app
 * @returns
 */
export function destroyControlGroup(app, className) {
  if (app?.controlGroup?.children?.length === 0) {
    return;
  }
  if (className) {
    destroyControlGroupText(app, className);
  }
  for (let i = app.controlGroup.children.length - 1; i > -1; i--) {
    const obj = app.controlGroup.children[i];
    if (obj.isMesh) {
      obj.geometry.dispose();
      obj.material.dispose();
      app.controlGroup.remove(obj);
    }
  }
}

/**
 * 清空控制器组的文本
 * @param {*} app
 * @returns
 */
export function destroyControlGroupText(app, className) {
  const textDoms = document.getElementsByClassName(className);
  for (let i = 0; i < textDoms.length; i++) {
    const textDom = textDoms[i];
    textDom.onclick = null;
  }
  app.instance.removeAll(app.controlGroup);
}
