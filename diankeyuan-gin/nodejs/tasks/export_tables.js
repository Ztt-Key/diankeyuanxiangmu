const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// MySQL 配置
const mysqlConfig = {
    host: '192.168.1.230',
    user: 'root',
    password: 'KE_MySQL_123456',
    database: 'emsdata',
    port: 13306
};

async function generateDateRange(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        dates.push(`minyc${year}${month}${day}`);
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}

async function exportTables() {
    const connection = await mysql.createConnection(mysqlConfig);
    try {
        console.log('数据库连接成功');

        // 生成日期范围内的所有表名
        const startDate = new Date('2023-01-10');
        const endDate = new Date(); // 今天
        const tableNames = await generateDateRange(startDate, endDate);

        // 创建导出目录
        const exportDir = path.join(__dirname, 'exported_tables');
        await fs.mkdir(exportDir, { recursive: true });

        // 遍历每个表名并导出
        for (const tableName of tableNames) {
            try {
                // 检查表是否存在
                const [tables] = await connection.execute(`SHOW TABLES LIKE '${tableName}'`);
                
                if (tables.length === 0) {
                    console.log(`表 ${tableName} 不存在，跳过`);
                    continue;
                }

                // 导出表结构
                const [createTable] = await connection.execute(`SHOW CREATE TABLE ${tableName}`);
                const createTableSQL = createTable[0]['Create Table'];

                // 导出表数据
                const [rows] = await connection.execute(`SELECT * FROM ${tableName}`);

                // 将结果保存到文件
                const exportData = {
                    tableName,
                    createTableSQL,
                    data: rows
                };

                const filePath = path.join(exportDir, `${tableName}.json`);
                await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
                console.log(`表 ${tableName} 导出成功`);

            } catch (error) {
                console.error(`导出表 ${tableName} 时发生错误:`, error);
            }
        }

        console.log('所有表导出完成');

    } catch (error) {
        console.error('导出过程中发生错误:', error);
    } finally {
        await connection.end();
        console.log('数据库连接已关闭');
    }
}

// 执行导出
exportTables().catch(console.error); 