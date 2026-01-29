import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import TWEEN from 'three/examples/jsm/libs/tween.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

export default class ZThree {
  constructor(id) {
    this.id = id;
    this.el = document.getElementById(id);
  }

  // 初始化场景
  initThree() {
    let _this = this;
    let width = this.el.offsetWidth;
    let height = this.el.offsetHeight;
    this.scene = new THREE.Scene();
    this.textureLoader = new THREE.TextureLoader();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    this.camera.position.set(30, 30, 30);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    this.el.append(this.renderer.domElement);
    // this.renderer.setClearColor('#000');
    this.gui = new GUI();

    window.addEventListener(
      'resize',
      function() {
        _this.camera.aspect = _this.el.offsetWidth / _this.el.offsetHeight;
        _this.camera.updateProjectionMatrix();
        _this.renderer.setSize(_this.el.offsetWidth, _this.el.offsetHeight);
        if (_this.cssRenderer) {
          _this.cssRenderer.setSize(_this.el.offsetWidth, _this.el.offsetHeight);
        }
      },
      false
    );
  }

  // 加载天空盒
  loaderSky(path) {
    let skyTexture = new THREE.CubeTextureLoader().setPath(path).load([
      'px.jpg', //右
      'nx.jpg', //左
      'py.jpg', //上
      'ny.jpg', //下
      'pz.jpg', //前
      'nz.jpg' //后
    ]);
    return skyTexture;
  }

  initLight() {
    const ambientLight = new THREE.AmbientLight('#6d78d0', 0.4);
    this.scene.add(ambientLight);
    const folderAmbient = this.gui.addFolder('基础光源');
    folderAmbient.close();
    folderAmbient.addColor(ambientLight, 'color');
    folderAmbient.add(ambientLight, 'intensity', 0, 2.0, 0.1);

    const directionalLight = new THREE.DirectionalLight('#3e9ae0', 0.2);
    directionalLight.position.set(-100, 100, -100);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
    const folderDirectional = this.gui.addFolder('平行光');
    folderDirectional.close();
    folderDirectional.addColor(directionalLight, 'color');
    folderDirectional.add(directionalLight, 'intensity', 0, 2.0, 0.1);

    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 10;
    directionalLight.shadow.camera.far = 300;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.bias = 0.05;
    directionalLight.shadow.normalBias = 0.05;

    // const helper = new THREE.CameraHelper(directionalLight.shadow.camera);
    // this.scene.add(helper);
  }

  // 初始化helper
  initHelper() {
    this.scene.add(new THREE.AxesHelper(100));
  }

  // 初始化控制器
  initOrbitControls() {
    let controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = true;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.5;
    controls.enablePan = true;

    let cameraStartPostion, cameraEndPostion;
    controls.addEventListener('start', () => {
      cameraStartPostion = this.camera.position.clone();
      controls.isClickLock = false;
    });

    controls.addEventListener('end', () => {
      cameraEndPostion = this.camera.position;
      const startXYZ = Object.values(cameraStartPostion).reduce(function(prev, curr) {
        return prev + curr;
      });
      const endXYZ = Object.values(cameraEndPostion).reduce(function(prev, curr) {
        return prev + curr;
      });
      if (Math.abs(endXYZ - startXYZ) < 0.0001) {
        controls.isClickLock = false;
      } else {
        controls.isClickLock = true;
      }
      cameraStartPostion = null;
      cameraEndPostion = null;
    });
    this.controls = controls;
  }

  // 初始化status
  initStatus() {
    this.stats = new Stats();
    this.el.appendChild(this.stats.dom);
  }

  // 初始化射线
  initRaycaster(callback, models = this.scene.children, eventName = 'click') {
    this.raycaster = new THREE.Raycaster();
    this.rayFn = this.rayEventFn.bind(this, models, callback);
    // 绑定点击事件
    this.el.addEventListener(eventName, this.rayFn);
  }

