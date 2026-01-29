import { CSS3DSprite } from 'three/examples/jsm/renderers/CSS3DRenderer';
import * as THREE from 'three';
import { floorBaseMaterial } from './material';
import EventBus from '../bus';
import { destroyControlGroupText, destroyControlGroup } from '@/three/loaderModel';
import { roomTexts } from '@/assets/mock/mock';
// 导入车流线使用的纹理和材质
import { secondaryTexture, secondaryMaterial, trunkMaterial, wireMaterial } from './material';
import { roomA, roomB,roomD } from '@/config/boxConfig';

// 创建模型名称到配置和组ID的映射表
let modelConfigMap = null;
let modelGroupMap = null;

// 创建一个全局的boxConfig对象，方便其他组件访问
window.boxConfig = {
  A: null,
  B: null,
  D: null
};

/**
 * 初始化模型配置映射表和模型组映射表
 */
function initModelMaps() {
  if (modelConfigMap !== null) return; // 已初始化则直接返回
  modelConfigMap = {};
  modelGroupMap = {};
  // 针对每个配置，triggerModel已经改为字符串了，直接建立映射
  roomA.forEach(config => {
    modelConfigMap[config.triggerModel] = config;
    modelGroupMap[config.triggerModel] = config.id; // 建立模型名到组ID的映射
  });
  
  // 添加D座模型的映射
  roomD.forEach(config => {
    modelConfigMap[config.triggerModel] = config;
    modelGroupMap[config.triggerModel] = config.id; // 建立模型名到组ID的映射
  });
  
  console.log('模型映射表已初始化');
}

export function loaderFloorManage(app) {
  // ... existing code ...
  
  // 初始化全局boxConfig
  initBoxConfig();
  
  // ... existing code ...

  app.flyTo({
    position: [16.89, 93.81, -46.26],
    controls: [
      -32.01, 24.14, -47.11],
    done: () => {
      createFloorText(app);
    }
  });
}

/**
 * 生成楼层文本和绑定点击事件
 * @param {*} app
 */
export function createFloorText(app) {
  app.model.traverse((obj) => {
    if (obj.name.indexOf('楼顶') > -1) {
      const name = obj.name.replace('楼顶', ''); // 去除"楼顶"
      const position = Object.values(app.getModelWorldPostion(obj));
      console.log(obj.name);
      position[1] += 5;
      const html = `
        <div class="floorText-3d animated fadeIn" id="${name}" position="${position}" ><p class="text">${name}</p></div>`;
      app.instance.add({
        parent: app.controlGroup,
        cssObject: CSS3DSprite,
        name: name,
        element: html,
        position: position,
        scale: [0.05, 0.05, 0.05]
      });
    }
  });

  const textDoms = document.getElementsByClassName('floorText-3d');
  for (let i = 0; i < textDoms.length; i++) {
    const textDom = textDoms[i];
    textDom.onclick = () => {
      console.log(textDom.id);
      if (textDom.id === 'a座') {
        // 隐藏标签
        destroyControlGroup(window.app, 'floorText-3d');

        // 调整相机的远裁剪面
        app.camera.far = 100000;  // 增加远裁剪面距离
        app.camera.updateProjectionMatrix();  // 更新相机投影矩阵

        // 显示预加载的A-room模型
        showARoomModel(app);
      } else if (textDom.id === 'b座') {
        // 隐藏标签
        destroyControlGroup(window.app, 'floorText-3d');

        // 调整相机的远裁剪面
        app.camera.far = 100000;
        app.camera.updateProjectionMatrix();

        // 显示预加载的B-room模型
        showBRoomModel(app);
      } else if (textDom.id === 'd座') {
        // 隐藏标签
        destroyControlGroup(window.app, 'floorText-3d');

        // 调整相机的远裁剪面
        app.camera.far = 100000;
        app.camera.updateProjectionMatrix();

        // 显示预加载的D-room模型
        showDRoomModel(app);
      } else {
        // 原有的其他楼层点击逻辑
        // ...
      }
    };
  }
}

/**
 * 显示预加载的A-room模型
 * @param {*} app
 */
function showARoomModel(app) {
  // 如果模型已加载
  if (app.aRoomModel) {
    // 隐藏原始模型
    app.model.visible = false;
    // 显示A-room模型
    app.aRoomModel.visible = true;
    // 添加射线检测功能
    setupARoomInteraction(app);
    // 设置光照
    setupARoomLighting(app);
    // 为电线柱体添加动画材质
    setupElectricWireAnimation(app);
    // 飞行到合适位置
    app.flyTo({
      position: [-205.62253965798172, 206.3879616074446, -188.64123015669873],
      controls: [-91.7307044491467, -16.647123247703064, 1.4329682345023118]
    });
    // 新增：生成所有triggerModel对应的标签
    createTriggerLabels(app);
    console.log('A-room模型已显示');
  } else {
    // 如果模型尚未加载，则显示错误信息
    console.error('A-room模型尚未加载，无法显示');
  }
}

