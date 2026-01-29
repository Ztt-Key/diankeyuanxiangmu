<template>
  <div ref="watermark" style="width: 100%; height: 100%"></div>
</template>

<script>
  export default {
    name: 'LtWatermarkComp',
    props: {
      text1: {
        type: String,
        default: ''
      },
      text2: {
        type: String,
        default: ''
      },
      text3: {
        type: String,
        default: ''
      },
      config: {
        type: Object,
        default: () => ({
          start_x: 0, // x轴起始位置
          start_y: 0, // y轴起始位置
          space_x: 200, // x轴间距
          space_y: 300, // y轴间距
          width: 260, // 宽度
          height: 80, // 长度
          fontSize: 20, // 字体
          color: '#aaa', // 字色
          alpha: 0.3, // 透明度
          rotate: 45 // 倾斜度
        })
      }
    },
    data() {
      return {};
    },
    watch: {
      config() {
        this.drawWaterMark();
      },
      text1() {
        this.drawWaterMark();
      },
      text2() {
        this.drawWaterMark();
      }
    },
    mounted() {
      this.drawWaterMark();
    },
    methods: {
      drawWaterMark() {
        const element = this.$refs.watermark;
        while (element.childNodes.length) {
          element.removeChild(element.childNodes[0]);
        }
        // 获取元素的坐标
        if (!element) return;
        // 默认配置
        const _config = this.config;
        // 节点的总宽度
        const total_width = element.clientWidth;
        console.log('width:', total_width);
        // 节点的总高度
        const total_height = element.clientHeight;
        // 创建文本碎片，用于包含所有的插入节点
        const mark = document.createDocumentFragment();
        // 水印节点的起始坐标
        let x = _config.start_x,
          y = _config.start_y;
        // 先循环y轴插入水印
        do {
          // 再循环x轴插入水印
          do {
            // 创建单个水印节点
            const item = document.createElement('div');
            item.className = 'watermark-item';
            // 设置节点的样式
            item.style.position = 'absolute';
            item.style.zIndex = 99999;
            item.style.left = `${x}px`;
            item.style.top = `${y}px`;
            item.style.width = `${_config.width}px`;
            item.style.height = `${_config.height}px`;
            item.style.fontSize = `${_config.fontSize}px`;
            item.style.color = _config.color;
            item.style.textAlign = 'center';
            item.style.opacity = _config.alpha;
            item.style.filter = `alpha(opacity=${_config.alpha * 100})`;
            // item.style.filter = `opacity(${_config.alpha * 100}%)`;
            item.style.webkitTransform = `rotate(-${_config.rotate}deg)`;
            item.style.MozTransform = `rotate(-${_config.rotate}deg)`;
            item.style.msTransform = `rotate(-${_config.rotate}deg)`;
            item.style.OTransform = `rotate(-${_config.rotate}deg)`;
            item.style.transform = `rotate(-${_config.rotate}deg)`;
            item.style.pointerEvents = 'none'; //让水印不遮挡页面的点击事件
            // 创建text1水印节点
            const text1 = document.createElement('div');
            text1.appendChild(document.createTextNode(this.text1));
            item.append(text1);
            // 创建text2水印节点
            const text2 = document.createElement('div');
            text2.appendChild(document.createTextNode(this.text2));
            item.append(text2);
            // 创建text3水印节点
            const text3 = document.createElement('div');
            text3.appendChild(document.createTextNode(this.text3));
            item.append(text3);
            // 添加水印节点到文本碎片
            mark.append(item);
            // x坐标递增
            x = x + _config.width + _config.space_x;
            // 超出文本右侧坐标停止插入
          } while (total_width >= x + _config.width);
          // 重置x初始坐标
          x = _config.start_x;
          // y坐标递增
          y = y + _config.space_y;
          // 超出文本底部坐标停止插入
        } while (total_height >= y + _config.height);
        // 插入文档碎片
        element.append(mark);
      }
    }
  };
</script>

<style scoped></style>
