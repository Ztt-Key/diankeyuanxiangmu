// 引入定时任务
// require('./tasks/energyDataSync');

// 引入必要的库
const express = require('express');
const prisma = require('./lib/prisma');
const path = require('path');
// 创建 Express 应用
const app = express();

// 引入路由和中间件
const ticketTemplateRoutes = require('./routes/ticketTemplateRoutes');
const errorHandler = require('./middleware/errorHandler');
const formatResponse = require('./middleware/responseFormatter');
const energySavingRoutes = require('./routes/energySavingRoutes');
const mobileRoutes = require('./routes/mobileRoutes');
// 添加数据库连接测试函数
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
    process.exit(1);
  }
}

// 修改静态文件服务配置
app.use('/work', express.static(path.join(__dirname, 'assets/work')));
// 保留原有的静态文件服务
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// 使用 JSON 中间件
app.use(express.json());

// 注册响应格式化中间件（移到路由之前）
app.use(formatResponse);

// 注册路由
app.use('/api', ticketTemplateRoutes);
app.use('/api/energy-saving', energySavingRoutes);  // 修改路由前缀
app.use('/api/mobile', mobileRoutes);
// 错误处理中间件
app.use(errorHandler);

// 测试数据库连接
testConnection();

// 启动服务器
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

// 优雅关闭
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit();
});