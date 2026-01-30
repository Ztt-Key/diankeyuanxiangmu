<template>
  <div class="main">
    <loader :number="loadingNumber" v-if="loadingNumber !== 100"></loader>
    <!-- <div class="mask"></div> -->
    <div v-if="loadingNumber === 100 && isShowChart">
      <big-header></big-header>
      <!-- <big-left class="left"></big-left>
      <big-right class="right"></big-right>
      <big-top class="top"></big-top> -->
      <big-control class="control"></big-control>
      <box></box>
      <cable></cable>
      <circuit-button></circuit-button>
      <training-button></training-button>
      <reset-view-button></reset-view-button>
      <help-guide></help-guide>
      <circuit></circuit>
      <circuit-training></circuit-training>
    </div>
    <div id="screen" class="screen"></div>
  </div>
</template>

<script>
import loader from '@/components/loader';
import ZThree from '@/three/ZThree';
import * as THREE from 'three';
import { loaderModel } from '@/three/loaderModel';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer';
import { cssRender } from '@/three/cssRender';
import bigHeader from '@/components/header';
import bigLeft from '@/components/left';
import bigRight from '@/components/right';
import bigTop from '@/components/top';
import { secondaryTexture, trunkTexture, primaryTexture, skyTexture } from '@/three/texture';
import TWEEN from 'three/examples/jsm/libs/tween.module.js';
import bigControl from '@/components/bigControl';
import { darkMaterial } from '@/three/material';
import { createReprocessing } from '@/three/reprocessing';
import box from '@/components/box.vue';
import cable from '@/components/cable.vue';
import circuitButton from '@/components/circuitButton.vue';
import trainingButton from '@/components/trainingButton.vue';
import circuit from '@/components/circuit.vue';
import circuitTraining from '@/components/circuitTraining.vue';
import resetViewButton from '@/components/resetViewButton.vue';
import helpGuide from '@/components/helpGuide.vue';

let app,
  camera,
  scene,
  renderer,
  controls,
  clock,
  reprocessing,
  materials = {};

export default {
  name: 'Home',
  components: {
    loader,
    bigHeader,
    bigLeft,
    bigRight,
    bigTop,
    bigControl,
    box,
    cable,
    circuitButton,
    trainingButton,
    circuit,
    circuitTraining,
    resetViewButton,
    helpGuide
  },
  data() {
    return {
      // loading数值
      loadingNumber: 0,
      isShowChart: false,
      renderTasks: {}
    };
  },
  methods: {
    async initZThree() {
      app = new ZThree('screen');
      app.initThree();
      // app.initHelper();
      app.initLight();

      app.initOrbitControls();
      app.cameraPostion = [98.23, 47.4, 95.36];
      app.controlsTarget = [0, 2.53, 2.88];

      window.app = app;
      camera = app.camera;
      camera.position.set(...app.cameraPostion);
      scene = app.scene;
      scene.fog = new THREE.Fog('#000000', 100, 480);

      renderer = app.renderer;
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      // renderer.logarithmicDepthBuffer = true;
      controls = app.controls;
      controls.target.set(...app.controlsTarget);
      controls.maxPolarAngle = Math.PI / 2.2;

      clock = new THREE.Clock();
      reprocessing = createReprocessing(app);

      await loaderModel(app);

      let instance = new cssRender(CSS3DRenderer, app);
      app.cssRenderer = instance.cssRenderer;
      app.instance = instance;
      app.flyTo({
          position: [40.672568371153744, 96.15288680991578, -18.321015281826696],
          controls: [-19.265339753753807, 31.91865695374252, -35.958997358413164],
          duration: 2000
        });
      app.render(() => {
        if (this.isShowChart) {
          // 道路贴图
          if (secondaryTexture) {
            secondaryTexture.offset.x -= 0.005;
          }

          if (trunkTexture) {
            trunkTexture.offset.x -= 0.005;
          }

          if (primaryTexture) {
            primaryTexture.offset.x -= 0.005;
          }
          
          // 执行所有注册的渲染任务
          Object.values(this.renderTasks).forEach(task => {
            if (typeof task === 'function') {
              task();
            }
          });
        }

        const delta = clock.getDelta();

        controls.update(delta);

        scene.traverse(this.darkenNonBloomed);
        reprocessing.render();
        scene.traverse(this.restoreMaterial);
        app.finalComposer.render();

        app.cssRenderer.render(scene, camera);
        TWEEN.update();
      });
    },
    darkenNonBloomed(obj) {
      if (obj.isMesh && app.bloomLayer.test(obj.layers) === false) {
        materials[obj.uuid] = obj.material;
        obj.material = darkMaterial;
      }
    },
    restoreMaterial(obj) {
      if (materials[obj.uuid]) {
        obj.material = materials[obj.uuid];
        delete materials[obj.uuid];
      }
    }
  },
  mounted() {
    this.$EventBus.$on('changeLoaidng', (val) => {
      this.loadingNumber = val;
    });
    this.$EventBus.$on('changeScene', (val) => {
      this.isShowChart = val;
    });
    
    // 添加渲染任务处理
    this.$EventBus.$on('addRenderTask', (taskName, taskFunction) => {
      this.renderTasks[taskName] = taskFunction;
    });
    
    // 移除渲染任务处理
    this.$EventBus.$on('removeRenderTask', (taskName) => {
      if (this.renderTasks[taskName]) {
        delete this.renderTasks[taskName];
      }
    });
    
    this.initZThree();
  }
};
</script>

<style lang="less" scoped>
.main {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
  // background-image: url('./../assets/image/BG@2x.png');
  // background-repeat: no-repeat;
  // background-size: 100% 100%;

  .video {
    position: absolute;
    width: 0;
    height: 0;
  }

  .control {
    height: 5%;
    position: fixed;
    bottom: 3%;
    left: 36%;
    z-index: 3;
    float: left;
    font-size: 30px;
  }

  .mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('./../assets/image/mask.png');
    background-size: 100% 100%;
    pointer-events: none;
    z-index: 3;
  }

  .screen {
    width: 100%;
    height: 100%;
    position: fixed;
    top: 0;
    left: 0;
  }

  .left {
    width: 600px;
    height: 82%;
    position: fixed;
    top: 160px;
    left: 24px;
    z-index: 3;
  }

  .right {
    width: 600px;
    height: 82%;
    position: fixed;
    top: 160px;
    right: 24px;
    z-index: 3;
  }

  .top {
    width: 984px;
    height: 16%;
    position: fixed;
    top: 10%;
    right: 31%;
    z-index: 3;
    float: left;
  }
}
</style>
<style>
.text-3d {
  padding: 0 10px;
  background: url('./../assets/image/bed_bg.png') no-repeat;
  background-size: 100% 100%;
  color: #fff;
  font-size: 24px;
  line-height: 48px;
  text-align: center;
  cursor: pointer;
}
</style>