/**
 * 设置A-room模型的交互功能
 * @param {*} app
 */
function setupARoomInteraction(app) {
  // 初始化配置映射表
  initModelMaps();

  // 添加射线检测功能
  let isPicking = false;

  // 添加键盘监听器
  window.addEventListener('keydown', (event) => {
    if (event.key === 'p' || event.key === 'P') {
      isPicking = true;
      console.log('进入模型点击模式，点击模型查看信息');
    }
  });

  // 添加鼠标点击事件
  window.addEventListener('click', (event) => {
    // 计算鼠标在归一化设备坐标中的位置
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    // 创建射线
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, app.camera);
    // 射线与模型相交检测
    const intersects = raycaster.intersectObject(app.aRoomModel, true);
    if (intersects.length > 0) {
      // 点击aRoom内的任意模型时，不再根据模型名称判断显示box
      // 取消显示边缘发光效果等旧逻辑
      EventBus.$emit('showBox', { show: false });
      removeAllEdgeEffects(app);
      // 点击后关闭点击模式
      isPicking = false;
    } else {
      // 点击空白处也隐藏box组件
      EventBus.$emit('showBox', { show: false });
      removeAllEdgeEffects(app);
    }
  });
}
// 创建 设备标签
function createTriggerLabels(app) {
  // 遍历roomA，生成triggerModel标签
  roomA.forEach(config => {
    // 根据triggerModel名称在aRoomModel中查找对应的模型
    let triggerObj = app.aRoomModel.getObjectByName(config.triggerModel);
    if (triggerObj) {
      // 获取模型的世界位置，并向上平移一定距离（例如10个单位）
      let position = Object.values(app.getModelWorldPostion(triggerObj));
      position[1] += 10;
      // 构造标签html，内容为配置的id，内联绑定点击事件，使用字符串模板
      const html = `<div class="floorText-3d animated fadeIn" id="triggerLabel-${config.id}" position="${position}" onclick="window.triggerLabelClick(event, '${config.id}', 'A')"><p class="text">${config.id}</p></div>`;
      // 添加到CSS3D场景中
      app.instance.add({
        parent: app.controlGroup,
        cssObject: CSS3DSprite,
        name: "triggerLabel-" + config.id,
        element: html,
        position: position,
        scale: [0.05, 0.05, 0.05]
      });
    }
  });
}

window.isTriggerLabelVisible = false; // 初始状态为不显示
window.currentBuilding = null;

window.triggerLabelClick = function (event, id, building) {
  event.stopPropagation();
  console.log('triggerLabelClick 被调用, id:', id, 'building:', building);
  let config;

  building = building || 'A';

  if (building === 'A') {
    config = roomA.find(item => item.id === id);
  } else if (building === 'B') {
    config = roomB.find(item => item.id === id);
  } else if (building === 'D') {
    config = roomD.find(item => item.id === id);
  } else {
    console.warn(`未知的楼座: ${building}`);
    return;
  }

  if (config) {
    // 更新当前楼座
    window.currentBuilding = building;
    // 无论是点击同一座还是另一座的标签，都直接发送showBox事件，传入新的配置
    window.isTriggerLabelVisible = true;
    EventBus.$emit('showBox', { show: true, config });
  }
};

/**
 * 移除所有模型的边缘发光效果
 * @param {*} app 
 */
function removeAllEdgeEffects(app) {
  app.aRoomModel.traverse(obj => {
    if (obj.isMesh) {
      setModelEdgeEffect(obj, false);
    }
  });
}

/**
 * 设置A-room模型的光照
 * @param {*} app
 */
function setupARoomLighting(app) {
  // 清除可能存在的旧光源
  cleanupExtraLights(app);

  // 添加A-room专用光源
  // 半球光
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
  hemiLight.position.set(0, 20, 0);
  hemiLight.userData.isARoomLight = true;
  app.scene.add(hemiLight);

  // 环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  ambientLight.userData.isARoomLight = true;
  app.scene.add(ambientLight);

  // 点光源
  const pointLight1 = new THREE.PointLight(0xffffff, 0.5, 50);
  pointLight1.position.set(-10, 15, -10);
  pointLight1.userData.isARoomLight = true;
  app.scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xffffff, 0.5, 50);
  pointLight2.position.set(10, 15, 10);
  pointLight2.userData.isARoomLight = true;
  app.scene.add(pointLight2);

  // 方向光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(5, 10, 5);
  directionalLight.userData.isARoomLight = true;
  app.scene.add(directionalLight);

  console.log('已设置A-room专用光源');
  
  // 设置A座配电室的光照
  setupARoomPowerRoomLighting(app);
}

