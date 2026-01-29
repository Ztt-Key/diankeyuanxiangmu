<template>
  <div class="header animated fadeInDown">
    <h1>虚拟智慧园区</h1></h1>
    <div class="explain">
      <!-- <div style="float: left">QQ:2354528292;WX:aichitudousien;淘宝店铺:爱吃土豆丝嗯</div> -->
      <!-- <div style="float: right">此大屏数据均为虚假数据，请勿商用</div> -->
    </div>
  </div>
</template>

<script>
  export default {
    name: 'bigHeader',
    components: {},
    props: {},
    data() {
      return {};
    },
    mounted() {}
  };
</script>
<style lang="less" scoped>
  .header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 120px;
    background: url('./../assets/image/header.png') no-repeat center center;
    background-size: 100% 100%;
    z-index: 3;

    h1 {
      color: #bde4ff;
      text-align: center;
      font-size: 48px;
      line-height: 88px;
      letter-spacing: 14px;
    }

    .explain {
      color: #fff;
      font-size: 24px;
      padding: 0 30px;
    }
  }
</style>
