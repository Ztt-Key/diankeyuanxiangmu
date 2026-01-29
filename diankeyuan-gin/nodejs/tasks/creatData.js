const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// MySQL 配置
const mysqlConfig = {
    host: 'localhost',
    user: 'root',
    password: 'KE_MySQL_123456',
    database: 'emsdata',
    port: 13306
};

// 配置
const startDate = '20240306';
const endDate = '20250211';
const minIncrease = 2;
const maxIncrease = 10;
const baseFilePath = path.join(__dirname, 'exported_tables', `minyc${startDate}.json`);

// 生成日期列表
function generateDateList(start, end) {
    const dates = [];
    let currentDate = new Date(
        parseInt(start.slice(0, 4)),
        parseInt(start.slice(4, 6)) - 1,
        parseInt(start.slice(6, 8))
    );
    const endDateObj = new Date(
        parseInt(end.slice(0, 4)),
        parseInt(end.slice(4, 6)) - 1,
        parseInt(end.slice(6, 8))
    );
    while (currentDate <= endDateObj) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        dates.push(`${year}${month}${day}`);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}

// 生成数据并插入数据库
async function generateData() {
    const connection = await mysql.createConnection(mysqlConfig);
    try {
        console.log('数据库连接成功');
        
        const dateList = generateDateList(startDate, endDate);
        
        // 读取 20240306.json 作为基准数据
        const fileContent = await fs.readFile(baseFilePath, 'utf8');
        const baseData = JSON.parse(fileContent).data;
        const createTableSQL = JSON.parse(fileContent).createTableSQL;

        for (let i = 1; i < dateList.length; i++) {
            const newDate = dateList[i];
            const newTable = `minyc${newDate}`;
            
            // 检查表是否存在
            const [existingTables] = await connection.execute(
                `SHOW TABLES LIKE '${newTable}'`
            );
            if (existingTables.length > 0) {
                console.log(`表 ${newTable} 已存在，跳过`);
                continue;
            }

            console.log(`创建表 ${newTable}`);
            await connection.execute(createTableSQL.replace(startDate, newDate));

            // 生成新数据
            const newData = baseData.map(entry => {
                return {
                    ...entry,
                    data: entry.data + Math.floor(Math.random() * (maxIncrease - minIncrease + 1)) + minIncrease
                };
            });

            // 插入新数据
            const columns = Object.keys(newData[0]);
            const placeholders = columns.map(() => '?').join(',');
            const insertSQL = `INSERT INTO \`${newTable}\` (${columns.join(',')}) VALUES (${placeholders})`;
            
            for (const row of newData) {
                const values = columns.map(col => row[col]);
                await connection.execute(insertSQL, values);
            }

            console.log(`表 ${newTable} 数据生成完成`);
        }

        console.log('所有数据生成完毕');
    } catch (error) {
        console.error('数据生成出错:', error);
    } finally {
        await connection.end();
        console.log('数据库连接已关闭');
    }
}

generateData();