/**
 * 设置A座配电室的光照
 * @param {*} app
 */
function setupARoomPowerRoomLighting(app) {
  // 查找A座配电室模型
  let powerRoom = null;
  app.aRoomModel.traverse((obj) => {
    if (obj.isMesh && obj.name.indexOf('配电室') !== -1) {
      powerRoom = obj;
    }
  });

  if (powerRoom) {
    // 获取配电室的世界位置
    const worldPosition = new THREE.Vector3();
    powerRoom.getWorldPosition(worldPosition);

    // 设置科幻风格的背景色 - 使用更浅的颜色，不影响模型显示
    app.renderer.setClearColor(new THREE.Color('#0c1520'), 1); // 深蓝色背景，但更浅
    app.scene.background = new THREE.Color('#0c1520');
    
    // 移除雾效果，避免影响模型显示
    app.scene.fog = null;
     
    // 在配电室上方添加点光源
    const powerRoomLight = new THREE.PointLight('#ffffff', 3.5, 50);
    powerRoomLight.position.copy(worldPosition);
    powerRoomLight.position.y += 10; // 在配电室上方10个单位
    powerRoomLight.castShadow = true;
    powerRoomLight.userData.isARoomLight = true;

    // 设置阴影参数
    powerRoomLight.shadow.mapSize.width = 2048;
    powerRoomLight.shadow.mapSize.height = 2048;
    powerRoomLight.shadow.camera.near = 0.5;
    powerRoomLight.shadow.camera.far = 60;

    // 添加到场景
    app.scene.add(powerRoomLight);
    
    // 添加配电室专用环境光，使用科幻蓝色调
    const powerRoomAmbient = new THREE.AmbientLight('#4080ff', 0.3);
    powerRoomAmbient.userData.isARoomLight = true;
    app.scene.add(powerRoomAmbient);
    
    // 添加一个额外的填充光，用于照亮配电室内部阴暗区域
    const fillLight = new THREE.PointLight('#40a0ff', 0.8, 30);
    fillLight.position.copy(worldPosition);
    // 将填充光放在配电室内部偏下的位置
    fillLight.position.y -= 5;
    fillLight.userData.isARoomLight = true;
    app.scene.add(fillLight);
   
    // 设置配电室接收阴影
    powerRoom.receiveShadow = true;

    console.log('已设置A座配电室专用光源和科幻背景');
    
    // 触发电路图按钮显示
    // 使用直接导入的EventBus，不使用require
    console.log('触发enterPowerRoom事件, roomId: A-PowerRoom');
    
    // 先触发离开事件，确保状态重置
    EventBus.$emit('leavePowerRoom');
    
    // 延迟100ms后触发进入事件，避免状态冲突
    setTimeout(() => {
      EventBus.$emit('enterPowerRoom', 'A-PowerRoom');
      
      // 设置电路图与box组件的联动
      // 当box组件点击设备时，更新电路图中对应设备的连接状态
      app.powerRoomInteractionEnabled = true;
      
      // 初始化电路图中的设备状态为未连接
      EventBus.$emit('resetCircuitConnections');
    }, 100);
  } else {
    console.warn('未找到A座配电室模型');
  }
}

/**
 * 为电线柱体设置动画材质
 * @param {*} app 
 */
function setupElectricWireAnimation(app) {


  // 电线柱体名称数组
  const wireNames = ['柱体694', '柱体688', '柱体689', '柱体691', '柱体693', '柱体690', '柱体695', '柱体692'];

  // 遍历模型查找电线柱体并应用材质
  app.aRoomModel.traverse((obj) => {
    if (obj.isMesh && wireNames.includes(obj.name)) {
      console.log('找到电线柱体:', obj.name);
      // 保存原始材质以便需要时恢复
      obj.userData.originalMaterial = obj.material;
      // 应用与车流线相同的材质
      obj.material = wireMaterial.clone(); // 克隆材质以避免影响原始车流线
    }
  });

  // 创建更新函数
  window.updateElectricAnimation = () => {
    if (app.aRoomModel && app.aRoomModel.visible) {
      // 与车流线完全相同的动画逻辑
      // 注意：这里不需要更新secondaryTexture，因为Home.vue中已经在更新它
      // 如果需要独立控制，可以为每个电线柱体设置独立的材质和纹理
      wireNames.forEach(name => {
        const obj = app.aRoomModel.getObjectByName(name);
        if (obj && obj.material && obj.material.map) {
          obj.material.map.offset.y += 0.01; // 垂直方向流动
        }
      });
    }
  };

  // 将更新函数添加到EventBus
  EventBus.$emit('addRenderTask', 'electricAnimation', window.updateElectricAnimation);
}

