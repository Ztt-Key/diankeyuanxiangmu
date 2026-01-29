<template>
  <div class="wrapper">
    <div class="loading">
      <h2>正在加载中...{{ number }}%</h2>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
</template>

<script>
  export default {
    name: '',
    components: {},
    props: {
      number: {
        type: [Number],
        default: 0
      }
    },
    data() {
      return {};
    },
    mounted() {}
  };
</script>
<style lang="less" scoped>
  .wrapper {
    background: #000;
    background: radial-gradient(#222, #000);
    bottom: 0;
    left: 0;
    overflow: hidden;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 99999;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .loading {
    font-size: 46px;
    color: #fff;
  }

  .loading span {
    display: inline-block;
    vertical-align: middle;
    width: 0.6em;
    height: 0.6em;
    margin: 0.19em;
    background: #007db6;
    border-radius: 0.6em;
    animation: loading 1s infinite alternate;
  }
  .loading span:nth-of-type(2) {
    background: #008fb2;
    animation-delay: 0.2s;
  }
  .loading span:nth-of-type(3) {
    background: #009b9e;
    animation-delay: 0.4s;
  }
  .loading span:nth-of-type(4) {
    background: #00a77d;
    animation-delay: 0.6s;
  }
  .loading span:nth-of-type(5) {
    background: #00b247;
    animation-delay: 0.8s;
  }
  .loading span:nth-of-type(6) {
    background: #5ab027;
    animation-delay: 1s;
  }
  .loading span:nth-of-type(7) {
    background: #a0b61e;
    animation-delay: 1.2s;
  }

  @keyframes loading {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
</style>
