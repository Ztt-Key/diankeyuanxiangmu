var myColor = [
  '#eb2100',
  '#eb3600',
  '#d0570e',
  '#d0a00e',
  '#34da62',
  '#00e9db',
  '#00c0e9',
  '#0096f3',
  '#33CCFF',
  '#33FFCC'
];
export default {
  grid: {
    top: 10,
    bottom: 0,
    right: 50,
    left: 100
  },
  xAxis: [
    {
      show: false
    }
  ],
  yAxis: [
    {
      axisTick: 'none',
      axisLine: 'none',
      offset: '27',
      axisLabel: {
        textStyle: {
          color: '#ffffff',
          fontSize: '16'
        }
      },
      data: ['南昌', '广州', '杭州', '宁夏', '兰州', '南宁']
    },
    {
      axisTick: 'none',
      axisLine: 'none',
      axisLabel: {
        textStyle: {
          color: '#ffffff',
          fontSize: '16'
        }
      },
      data: ['10', '9', '8', '7', '6', '5']
    },
    {
      name: '分拨延误TOP 10',
      nameGap: '50',
      nameTextStyle: {
        color: '#ffffff',
        fontSize: '16'
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(0,0,0,0)'
        }
      },
      data: []
    }
  ],
  series: [
    {
      name: '条',
      type: 'bar',
      yAxisIndex: 0,
      data: [4, 13, 25, 29, 38, 44],
      label: {
        normal: {
          show: true,
          position: 'right',
          textStyle: {
            color: '#ffffff',
            fontSize: '16'
          }
        }
      },
      barWidth: 12,
      itemStyle: {
        normal: {
          color: function(params) {
            var num = myColor.length;
            return myColor[params.dataIndex % num];
          }
        }
      },
      z: 2
    },
    {
      name: '白框',
      type: 'bar',
      yAxisIndex: 1,
      barGap: '-100%',
      data: [99, 99.5, 99.5, 99.5, 99.5, 99.5, 99.5, 99.5, 99.5, 99.5],
      barWidth: 20,
      itemStyle: {
        normal: {
          color: '#0e2147',
          barBorderRadius: 5
        }
      },
      z: 1
    },
    {
      name: '外框',
      type: 'bar',
      yAxisIndex: 2,
      barGap: '-100%',
      data: [100, 100, 100, 100, 100, 100],
      barWidth: 22,
      itemStyle: {
        normal: {
          color: function(params) {
            var num = myColor.length;
            return myColor[params.dataIndex % num];
          },
          barBorderRadius: 5
        }
      },
      z: 0
    },
    {
      name: '外圆',
      type: 'scatter',
      hoverAnimation: false,
      data: [0, 0, 0, 0, 0, 0],
      yAxisIndex: 2,
      symbolSize: 24,
      itemStyle: {
        normal: {
          color: function(params) {
            var num = myColor.length;
            return myColor[params.dataIndex % num];
          },
          opacity: 1
        }
      },
      z: 2
    }
  ]
};