/**
 * 移除电线动画效果并恢复原始模型
 * @param {*} app 
 */
export function removeElectricWireAnimation(app) {
  // 通过EventBus移除渲染任务
  EventBus.$emit('removeRenderTask', 'electricAnimation');
  
  // 恢复原始材质
  if (app.aRoomModel) {
    const wireNames = ['柱体694', '柱体688', '柱体689', '柱体691'];
    app.aRoomModel.traverse((obj) => {
      if (obj.isMesh && wireNames.includes(obj.name) && obj.userData.originalMaterial) {
        obj.material = obj.userData.originalMaterial;
      }
    });
  }
  
  // 隐藏A-room模型
  if (app.aRoomModel) {
    app.aRoomModel.visible = false;
  }

  // 隐藏B-room模型
  if (app.bRoomModel) {
    app.bRoomModel.visible = false;
  }
  
  // 隐藏D-room模型
  if (app.dRoomModel) {
    app.dRoomModel.visible = false;
  }
  
  // 显示原始模型
  if (app.model) {
    app.model.visible = true;
  }

  // 清除所有额外添加的光源
  cleanupExtraLights(app);
  
  // 恢复原始背景色和雾效果
  app.renderer.setClearColor(new THREE.Color('#000000'), 1);
  app.scene.background = new THREE.Color('#000000');
  app.scene.fog = new THREE.Fog('#000000', 100, 480);
  
  // 重置电源交互状态
  app.powerRoomInteractionEnabled = false;
  
  // 返回主场景视角
  returnToMainScene(app);
  
  // 触发电路图按钮隐藏，延迟执行避免冲突
  console.log('触发leavePowerRoom事件');
  setTimeout(() => {
    EventBus.$emit('leavePowerRoom');
  }, 100);
}

/**
 * 返回主场景视角
 * @param {*} app 
 */
export function returnToMainScene(app) {
  // 隐藏并移除 B座模型
  if (app.bRoomModel) {
    app.bRoomModel.visible = false;
    if (app.bRoomModel.parent) {
      app.scene.remove(app.bRoomModel);
    }
  }
  
  // 隐藏并移除 D座模型
  if (app.dRoomModel) {
    app.dRoomModel.visible = false;
    if (app.dRoomModel.parent) {
      app.scene.remove(app.dRoomModel);
    }
  }
  
  // 确保主模型被添加到场景并可见
  if (app.model) {
    if (!app.model.parent) {
      app.scene.add(app.model);
    }
    app.model.visible = true;
  }
  // 清除所有额外添加的光源（如有必要）
  cleanupExtraLights(app);
  // 使用 flyTo 方法平滑过渡到主场景视角
  app.flyTo({
    position: [16.89, 93.81, -46.26],
    controls: [-32.01, 24.14, -47.11],
    duration: 1000,
    done: () => {
      console.log('已返回主场景视角');
    }
  });
}

/**
 * 清除所有额外添加的光源
 * @param {*} app 
 */
function cleanupExtraLights(app) {
  // 找出所有额外添加的光源并移除
  const lightsToRemove = [];

  app.scene.traverse((obj) => {
    if (obj instanceof THREE.Light && (obj.userData.isARoomLight || obj.userData.isBRoomLight || obj.userData.isDRoomLight)) {
      lightsToRemove.push(obj);
    }
  });

  // 移除找到的光源
  lightsToRemove.forEach(light => {
    app.scene.remove(light);
  });

  console.log(`已清除 ${lightsToRemove.length} 个额外光源`);

  // 重置场景雾效果
  app.scene.fog = null;
  
  // 重置背景色为透明
  app.scene.background = null;
  app.renderer.setClearColor(0x000000, 0);
}

/**
 * 生成摄像头、房间文本和绑定点击事件
 * @param {*} app
 */
export function createRoomText(app, model) {
  model.traverse((obj) => {
    if (obj.isMesh) {
      roomTexts.forEach((item) => {
        if (obj.name.indexOf(item.name) > -1) {
          console.log(obj.name);
          const name = obj.name;
          const position = Object.values(app.getModelWorldPostion(obj));
          position[0] += item.x;
          position[1] += item.y;
          position[2] += item.z;
          const html = `
        <div class="room-3d animated fadeIn"  _type="${item.type}"  id="${name}" position="${position}" >
          <p class="text">${name}</p>
          <div class="${item.class}"></div>
        </div>`;
          app.instance.add({
            parent: app.controlGroup,
            cssObject: CSS3DSprite,
            name: name,
            element: html,
            position: position,
            scale: [0.01, 0.01, 0.01]
          });
        }
      });
    }
  });

  const textDoms = document.getElementsByClassName('room-3d');
  for (let i = 0; i < textDoms.length; i++) {
    const textDom = textDoms[i];
    textDom.onclick = (event) => {
      const type = textDom.getAttribute('_type');
      const model = app.model.getObjectByName(textDom.id);
      EventBus.$emit('changeRoomTooltip', {
        name: model.name,
        type,
        x: event.x,
        y: event.y,
        show: true
      });
    };
  }
}

