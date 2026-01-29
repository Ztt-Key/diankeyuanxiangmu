<template>
  <div>
    <big-card title="业务类型" class="right animated bounceInUp">
      <chart :option="option7"></chart>
    </big-card>
    <big-card title="业务类型" class="right animated bounceInUp card2-animate">
      <chart :option="option8"></chart>
    </big-card>
    <big-card title="业务类型" class="right animated bounceInUp card3-animate">
      <dv-scroll-board :config="option10" class="dv" />
    </big-card>
    <!-- <big-card title="业务类型" class="right animated bounceInUp card4-animate">
      <dv-scroll-board :config="option10" class="dv" />
    </big-card>
    <big-card title="业务类型" class="right animated bounceInUp card5-animate">
      <dv-scroll-ranking-board :config="option12" class="dv" />
    </big-card>
    <big-card title="业务类型" class="right animated bounceInUp card6-animate">
      <dv-scroll-ranking-board :config="option12" class="dv" />
    </big-card> -->
  </div>
</template>

<script>
  import chart from './chart/chart.vue';
  import bigCard from './common/bigCard.vue';
  import option7 from './chart/option7';
  import option8 from './chart/option8';
  import option3 from './chart/option3';
  import option10 from './chart/option10';
  import option12 from './chart/option12';
  export default {
    name: 'Left',
    components: {
      bigCard,
      chart
    },
    data: () => ({
      option7,
      option8,
      option3,
      option10,
      option12
    })
  };
</script>

<style lang="less" scoped>
  .dv {
    width: 520px;
    height: 100%;
    padding-left: 36px;
  }
  .right {
    float: right;
  }

  .card1-animate {
    animation-delay: 0;
  }

  .card2-animate {
    animation-delay: 0.2s;
  }

  .card3-animate {
    animation-delay: 0.4s;
  }

  .card4-animate {
    animation-delay: 0.6s;
  }

  .card5-animate {
    animation-delay: 0.8s;
  }

  .card6-animate {
    animation-delay: 1s;
  }
</style>

<style>
  .dv-scroll-board .header {
    background-image: url('./../assets/image/table1.png') !important;
    background-size: 100% 100%;
    background-color: transparent !important;
  }

  .dv-scroll-board .header .header-item {
    opacity: 0.8;
  }

  .dv-scroll-board .rows .ceil {
    opacity: 0.8;
  }

  .dv-scroll-board .row-item:nth-child(2n) {
    background-image: url('./../assets/image/table2.png') !important;
    background-size: 100% 100%;
    background-color: transparent !important;
  }

  .dv-scroll-board .header .left {
    opacity: 1;
  }

  .tableScrollBoard .time {
    position: absolute;
    left: 893px;
    top: 111px;
    font-size: 18px;
    color: #fff;
  }

  .tableScrollBoard .close {
    position: absolute;
    left: 1150px;
    top: 87px;
    font-size: 18px;
    color: #fff;
    cursor: pointer;
  }
</style>
