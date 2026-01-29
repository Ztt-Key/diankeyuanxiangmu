const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// 定义类型关键词映射
const typeKeywords = {
    0: ['逆变器', '储能', '太阳能', '风机发电','排潮'], // 新能源发电设备
    1: ['空调', '热泵', '新风机'],  // 空调与制冷系统
    2: ['照明'],                     // 照明系统
    3: ['电梯'],                     // 电梯系统
    4: ['消防'],                     // 消防系统
    5: ['电容柜', '配电', '变电站','工艺'], // 动力设备
    6: ['大厅', '中心', '倒班楼', '路由器', '实验室', '监控站', '屏幕'], // 工作用电
    7: ['生活泵', '洗衣'],           // 生活设施
    8: ['蒸汽']      // 其他设备
};
// 判断类型的函数
function determineType(description) {
  for (const [type, keywords] of Object.entries(typeKeywords)) {
    if (keywords.some(keyword => description.includes(keyword))) {
      return parseInt(type);
    }
  }
  return 0; // 未分类
}

// 读取和处理数据
const results = [];

fs.createReadStream('test.csv')
  .pipe(csv({
    headers: ['id', 'code1', 'code2', 'value', 'description'],
    separator: ','
  }))
  .on('data', (data) => {
    results.push({
      ...data,
      type: determineType(data.description)
    });
  })
  .on('end', () => {
    // 写入新的CSV文件
    const csvWriter = createCsvWriter({
      path: 'output.csv',
      header: [
        {id: 'id', title: 'id'},
        {id: 'code1', title: 'code1'},
        {id: 'code2', title: 'code2'},
        {id: 'value', title: 'value'},
        {id: 'description', title: 'description'},
        {id: 'type', title: 'type'}
      ]
    });

    csvWriter.writeRecords(results)
      .then(() => console.log('CSV文件处理完成'));
  });