/**
 * 设置当前楼层动画函数
 * @param {*} app
 * @param {*} model
 * @param {*} layerName
 * @param {*} layerData
 * @param {*} callback
 */
export function setModelLayer(app, model, layerName, layerData, callback) {
  // 清除当前楼层文本
  destroyControlGroupText(app, 'room-3d');
  const currentLayer = Number(layerName.substring(0, layerName.indexOf('F')));
  for (let i = 0; i < model.children.length; i++) {
    let mesh = model.children[i];
    let name = mesh.name;
    let num;

    // 对楼顶特殊处理
    if (name.indexOf('楼顶') > -1) {
      num = Object.values(layerData).length + 1;
    } else {
      num = Number(name.substring(0, name.indexOf('F')));
    }

    let value = num - currentLayer;
    let position = mesh.position;
    let position_tmp = mesh.position_tmp;
    let toPosition;

    if (layerName === '全楼') {
      // 点击全部楼层时执行
      toPosition = [position_tmp.x, position_tmp.y, position_tmp.z];
    } else {
      if (value >= 1) {
        toPosition = [position_tmp.x, position_tmp.y + value * 20, position_tmp.z];
      } else {
        toPosition = [position_tmp.x, position_tmp.y, position_tmp.z];
      }
    }

    app.modelMove(
      {
        fromPosition: [position.x, position.y, position.z],
        toPosition,
        duration: 300,
        done: () => {
          if (layerName === '全楼') {
            if (callback) {
              callback();
              return;
            }
            const centerPosition = Object.values(app.getModelWorldPostion(model));
            app.flyTo({
              position: [centerPosition[0] + 40, centerPosition[1] + 50, centerPosition[2] + 40],
              controls: centerPosition
            });
            return;
          }
          if (mesh.name.indexOf(layerName) > -1) {
            if (callback) {
              callback();
              return;
            }
            // 计算当前点击模型的中心点
            const centerPosition = Object.values(app.getCalculationPostion(mesh));
            app.flyTo({
              position: [centerPosition[0] + 15, centerPosition[1] + 20, centerPosition[2] + 15],
              controls: centerPosition,
              done: () => {
                createRoomText(app, mesh);
              }
            });
          }
        }
      },
      mesh
    );
  }
}

/**
 * 设置模型的蓝色边缘发光效果
 * @param {*} model 
 * @param {*} enable 
 */
function setModelEdgeEffect(model, enable) {
  if (!model || !model.geometry) return;

  if (enable) {
    if (!model.userData.edges) {
      const edges = new THREE.EdgesGeometry(model.geometry);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x00ffff }));
      line.name = 'edgeLine';
      model.add(line);
      model.userData.edges = line;
    }

    // 添加闪烁动画
    if (!model.userData.blink) {
      model.userData.blink = true;
      const initialOpacity = model.userData.edges.material.opacity;
      let direction = -1;

      function blink() {
        if (model.userData.blink) {
          const opacity = model.userData.edges.material.opacity;
          if (opacity <= 0 || opacity >= initialOpacity) {
            direction *= -1;
          }
          model.userData.edges.material.opacity += direction * 0.05;
          requestAnimationFrame(blink);
        }
      }

      blink();
    }
  } else {
    if (model.userData.edges) {
      model.remove(model.userData.edges);
      model.userData.edges = null;
    }
    model.userData.blink = false;
  }
}

// 添加显示B座模型的函数
function showBRoomModel(app) {
  // 隐藏主模型
  if (app.model) {
    app.model.visible = false;
  }

  // 隐藏A座模型（如果存在）
  if (app.aRoomModel) {
    app.aRoomModel.visible = false;
  }

  // 显示B座模型
  if (app.bRoomModel) {
    app.bRoomModel.visible = true;

    // 将B座模型添加到场景（如果还没有添加）
    if (!app.bRoomModel.parent) {
      app.scene.add(app.bRoomModel);
    }

    // 设置B座模型的光照
    setupBRoomLighting(app);

    // 设置B座配电室的光照
    setupBRoomPowerRoomLighting(app);

    // 使用flyTo方法平滑过渡到新的相机位置
    app.flyTo({
      position: [24.151990295168915, 100.26721464448161, -122.52672864267403],
      controls: [-24.595566220945525, 5.193444765493946, -7.445519158492129],
      duration: 1000,
      done: () => {
        console.log('B座模型视角切换完成');
      }
    });

    console.log('B座模型已显示');
  } else {
    console.warn('B座模型未加载');
  }
  roomB.forEach(config => {
    // 根据triggerModel名称在bRoomModel中查找对应的模型 
    let triggerObj = app.bRoomModel.getObjectByName(config.triggerModel);
    if (triggerObj) {
      // 获取模型的世界位置，并向上偏移一定距离
      let position = Object.values(app.getModelWorldPostion(triggerObj));
      position[1] += 10;
      // 构造标签html，内容为配置的id，内联绑定点击事件
      const html = `<div class="floorText-3d animated fadeIn" id="triggerLabel-${config.id}" position="${position}" onclick="window.triggerLabelClick(event, '${config.id}', 'B')"><p class="text">${config.id}</p></div>`;
      // 添加到CSS3D场景中
      app.instance.add({
        parent: app.controlGroup,
        cssObject: CSS3DSprite,
        name: "triggerLabel-" + config.id,
        element: html,
        position: position,
        scale: [0.05, 0.05, 0.05]
      });
    }
  });
}

