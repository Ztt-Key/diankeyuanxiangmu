<template>
  <div class="title-card">
    <div class="title">
      <span>{{ title }}</span>
    </div>
    <div class="content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'bigCard',
    props: {
      title: {
        type: String,
        default: '标题'
      }
    }
  };
</script>

<style lang="less">
  .title-card {
    display: block;
    overflow: hidden;
    width: 580px;
    height: 33%;
    margin: 0 10px 20px 10px;
    background-image: url('./../../assets/image/card_bg.png');
    background-repeat: no-repeat;
    background-size: 100% 100%;
    .title {
      height: 30px;
      padding-left: 34px;
      padding-top: 20px;

      > span {
        font-size: 24px;
        font-weight: normal;
        font-style: italic;
        color: #a1e4ff;
        padding-bottom: 20px;

        background: linear-gradient(-35deg, #a0cbd9 0%, #ddfdff 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }
    .content {
      display: block;
      height: 80%;
      position: relative;
      position: relative;
    }
  }
</style>
