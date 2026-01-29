<template>
  <div class="chart">
    <div ref="chart" class="chart" />
  </div>
</template>

<script>
  import chart from './chart';

  export default {
    name: 'baseChart',
    mixins: [chart],
    props: {
      option: {
        type: Object
      }
    },
    data() {
      return {
        chart: null
      };
    },
    mounted() {
      this.$nextTick(() => {
        this.initChart();
      });
    },
    beforeDestroy() {
      this.disposeChart();
    },
    methods: {
      initChart() {
        this.chart = this.$echarts.init(this.$refs['chart']);

        this.chart.setOption(this.option);
      },
      disposeChart() {
        if (!this.chart) {
          return;
        }
        this.chart.dispose();
        this.chart = null;
      }
    }
  };
</script>

<style lang="less" scoped>
  .chart {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
</style>
