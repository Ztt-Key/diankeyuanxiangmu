const cron = require('node-cron');
const prisma = require('../lib/prisma');
const mysql = require('mysql2/promise');

// MySQL 连接配置
// const mysqlConfig = {
//   host: 'localhost',      // 使用 localhost 因为端口已经映射到主机
//   user: 'root',
//   password: 'KE_MYSQL_123456',
//   database: 'emsdata',
//   port: 3306
// };
const mysqlConfig = {
  host: '192.168.1.230',
  user: 'root',
  password: 'KE_MySQL_123456',
  database: 'emsdata',
  port: 13306
};
async function syncEnergyData() {
  console.log('开始同步能源数据...');
  let mysqlConnection;
  let updatedCount = 0;
  let insertedCount = 0;
  try {
    // 1. 从 PostgreSQL 获取订阅的 name 列表
    const subscriptions = await prisma.energySavingSubscription.findMany({
      where: {
        subscription: true,
        deleted_at: null
      },
      select: {
        name: true,
        described: true
      }
    });

    // 创建一个 Map 来存储 name 和 described 的对应关系
    const descriptionMap = new Map(
      subscriptions.map(sub => [sub.name, sub.described])
    );

    const subscribedNames = subscriptions.map(sub => sub.name);
    
    if (subscribedNames.length === 0) {
      console.log('没有找到需要同步的订阅数据');
      return;
    }

    // 2. 连接 MySQL 并查询数据
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    // 获取今天日期
    let tableName = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '');
    tableName = `minyc${tableName}`;

    // 测试
    tableName = 'minyc20241225'

    const placeholders = subscribedNames.map(() => '?').join(',');
    const query = `
      SELECT m1.* 
      FROM minyc20241225 m1
      INNER JOIN (
        SELECT name, MAX(hm) as max_hm
        FROM ${tableName}
        WHERE name IN (${placeholders})
        GROUP BY name
      ) m2 
      ON m1.name = m2.name AND m1.hm = m2.max_hm
    `;

    const [rows] = await mysqlConnection.execute(query, subscribedNames);

    // 获取所有当前存在的 energySavingReal 记录的 name
    const existingNames = await prisma.energySavingReal.findMany({
      where: {
        deleted_at: null
      },
      select: {
        name: true
      }
    });

    // 找出需要删除的记录（在 existingNames 中但不在 subscribedNames 中的记录）
    const namesToDelete = existingNames
      .map(record => record.name)
      .filter(name => !subscribedNames.includes(name));

    // 如果有需要删除的记录，执行软删除
    if (namesToDelete.length > 0) {
      await prisma.energySavingReal.updateMany({
        where: {
          name: {
            in: namesToDelete
          },
          deleted_at: null
        },
        data: {
          deleted_at: new Date()
        }
      });
      console.log(`已删除 ${namesToDelete.length} 条不再订阅的数据点位`);
    }

    // 3. 更新或插入数据到 energySavingReal 表
    for (const row of rows) {
      // 先查找是否存在相同 name 的记录
      const existingRecord = await prisma.energySavingReal.findFirst({
        where: {
          name: row.name,
          deleted_at: null
        }
      });

      if (existingRecord) {
        // 如果存在，则更新
        await prisma.energySavingReal.update({
          where: {
            id: existingRecord.id
          },
          data: {
            data: row.data,
            hm: row.hm,
            flag: row.flag,
            described: descriptionMap.get(row.name),
            updated_at: new Date()
          }
        });
        updatedCount++;
      } else {
        // 如果不存在，则创建新记录
        await prisma.energySavingReal.create({
          data: {
            name: row.name,
            data: row.data,
            hm: row.hm,
            flag: row.flag,
            described: descriptionMap.get(row.name),
            created_at: new Date(),
            updated_at: new Date()
          }
        });
        insertedCount++;
      }
    }
    console.log(`同步能源数据完成，更新了 ${updatedCount} 条数据，新增了 ${insertedCount} 条数据`);
  } catch (error) {
    console.error('数据同步出错:', error);
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
    if (error.message) {
      console.error('错误信息:', error.message);
    }
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
    }
  }
}
// 创建定时任务，每5分钟执行一次
cron.schedule('*/5 * * * *', () => {
  syncEnergyData();
});

// 立即执行一次（用于测试）
syncEnergyData();

// 导出函数以供其他模块使用
module.exports = {
  syncEnergyData
};