const mysql = require('mysql2/promise');
const moment = require('moment');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'KE_MYSQL_123456',
  database: 'emsdata',
  port: 13306
};

async function cloneTableWithHistory(sourceTable, daysToGoBack = 7) {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // 首先检查源表是否存在
    const [tables] = await connection.execute(
      `SELECT TABLE_NAME FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = '${dbConfig.database}' AND TABLE_NAME = ?`, 
      [sourceTable]
    );

    if (tables.length === 0) {
      console.log(`源表 ${sourceTable} 不存在，将创建它...`);
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS ${sourceTable} (
          name varchar(255),
          hm int,
          flag int,
          data float
        )
      `);
    }

    const sourceDate = moment(sourceTable.replace('minyc', ''), 'YYYYMMDD');
    let previousTableName = sourceTable;
    
    for (let i = 1; i <= daysToGoBack; i++) {
      const previousDate = moment(sourceDate).subtract(i, 'days');
      const newTableName = `minyc${previousDate.format('YYYYMMDD')}`;
      
      // 检查新表是否已存在
      const [existingTable] = await connection.execute(
        `SELECT TABLE_NAME FROM information_schema.TABLES 
         WHERE TABLE_SCHEMA = '${dbConfig.database}' AND TABLE_NAME = ?`,
        [newTableName]
      );

      if (existingTable.length > 0) {
        console.log(`表 ${newTableName} 已存在，跳过`);
        previousTableName = newTableName;
        continue;
      }
      
      console.log(`正在创建表: ${newTableName}`);
      await connection.execute(`CREATE TABLE ${newTableName} LIKE ${previousTableName}`);
      
      // 修改后的 INSERT 语句，更合理地处理数据值
      await connection.execute(`
        INSERT INTO ${newTableName} (name, hm, flag, data)
        SELECT 
          name,
          hm,
          flag,
          CASE
            WHEN data < 0 THEN data  -- 如果是负值，直接保持原值
            ELSE 
              CASE
                WHEN data < 5 THEN data  -- 如果值太小，直接保持原值
                ELSE data - (2 + RAND() * 3)  -- 否则减去 2-5 之间的随机值
              END
          END as data
        FROM ${previousTableName}
      `);
      
      console.log(`成功创建并复制数据到表: ${newTableName}`);
      previousTableName = newTableName;
    }
  } catch (error) {
    console.error('发生错误:', error);
  } finally {
    await connection.end();
  }
}

async function cloneTableForward(sourceTable, daysToGoForward = 4) {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    const sourceDate = moment(sourceTable.replace('minyc', ''), 'YYYYMMDD');
    let previousTableName = sourceTable;
    
    for (let i = 1; i <= daysToGoForward; i++) {
      const nextDate = moment(sourceDate).add(i, 'days');
      const newTableName = `minyc${nextDate.format('YYYYMMDD')}`;
      
      // 检查新表是否已存在
      const [existingTable] = await connection.execute(
        `SELECT TABLE_NAME FROM information_schema.TABLES 
         WHERE TABLE_SCHEMA = '${dbConfig.database}' AND TABLE_NAME = ?`,
        [newTableName]
      );

      if (existingTable.length > 0) {
        console.log(`表 ${newTableName} 已存在，跳过`);
        previousTableName = newTableName;
        continue;
      }
      
      console.log(`正在创建表: ${newTableName}`);
      await connection.execute(`CREATE TABLE ${newTableName} LIKE ${previousTableName}`);
      
      // 向前模拟数据时，数值会略微增加
      await connection.execute(`
        INSERT INTO ${newTableName} (name, hm, flag, data)
        SELECT 
          name,
          hm,
          flag,
          CASE
            WHEN data < 0 THEN data  -- 负值保持不变
            ELSE 
              CASE
                WHEN data < 5 THEN data  -- 小值保持不变
                ELSE data + (1 + RAND() * 2)  -- 其他值增加1-3之间的随机值
              END
          END as data
        FROM ${previousTableName}
      `);
      
      console.log(`成功创建并复制数据到表: ${newTableName}`);
      previousTableName = newTableName;
    }
  } catch (error) {
    console.error('发生错误:', error);
  } finally {
    await connection.end();
  }
}

async function generateYearlyView(startYear = 2020, endYear = 2025, sourceTable = 'minyc20250109') {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    for (let year = startYear; year <= endYear; year++) {
      const targetDate = moment(`${year}1231`, 'YYYYMMDD');
      const tableName = `minyc${targetDate.format('YYYYMMDD')}`;
      
      // 检查表是否已存在
      const [existingTable] = await connection.execute(
        `SELECT TABLE_NAME FROM information_schema.TABLES 
         WHERE TABLE_SCHEMA = '${dbConfig.database}' AND TABLE_NAME = ?`,
        [tableName]
      );

      if (existingTable.length > 0) {
        console.log(`表 ${tableName} 已存在，跳过`);
        continue;
      }

      console.log(`使用 ${sourceTable} 作为源表创建 ${tableName}`);

      // 创建新表并复制数据
      await connection.execute(`CREATE TABLE ${tableName} LIKE ${sourceTable}`);
      await connection.execute(`
        INSERT INTO ${tableName} (name, hm, flag, data)
        SELECT 
          name,
          hm,
          flag,
          CASE
            WHEN data < 0 THEN data
            ELSE 
              CASE
                WHEN data < 5 THEN data
                ELSE data * (1 + RAND() * 0.1) /* 年度数据波动范围设为 0-10% */
              END
          END as data
        FROM ${sourceTable}
      `);
      
      console.log(`成功创建年度视图表: ${tableName}`);
    }
  } catch (error) {
    console.error('发生错误:', error);
  } finally {
    await connection.end();
  }
}

// 修改调用部分
const sourceTableName = 'minyc20250109';
// cloneTableWithHistory(sourceTableName, 365); 
// cloneTableForward(sourceTableName, 5);
generateYearlyView(2020, 2025, sourceTableName); // 使用指定的源表生成年度视图