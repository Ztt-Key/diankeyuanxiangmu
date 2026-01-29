export default {
  data() {
    return {
      $_sidebarElm: null
    };
  },
  mounted() {
    this.$_initResizeEvent();
  },
  beforeDestroy() {
    this.$_disposeChart();
    this.$_destroyResizeEvent();
  },
  activated() {
    this.$_initResizeEvent();
  },
  deactivated() {
    this.$_destroyResizeEvent();
  },
  methods: {
    $_resizeHandler() {
      return this.$_debounce(() => {
        if (this.chart) {
          this.chart.resize();
        }
      }, 100)();
    },
    $_initResizeEvent() {
      window.addEventListener('resize', this.$_resizeHandler);
    },
    $_destroyResizeEvent() {
      window.removeEventListener('resize', this.$_resizeHandler);
    },
    // 销毁报表
    $_disposeChart() {
      if (!this.chart) {
        return;
      }
      this.chart.dispose();
      this.chart = null;
    },
    $_debounce(fn, wait, immediate) {
      let timer;
      return function() {
        if (timer) clearTimeout(timer);
        if (immediate) {
          var callNow = !timer;
          timer = setTimeout(() => {
            timer = null;
          }, wait);
          if (callNow) {
            fn.apply(this, arguments);
          }
        } else {
          timer = setTimeout(() => {
            fn.apply(this, arguments);
          }, wait);
        }
      };
    }
  }
};