/**
 * 设置B座配电室的光照
 * @param {*} app
 */
function setupBRoomPowerRoomLighting(app) {
  // 查找B座配电室模型
  let powerRoom = null;
  app.bRoomModel.traverse((obj) => {
    if (obj.isMesh && obj.name.indexOf('配电室') !== -1) {
      powerRoom = obj;
    }
  });

  if (powerRoom) {
    // 获取配电室的世界位置
    const worldPosition = new THREE.Vector3();
    powerRoom.getWorldPosition(worldPosition);

    // 设置科幻风格的背景色 - 使用更浅的颜色，不影响模型显示
    app.renderer.setClearColor(new THREE.Color('#0c1520'), 1); // 深蓝色背景，但更浅
    app.scene.background = new THREE.Color('#0c1520');
    
    // 移除雾效果，避免影响模型显示
    app.scene.fog = null;
    
    // 在配电室上方添加点光源，降低强度从5降到3.5，避免过曝
    const powerRoomLight = new THREE.PointLight('#ffffff', 3.5, 50);
    powerRoomLight.position.copy(worldPosition);
    powerRoomLight.position.y += 10; // 在配电室上方10个单位
    powerRoomLight.castShadow = true;
    powerRoomLight.userData.isBRoomLight = true;

    // 设置阴影参数
    powerRoomLight.shadow.mapSize.width = 2048;
    powerRoomLight.shadow.mapSize.height = 2048;
    powerRoomLight.shadow.camera.near = 0.5;
    powerRoomLight.shadow.camera.far = 60;

    // 添加到场景
    app.scene.add(powerRoomLight);
    
    // 添加配电室专用环境光，使用科幻蓝色调
    const powerRoomAmbient = new THREE.AmbientLight('#4080ff', 0.3);
    powerRoomAmbient.userData.isBRoomLight = true;
    app.scene.add(powerRoomAmbient);
    
    // 添加一个额外的填充光，用于照亮配电室内部阴暗区域
    const fillLight = new THREE.PointLight('#40a0ff', 0.8, 30);
    fillLight.position.copy(worldPosition);
    // 将填充光放在配电室内部偏下的位置
    fillLight.position.y -= 5;
    fillLight.userData.isBRoomLight = true;
    app.scene.add(fillLight);
    
    // 设置配电室接收阴影
    powerRoom.receiveShadow = true;

    console.log('已设置B座配电室专用光源和科幻背景');
  } else {
    console.warn('未找到B座配电室模型');
  }
}

/**
 * 设置B-room模型的光照
 * @param {*} app
 */
function setupBRoomLighting(app) {
  // 清除可能存在的旧光源
  cleanupExtraLights(app);

  // 添加B-room专用光源
  // 半球光
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
  hemiLight.position.set(0, 20, 0);
  hemiLight.userData.isBRoomLight = true;
  app.scene.add(hemiLight);

  // 环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  ambientLight.userData.isBRoomLight = true;
  app.scene.add(ambientLight);

  // 点光源
  const pointLight1 = new THREE.PointLight(0xffffff, 0.5, 50);
  pointLight1.position.set(-10, 15, -10);
  pointLight1.userData.isBRoomLight = true;
  app.scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xffffff, 0.5, 50);
  pointLight2.position.set(10, 15, 10);
  pointLight2.userData.isBRoomLight = true;
  app.scene.add(pointLight2);

  // 方向光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(5, 10, 5);
  directionalLight.userData.isBRoomLight = true;
  app.scene.add(directionalLight);

  // 添加指定位置的大范围光源
  const largeAreaLight = new THREE.PointLight('#ffffff', 2, 300); // 强度2，范围200
  largeAreaLight.position.set(49.13777547956505, 111.87808647117008, -92.75804924571477);
  largeAreaLight.castShadow = true;
  largeAreaLight.userData.isBRoomLight = true;

  // 设置阴影参数
  largeAreaLight.shadow.mapSize.width = 2048;
  largeAreaLight.shadow.mapSize.height = 2048;
  largeAreaLight.shadow.camera.near = 0.5;
  largeAreaLight.shadow.camera.far = 300; // 增加远裁剪面以适应大范围

  // 添加到场景
  app.scene.add(largeAreaLight);

  console.log('已设置B-room专用光源');
}

