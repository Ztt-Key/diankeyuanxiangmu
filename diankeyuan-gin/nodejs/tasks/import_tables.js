const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// MySQL 配置
const mysqlConfig = {
    host: 'localhost',
    user: 'root',
    password: 'KE_MYSQL_123456',
    database: 'emsdata',
    port: 3306
};

// 创建连接池而不是单一连接
const pool = mysql.createPool({
    ...mysqlConfig,
    waitForConnections: true,
    connectionLimit: 10, // 根据服务器性能调整连接数
    queueLimit: 0
});

async function importTable(file, exportDir) {
    const connection = await pool.getConnection();
    try {
        console.log(`\n开始处理文件: ${file}`);
        
        // 读取JSON文件
        const filePath = path.join(exportDir, file);
        const fileContent = await fs.readFile(filePath, 'utf8');
        const tableData = JSON.parse(fileContent);

        // 检查表是否已存在
        const [existingTables] = await connection.execute(
            `SHOW TABLES LIKE '${tableData.tableName}'`
        );

        // 如果表存在，先删除
        if (existingTables.length > 0) {
            console.log(`表 ${tableData.tableName} 已存在，正在删除...`);
            await connection.execute(`DROP TABLE IF EXISTS ${tableData.tableName}`);
        }

        // 创建表
        console.log(`创建表 ${tableData.tableName}`);
        await connection.execute(tableData.createTableSQL);

        // 如果数据为空，继续下一个表
        if (!tableData.data || tableData.data.length === 0) {
            console.log(`表 ${tableData.tableName} 没有数据，跳过导入`);
            return;
        }

        // 使用事务提高插入效率
        await connection.beginTransaction();

        try {
            // 准备批量插入数据
            const columns = Object.keys(tableData.data[0]);
            
            // 使用批量插入语法优化
            const batchSize = 1000;
            for (let i = 0; i < tableData.data.length; i += batchSize) {
                const batch = tableData.data.slice(i, i + batchSize);
                
                // 构建一次性插入多行的SQL
                const placeholders = batch.map(() => 
                    `(${columns.map(() => '?').join(',')})`
                ).join(',');
                
                const insertSQL = `INSERT INTO ${tableData.tableName} (${columns.join(',')}) VALUES ${placeholders}`;
                
                // 准备扁平化的参数数组
                const params = [];
                batch.forEach(row => {
                    columns.forEach(col => {
                        params.push(row[col]);
                    });
                });
                
                await connection.execute(insertSQL, params);
                
                console.log(`已导入 ${tableData.tableName} 的 ${Math.min(i + batchSize, tableData.data.length)}/${tableData.data.length} 条记录`);
            }
            
            await connection.commit();
            console.log(`表 ${tableData.tableName} 导入完成`);
            
        } catch (error) {
            await connection.rollback();
            throw error;
        }

    } catch (error) {
        console.error(`处理文件 ${file} 时发生错误:`, error);
    } finally {
        connection.release();
    }
}

async function importTables() {
    try {
        console.log('连接池已创建');

        // 读取导出目录
        const exportDir = path.join(__dirname, 'exported_tables');
        const files = await fs.readdir(exportDir);

        // 按文件名排序，确保按日期顺序导入
        files.sort();

        // 过滤出JSON文件
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        // 并行处理所有表的导入
        const importPromises = jsonFiles.map(file => importTable(file, exportDir));
        
        // 等待所有导入完成
        await Promise.all(importPromises);

        console.log('\n所有表导入完成');

    } catch (error) {
        console.error('导入过程中发生错误:', error);
    } finally {
        // 关闭连接池
        await pool.end();
        console.log('数据库连接池已关闭');
    }
}

// 执行导入
importTables().catch(console.error); 