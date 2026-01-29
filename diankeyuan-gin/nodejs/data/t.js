const xlsx = require('xlsx');
const { Pool } = require('pg');
const path = require('path');

// 数据库配置
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'gva',
  password: '123456',
  port: 5432,
});

async function updateSubscriptions() {
  try {
    // 读取 Excel 文件
    const workbook = xlsx.readFile(path.join(__dirname, './data.xlsx'));
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const excelData = xlsx.utils.sheet_to_json(worksheet);

    // 提取遥测数据的 name
    const telemetryNames = excelData.map(row => row['遥测数据name']);

    // 批量更新数据库
    const updateQuery = `
      UPDATE "energySavingSubscription" 
      SET 
        subscription = true,
        updated_at = NOW()
      WHERE name = ANY($1)
      RETURNING name;
    `;

    const result = await pool.query(updateQuery, [telemetryNames]);
    
    console.log(`成功更新 ${result.rowCount} 条记录`);
    console.log('更新的记录:', result.rows.map(row => row.name));

  } catch (error) {
    console.error('更新过程中发生错误:', error);
  } finally {
    await pool.end();
  }
}

// 执行更新
updateSubscriptions();