  rayEventFn(models, callback) {
    let evt = window.event;
    let mouse = {
      x: (evt.clientX / window.innerWidth) * 2 - 1,
      y: -(evt.clientY / window.innerHeight) * 2 + 1
    };

    let activeObj = this.fireRaycaster(mouse, models);
    // if (activeObj.point) {
    //   console.log([activeObj.point.x, activeObj.point.y, activeObj.point.z]);
    //   console.log(activeObj);
    // }
    if (callback) {
      callback(activeObj, this, evt, mouse);
    }

    //鼠标的变换
    document.body.style.cursor = 'pointer';
  }

  destroyRaycaster(eventName) {
    this.raycaster = null;
    this.el.removeEventListener(eventName, this.rayFn);
  }

  // 返回选中物体
  fireRaycaster(pointer, models) {
    // 使用一个新的原点和方向来更新射线
    this.raycaster.setFromCamera(pointer, this.camera);

    let intersects = this.raycaster.intersectObjects(models, true);
    //
    if (intersects.length > 0) {
      let selectedObject = intersects[0];
      return selectedObject;
    } else {
      return false;
    }
  }

  loaderModel(option) {
    switch (option.type) {
      case 'obj':
        if (!this.objLoader) {
          this.objLoader = new OBJLoader();
        }
        if (!this.mtlLoader) {
          this.mtlLoader = new MTLLoader();
        }
        this.mtlLoader.load(option.mtlUrl || '', (materials) => {
          materials.preload();
          this.objLoader
            .setMaterials(materials)
            .load(option.url, option.onLoad, option.onProgress, option.onError);
        });
        break;

      case 'gltf':
      case 'glb':
        if (!this.gltfLoader) {
          this.gltfLoader = new GLTFLoader();
          let dracoLoader = new DRACOLoader();
          dracoLoader.setDecoderPath('draco/');
          this.gltfLoader.setDRACOLoader(dracoLoader);
        }
        this.gltfLoader.load(option.url, option.onLoad, option.onProgress, option.onError);
        break;

      case 'fbx':
        if (!this.fbxLoader) {
          this.fbxLoader = new FBXLoader();
        }
        this.fbxLoader.load(option.url, option.onLoad, option.onProgress, option.onError);
        break;

      case 'rgbe':
        if (!this.rgbeLoader) {
          this.rgbeLoader = new RGBELoader();
        }
        this.rgbeLoader.load(option.url, option.onLoad, option.onProgress, option.onError);
        break;

      case 'mp3':
      case 'wav':
        if (!this.audioaLoader) {
          this.audioaLoader = new THREE.AudioLoader();
        }
        this.audioaLoader.load(option.url, option.onLoad, option.onProgress, option.onError);
        break;

      default:
        console.error('当前只支持obj, gltf, glb, fbx, rgbe格式');
        break;
    }
  }

  // 迭代加载
  iterateLoad(objFileList, onProgress, onAllLoad) {
    let fileIndex = 0;
    let that = this;

    function iterateLoadForIt() {
      that.loaderModel({
        type: objFileList[fileIndex].type,
        dracoUrl: objFileList[fileIndex].dracoUrl,
        mtlUrl: objFileList[fileIndex].mtlUrl,
        url: objFileList[fileIndex].url,
        onLoad: function(object) {
          if (objFileList[fileIndex].onLoad) objFileList[fileIndex].onLoad(object);
          fileIndex++;
          if (fileIndex < objFileList.length) {
            iterateLoadForIt();
          } else {
            if (onAllLoad) onAllLoad();
          }
        },
        onProgress: function(xhr) {
          if (objFileList[fileIndex].onProgress) objFileList[fileIndex].onProgress(xhr, fileIndex);
          if (onProgress) onProgress(xhr, fileIndex);
        }
      });
    }
    iterateLoadForIt();
  }

  // 加载天空盒
  loaderSky(path) {
    let skyTexture = new THREE.CubeTextureLoader().setPath(path).load([
      'px.jpg', //右
      'nx.jpg', //左
      'py.jpg', //上
      'ny.jpg', //下
      'pz.jpg', //前
      'nz.jpg' //后
    ]);
    return skyTexture;
  }