/**
 * 显示D座模型
 * @param {*} app 
 */
function showDRoomModel(app) {
  // 隐藏主模型
  if (app.model) {
    app.model.visible = false;
  }

  // 隐藏A座模型（如果存在）
  if (app.aRoomModel) {
    app.aRoomModel.visible = false;
  }

  // 隐藏B座模型（如果存在）
  if (app.bRoomModel) {
    app.bRoomModel.visible = false;
  }

  // 显示D座模型
  if (app.dRoomModel) {
    app.dRoomModel.visible = true;

    // 将D座模型添加到场景（如果还没有添加）
    if (!app.dRoomModel.parent) {
      app.scene.add(app.dRoomModel);
    }
    
    // 设置D座模型的光照
    setupDRoomLighting(app);

    // 使用flyTo方法平滑过渡到新的相机位置
    app.flyTo({
      position: [-209.0643556789758, 158.67033052041282, -301.35525738101046],
      controls: [-6.592623149935286, -27.650576206871794, -103.42556654567807],
      duration: 1000,
      done: () => {
        console.log('D座模型视角切换完成');
      }
    });

    console.log('D座模型已显示');
  } else {
    console.warn('D座模型未加载');
  }
  
  // 为D座模型创建标签
  roomD.forEach(config => {
    // 根据triggerModel名称在dRoomModel中查找对应的模型 
    let triggerObj = app.dRoomModel.getObjectByName(config.triggerModel);
    if (triggerObj) {
      // 获取模型的世界位置，并向上偏移一定距离
      let position = Object.values(app.getModelWorldPostion(triggerObj));
      position[1] += 10;
      // 构造标签html，内容为配置的id，内联绑定点击事件
      const html = `<div class="floorText-3d animated fadeIn" id="triggerLabel-${config.id}" position="${position}" onclick="window.triggerLabelClick(event, '${config.id}', 'D')"><p class="text">${config.id}</p></div>`;
      // 添加到CSS3D场景中
      app.instance.add({
        parent: app.controlGroup,
        cssObject: CSS3DSprite,
        name: "triggerLabel-" + config.id,
        element: html,
        position: position,
        scale: [0.05, 0.05, 0.05]
      });
    }
  });
}

/**
 * 设置D-room模型的光照
 * @param {*} app
 */
function setupDRoomLighting(app) {
  // 清除可能存在的旧光源
  cleanupExtraLights(app);

  // 添加D-room专用光源
  // 半球光
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
  hemiLight.position.set(0, 20, 0);
  hemiLight.userData.isDRoomLight = true;
  app.scene.add(hemiLight);

  // 环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  ambientLight.userData.isDRoomLight = true;
  app.scene.add(ambientLight);

  // 点光源
  const pointLight1 = new THREE.PointLight(0xffffff, 0.5, 50);
  pointLight1.position.set(-10, 15, -10);
  pointLight1.userData.isDRoomLight = true;
  app.scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xffffff, 0.5, 50);
  pointLight2.position.set(10, 15, 10);
  pointLight2.userData.isDRoomLight = true;
  app.scene.add(pointLight2);

  // 方向光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(5, 10, 5);
  directionalLight.userData.isDRoomLight = true;
  app.scene.add(directionalLight);

  // 添加指定位置的大范围光源
  const largeAreaLight = new THREE.PointLight('#ffffff', 2, 300); // 强度2，范围300
  largeAreaLight.position.set(-100, 150, -200);
  largeAreaLight.castShadow = true;
  largeAreaLight.userData.isDRoomLight = true;
  
  // 设置阴影参数
  largeAreaLight.shadow.mapSize.width = 2048;
  largeAreaLight.shadow.mapSize.height = 2048;
  largeAreaLight.shadow.camera.near = 0.5;
  largeAreaLight.shadow.camera.far = 300; // 增加远裁剪面以适应大范围
  
  // 添加到场景
  app.scene.add(largeAreaLight);
  
  console.log('已设置D-room专用光源');
  
  // 设置D座配电室的光照
  setupDRoomPowerRoomLighting(app);
}

/**
 * 设置D座配电室的光照
 * @param {*} app
 */
