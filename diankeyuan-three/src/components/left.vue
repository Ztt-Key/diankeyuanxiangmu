<template>
  <div>
    <big-card title="业务类型" class="left animated bounceInUp">
      <chart :option="option1"></chart>
    </big-card>
    <big-card title="业务类型" class="left animated bounceInUp card2-animate">
      <chart :option="option2"></chart>
    </big-card>
    <big-card title="业务类型" class="left animated bounceInUp card3-animate">
      <chart :option="option3"></chart>
    </big-card>
    <!-- <big-card title="业务类型" class="left animated bounceInUp card4-animate">
      <chart :option="option4"></chart>
    </big-card>
    <big-card title="业务类型" class="left animated bounceInUp card5-animate">
      <chart :option="option5"></chart>
    </big-card>
    <big-card title="业务类型" class="left animated bounceInUp card6-animate">
      <chart :option="option6"></chart>
    </big-card> -->
  </div>
</template>

<script>
  import chart from './chart/chart.vue';
  import bigCard from './common/bigCard.vue';
  import option1 from './chart/option1';
  import option2 from './chart/option2';
  import option3 from './chart/option3';
  import option4 from './chart/option4';
  import option5 from './chart/option5';
  import option6 from './chart/option6';
  export default {
    name: 'Left',
    components: {
      bigCard,
      chart
    },
    data: () => ({
      option1,
      option2,
      option3,
      option4,
      option5,
      option6
    })
  };
</script>

<style lang="less" scoped>
  .left {
    float: left;
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
