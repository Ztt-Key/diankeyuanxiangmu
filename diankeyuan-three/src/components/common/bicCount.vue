<template>
  <div class="count-text">
    <div class="title">{{ title }}</div>
    <div class="value">
      <count-to :startVal="0" :endVal="value" :duration="3000"></count-to>
      <span :class="['num', num >= 0 ? 'red' : 'green']"
        >{{ num }}%
        <i :class="[num >= 0 ? 'el-icon-caret-top' : 'el-icon-caret-bottom']"></i>
      </span>
    </div>
    <img src="./../../assets/image/light.png" />
  </div>
</template>

<script>
  export default {
    name: 'CountText',
    props: {
      title: {
        type: String,
        default: '标题'
      },
      value: {
        type: Number,
        default: 100
      },
      num: {
        type: Number,
        default: 10
      }
    }
  };
</script>

<style lang="less">
  .count-text {
    width: 311px;
    text-align: center;
    float: left;
    .title {
      font-size: 32px;
      color: rgba(241, 254, 255, 1);
    }
    .value {
      display: inline-block;
      margin-top: 25px;
      font-size: 72px;
      font-family: DS;
      font-weight: normal;
      font-style: italic;
      color: #48fffd;
    }
    .num {
      margin-left: 25px;
      font-size: 20px;
      font-weight: normal;
      font-style: normal;
      font-family: AlibabaR;
    }
    .num.green {
      color: #2ce28f;
    }
    .num.red {
      color: #ed636e;
    }
    img {
      position: relative;
      top: -25px;
    }
  }
  .count-text:not(:last-child) {
    margin-right: 25px;
  }
</style>
