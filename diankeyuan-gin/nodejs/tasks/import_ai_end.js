const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// MySQL 配置
const mysqlConfig = {
    host: 'localhost',
    user: 'root',
    password: 'KE_MySQL_123456',
    database: 'emsdata',
    port: 13306,
    connectionLimit: 100 // 连接池大小
};

// 模拟数据生成配置
const startDate = new Date('2024-03-07'); // 开始日期
const endDate = new Date('2025-02-11'); // 结束日期
const baseDataFile = 'minyc20240306.json'; // 基础数据文件
const exportDir = path.join(__dirname, 'exported_tables'); // 导出目录

// 生成每日数据
async function generateDailyData() {
    try {
        // 读取基础数据
        const baseFilePath = path.join(exportDir, baseDataFile);
        const baseFileContent = await fs.readFile(baseFilePath, 'utf8');
        const baseData = JSON.parse(baseFileContent);

        // 从开始日期到结束日期，每天生成数据
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const formattedDate = currentDate.toISOString().split('T')[0].replace(/-/g, '');
            const newFileName = `minyc${formattedDate}.json`;
            const newFilePath = path.join(exportDir, newFileName);

            // 如果文件已存在，跳过
            try {
                await fs.access(newFilePath);
                console.log(`文件 ${newFileName} 已存在，跳过生成`);
            } catch {
                // 生成新数据
                const newData = {
                    tableName: `minyc${formattedDate}`, // 动态生成表名
                    createTableSQL: baseData.createTableSQL,
                    data: baseData.data.map(row => {
                        // 随机增加点位数据
                        const increment = Math.floor(Math.random() * 10); // 随机增加 0-9
                        return {
                            ...row,
                            value: row.value + increment, // 假设 value 是需要累加的字段
                            date: currentDate.toISOString().split('T')[0] // 更新日期
                        };
                    })
                };

                // 保存新数据
                await fs.writeFile(newFilePath, JSON.stringify(newData, null, 2));
                console.log(`生成文件: ${newFileName}`);
            }

            // 增加一天
            currentDate.setDate(currentDate.getDate() + 1);
        }

        console.log('每日数据生成完成');
    } catch (error) {
        console.error('生成每日数据时发生错误:', error);
    }
}

// 导入数据
async function importTables() {
    const connectionPool = mysql.createPool(mysqlConfig);
    try {
        console.log('数据库连接池创建成功');

        // 读取导出目录
        const files = await fs.readdir(exportDir);

        // 按文件名排序，确保按日期顺序导入
        files.sort();

        for (const file of files) {
            if (!file.endsWith('.json')) continue;

            console.log(`\n开始处理文件: ${file}`);
            try {
                // 读取JSON文件
                const filePath = path.join(exportDir, file);
                const fileContent = await fs.readFile(filePath, 'utf8');
                const tableData = JSON.parse(fileContent);

                // 获取一个连接
                const connection = await connectionPool.getConnection();

                // 检查表是否已存在
                const [existingTables] = await connection.execute(
                    `SHOW TABLES LIKE '${tableData.tableName}'`
                );

                // 如果表已存在，跳过创建
                if (existingTables.length > 0) {
                    console.log(`表 ${tableData.tableName} 已存在，跳过创建`);
                    connection.release();
                    continue;
                }

                // 创建表
                console.log(`创建表 ${tableData.tableName}`);
                await connection.execute(tableData.createTableSQL);

                // 如果数据为空，继续下一个表
                if (!tableData.data || tableData.data.length === 0) {
                    console.log(`表 ${tableData.tableName} 没有数据，跳过导入`);
                    connection.release();
                    continue;
                }

                // 准备批量插入数据
                const columns = Object.keys(tableData.data[0]);
                const placeholders = `(${columns.map(() => '?').join(',')})`;
                const insertSQL = `INSERT INTO ${tableData.tableName} (${columns.join(',')}) VALUES ${placeholders}`;

                // 分批插入数据，每批 1000 条
                const batchSize = 1000;
                for (let i = 0; i < tableData.data.length; i += batchSize) {
                    const batch = tableData.data.slice(i, i + batchSize);
                    const values = batch.map(row => columns.map(col => row[col]));

                    // 将多条数据合并为一条 INSERT 语句
                    const batchInsertSQL = `INSERT INTO ${tableData.tableName} (${columns.join(',')}) VALUES ${values.map(() => placeholders).join(',')}`;
                    const flattenedValues = values.flat();

                    await connection.execute(batchInsertSQL, flattenedValues);

                    console.log(`已导入 ${tableData.tableName} 的 ${Math.min(i + batchSize, tableData.data.length)}/${tableData.data.length} 条记录`);
                }

                console.log(`表 ${tableData.tableName} 导入完成`);
                connection.release();

            } catch (error) {
                console.error(`处理文件 ${file} 时发生错误:`, error);
                // 继续处理下一个文件
                continue;
            }
        }

        console.log('\n所有表导入完成');

    } catch (error) {
        console.error('导入过程中发生错误:', error);
    } finally {
        await connectionPool.end();
        console.log('数据库连接池已关闭');
    }
}

// 执行生成和导入
async function main() {
    await generateDailyData(); // 生成每日数据
    await importTables(); // 导入数据
}

// 执行主函数
main().catch(console.error);