  flyTo(option) {
    option.position = option.position || []; // 相机新的位置
    option.controls = option.controls || []; // 控制器新的中心点位置(围绕此点旋转等)
    option.duration = option.duration || 1000; // 飞行时间
    option.easing = option.easing || TWEEN.Easing.Linear.None;
    const curPosition = this.camera.position;
    const controlsTar = this.controls.target;
    const tween = new TWEEN.Tween({
      x1: curPosition.x, // 相机当前位置x
      y1: curPosition.y, // 相机当前位置y
      z1: curPosition.z, // 相机当前位置z
      x2: controlsTar.x, // 控制当前的中心点x
      y2: controlsTar.y, // 控制当前的中心点y
      z2: controlsTar.z // 控制当前的中心点z
    })
      .to(
        {
          x1: option.position[0], // 新的相机位置x
          y1: option.position[1], // 新的相机位置y
          z1: option.position[2], // 新的相机位置z
          x2: option.controls[0], // 新的控制中心点位置x
          y2: option.controls[1], // 新的控制中心点位置x
          z2: option.controls[2] // 新的控制中心点位置x
        },
        option.duration
      )
      .easing(TWEEN.Easing.Linear.None); // TWEEN.Easing.Cubic.InOut //匀速
    tween.onUpdate(() => {
      this.controls.enabled = false;
      this.camera.position.set(tween._object.x1, tween._object.y1, tween._object.z1);
      this.controls.target.set(tween._object.x2, tween._object.y2, tween._object.z2);
      this.controls.update();
      if (option.update instanceof Function) {
        option.update(tween);
      }
    });
    tween.onStart(() => {
      this.controls.enabled = false;
      if (option.start instanceof Function) {
        option.start();
      }
    });
    tween.onComplete(() => {
      this.controls.enabled = true;
      if (option.done instanceof Function) {
        option.done();
      }
    });
    tween.onStop(() => (option.stop instanceof Function ? option.stop() : ''));
    tween.start();
    TWEEN.add(tween);
    return tween;
  }

  getModelWorldPostion(model) {
    this.scene.updateMatrixWorld(true);
    const worldPosition = new THREE.Vector3();
    model.getWorldPosition(worldPosition);
    return worldPosition;
  }

  // 自动计算物体飞行点
  getCalculationPostion(object) {
    let Box = new THREE.Box3();
    Box.setFromObject(object);
    if (Box.isEmpty()) return;
    let min = Box.min;
    let max = Box.max;
    let width = max.x - min.x;
    let height = max.y - min.y;
    let deepth = max.z - min.z;
    // 获取绝对点坐标
    let centroid = new THREE.Vector3();
    centroid.addVectors(min, max);
    centroid.multiplyScalar(0.5);
    return centroid;
  }

  // 模型移动
  modelMove(option, obj) {
    option.fromPosition = option.fromPosition || [];
    option.toPosition = option.toPosition || [];

    option.duration = option.duration || 1000; // 飞行时间
    option.easing = option.easing || TWEEN.Easing.Linear.None;
    let tween = new TWEEN.Tween({
      x1: option.fromPosition[0],
      y1: option.fromPosition[1],
      z1: option.fromPosition[2]
    })
      .to(
        {
          x1: option.toPosition[0],
          y1: option.toPosition[1],
          z1: option.toPosition[2]
        },
        option.duration
      )
      .easing(TWEEN.Easing.Linear.None);
    tween.onUpdate(() => {
      this.controls.enabled = false;
      obj.position.set(tween._object.x1, tween._object.y1, tween._object.z1);

      this.controls.update();
      if (option.update instanceof Function) {
        option.update(tween);
      }
    });
    tween.onStart(() => {
      this.controls.enabled = false;
      if (option.start instanceof Function) {
        option.start();
      }
    });
    tween.onComplete(() => {
      this.controls.enabled = true;
      if (option.done instanceof Function) {
        option.done();
      }
    });
    tween.onStop(() => (option.stop instanceof Function ? option.stop() : ''));
    tween.start();
    TWEEN.add(tween);
    return tween;
  }

  // 渲染
  render(callback) {
    callback();
    
    // 使用后处理效果渲染（如果存在）
    if (this.composer) {
      this.composer.render();
    } else {
      // 否则使用标准渲染
      this.renderer.render(this.scene, this.camera);
    }
    
    this.frameId = requestAnimationFrame(() => this.render(callback));
  }
}