function setupDRoomPowerRoomLighting(app) {
  // 查找D座配电室模型
  let powerRoom = null;
  app.dRoomModel.traverse((obj) => {
    if (obj.isMesh && obj.name.indexOf('配电室') !== -1) {
      powerRoom = obj;
    }
  });

  if (powerRoom) {
    // 获取配电室的世界位置
    const worldPosition = new THREE.Vector3();
    powerRoom.getWorldPosition(worldPosition);

    // 设置科幻风格的背景色 - 使用更浅的颜色，不影响模型显示
    app.renderer.setClearColor(new THREE.Color('#0c1520'), 1); // 深蓝色背景，但更浅
    app.scene.background = new THREE.Color('#0c1520');
    
    // 移除雾效果，避免影响模型显示
    app.scene.fog = null;
    
    // 在配电室上方添加点光源
    const powerRoomLight = new THREE.PointLight('#ffffff', 3.5, 50);
    powerRoomLight.position.copy(worldPosition);
    powerRoomLight.position.y += 10; // 在配电室上方10个单位
    powerRoomLight.castShadow = true;
    powerRoomLight.userData.isDRoomLight = true;

    // 设置阴影参数
    powerRoomLight.shadow.mapSize.width = 2048;
    powerRoomLight.shadow.mapSize.height = 2048;
    powerRoomLight.shadow.camera.near = 0.5;
    powerRoomLight.shadow.camera.far = 60;

    // 添加到场景
    app.scene.add(powerRoomLight);
    
    // 添加配电室专用环境光，使用科幻蓝色调
    const powerRoomAmbient = new THREE.AmbientLight('#4080ff', 0.3);
    powerRoomAmbient.userData.isDRoomLight = true;
    app.scene.add(powerRoomAmbient);
    
    // 添加一个额外的填充光，用于照亮配电室内部阴暗区域
    const fillLight = new THREE.PointLight('#40a0ff', 0.8, 30);
    fillLight.position.copy(worldPosition);
    // 将填充光放在配电室内部偏下的位置
    fillLight.position.y -= 5;
    fillLight.userData.isDRoomLight = true;
    app.scene.add(fillLight);
   

    // 设置配电室接收阴影
    powerRoom.receiveShadow = true;

    console.log('已设置D座配电室专用光源和科幻背景');
  } else {
    console.warn('未找到D座配电室模型');
  }
}

window.addEventListener('click', function (event) {
  if (window.currentBuilding === 'B' && !event.target.closest('.floorText-3d')) {
    // 如果当前显示的是B座设备详情，且点击的不是B座标签，则隐藏设备详情
    window.isTriggerLabelVisible = false;
    EventBus.$emit('showBox', { show: false });
  }
});

// 初始化boxConfig
function initBoxConfig() {
  console.log('初始化全局boxConfig');
  
  // 创建更全面的配置映射
  window.boxConfig = {
    A: {},
    B: {},
    D: {}
  };
  
  // A区配置 - 加载更多配置
  roomA.forEach(config => {
    if (config.id) {
      // 将所有设备配置按ID索引存储，方便查询
      window.boxConfig.A[config.id] = config;
      console.log(`找到A区设备${config.id}配置`);
      
      // 特别记录包含特定设备的配置
      if (config.id === '15AL9') {
        window.boxConfig.A.main = config; // 设为默认主配置
        console.log('找到A区设备15AL9(东侧电热开水器)配置');
      }
      
      if (config.id === '15AL7') {
        window.boxConfig.A.elevators = config; // 电梯配置
        console.log('找到A区设备15AL7(电梯)配置');
      }
      
      // 检查每个配置是否包含特定ID的设备
      if (config.equipmentList) {
        config.equipmentList.forEach(equipment => {
          if (equipment.id === '15AL7-2') {
            console.log('找到设备15AL7-2(东侧电梯)，所属配置组:', config.id);
            window.boxConfig.A.hasEastElevator = true;
            window.boxConfig.A.eastElevatorConfig = config;
          }
          if (equipment.id === '15AL9-1') {
            console.log('找到设备15AL9-1(东侧电热开水器)，所属配置组:', config.id);
            window.boxConfig.A.hasWaterHeater = true;
            window.boxConfig.A.waterHeaterConfig = config;
          }
        });
      }
    }
  });
  
  // B区配置
  roomB.forEach(config => {
    if (config.id) {
      window.boxConfig.B[config.id] = config;
      
      // 设置B区主配置（示例，可调整）
      if (config.id.includes('15BL')) {
        window.boxConfig.B.main = config;
        console.log('找到B区设备配置:', config.id);
      }
    }
  });
  
  // D区配置
  roomD.forEach(config => {
    if (config.id) {
      window.boxConfig.D[config.id] = config;
      
      // 设置D区主配置（示例，可调整）
      if (config.id.includes('15DL')) {
        window.boxConfig.D.main = config;
        console.log('找到D区设备配置:', config.id);
      }
    }
  });
  
  console.log('全局boxConfig初始化完成');
}  