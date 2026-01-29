<template>
  <div id="app">
    <!-- <watermark
      class="watermark"
      text1="QQ: 2354528292"
      text2="wx: aichitudousien"
      text3="淘宝店铺: 爱吃土豆丝嗯"
    ></watermark> -->
    <router-view />
  </div>
</template>

<script>
  import watermark from '@/components/common/watermark';
  export default {
    name: 'App',
    components: {
      watermark
    }
  };
</script>

<style lang="less">
  #app {
    width: 100%;
    height: 100%;
  }

  .echarts {
    height: 100% !important;
    width: 100% !important;
  }

  .watermark {
    width: 100%;
    height: 100%;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
    pointer-events: none;
  }

  .dg.ac {
    z-index: 9999 !important;
  }
</style>
