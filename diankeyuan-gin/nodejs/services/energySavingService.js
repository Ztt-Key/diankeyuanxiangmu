const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');
const prisma = new PrismaClient();
// MySQL 配置
const mysqlConfig = {
    host: 'localhost',
    user: 'root',
    password: 'KE_MySQL_123456',
    database: 'emsdata',
    port: 3306
};
// 实际
// const mysqlConfig = {
//     host: '192.168.1.230',
//     user: 'root',
//     password: 'KE_MySQL_123456',
//     database: 'emsdata',
//     port: 13306
// };
class EnergySavingService {

    // 获取园区用电量图表
    async getChartData(building, timeType) {
        let mysqlConnection;
        try {
            // 从 PostgreSQL 获取未删除的点位
            const subscribedItems = await prisma.energySavingSubscription.findMany({
                where: {
                    deleted_at: null  // 只保留未删除的条件
                },
                select: {
                    name: true,
                    described: true
                }
            });
            // console.log('Total subscribed items:', subscribedItems.length);

            // 修改筛选逻辑，针对不同建筑物使用不同的匹配规则
            const filteredItems = subscribedItems.filter(item => {
                const buildingKey = `${building}座`;

                // C座特殊处理
                if (building === 'C') {
                    // 同时包含 "正向有功" 和 "电能" 的点位
                    const matches = item.described.includes(buildingKey) &&
                        item.described.includes('正向有功') &&
                        item.described.includes('电能');

                    return matches;
                }

                // 其他建筑物保持原有逻辑
                return item.described.includes(buildingKey) &&
                    item.described.includes('正向有功电能');
            });

            const subscribedNames = filteredItems.map(item => item.name);

            if (subscribedNames.length === 0) {
                console.log(`No subscribed items found for building ${building} with active power energy`);
                return { dates: [], values: [], isAllZero: true };
            }

            // 构建返回数据结构
            const result = {
                daily: {
                    dates: [],
                    values: []
                },
                monthly: {
                    dates: ['1月', '2月', '3月', '4月', '5月'],
                    values: []
                }
            };

            // 修改返回结构，添加标志位
            const formatResponse = (dates, values) => {
                // 检查数据是否全部为0
                const isAllZero = values.length > 0 && values.every(v => v === 0);
                
                return {
                    dates: dates,
                    values: values,
                    isAllZero: isAllZero  // 添加标志位
                };
            };

            if (timeType === 'daily') {
                const today = new Date();
                const dates = [];
                const tableNames = [];
                const values = [];

                // 修改循环范围：从9天前到昨天（总共10天）
                for (let i = 9; i >= 0; i--) {  // 改为从9到0，获取10天的数据
                    const date = new Date(today);
                    date.setDate(date.getDate() - (i + 1));  // 加1确保从昨天开始
                    const formattedDate = `${date.getMonth() + 1}-${date.getDate()}`;
                    dates.push(formattedDate);

                    const tableName = `minyc${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
                    tableNames.push(tableName);

                    console.log('生成日期信息：', {
                        i,
                        date: date.toISOString(),
                        formattedDate,
                        tableName
                    });
                }

                // 建立 MySQL 连接
                mysqlConnection = await mysql.createConnection(mysqlConfig);

                try {
                    // 遍历处理每一天的数据
                    for (let i = 0; i < tableNames.length - 1; i++) {
                        try {
                            const currentTable = tableNames[i];
                            const nextTable = tableNames[i + 1];

                            console.log(`\n处理日期 ${dates[i]}:`);
                            console.log(`检查表: ${currentTable} -> ${nextTable}`);

                            // 检查表是否存在
                            const [currentTableExists] = await mysqlConnection.execute(`SHOW TABLES LIKE '${currentTable}'`);
                            const [nextTableExists] = await mysqlConnection.execute(`SHOW TABLES LIKE '${nextTable}'`);

                            // 添加详细的调试信息
                            console.log('表存在性检查:', {
                                currentTable,
                                currentExists: currentTableExists.length > 0,
                                nextTable,
                                nextExists: nextTableExists.length > 0
                            });

                            // 如果当前日期的表不存在，尝试向前查找最近的可用表
                            if (currentTableExists.length === 0) {
                                console.log(`表 ${currentTable} 不存在，尝试查找前一天的数据...`);
                                // 这里可以添加向前查找逻辑
                                values.push(0);
                                continue;
                            }

                            // 如果下一天的表不存在，尝试向后查找最近的可用表
                            if (nextTableExists.length === 0) {
                                console.log(`表 ${nextTable} 不存在，尝试查找后一天的数据...`);
                                // 这里可以添加向后查找逻辑
                                values.push(0);
                                continue;
                            }

                            // 如果两个表都存在，执行正常的查询
                            const currentDayQuery = `
                                SELECT name, MAX(data) as max_data
                                FROM ${currentTable}
                                WHERE name IN (${subscribedNames.map(() => '?').join(',')})
                                GROUP BY name
                            `;

                            const nextDayQuery = `
                                SELECT name, MAX(data) as max_data
                                FROM ${nextTable}
                                WHERE name IN (${subscribedNames.map(() => '?').join(',')})
                                GROUP BY name
                            `;

                            const [currentDayRows] = await mysqlConnection.execute(currentDayQuery, subscribedNames);
                            const [nextDayRows] = await mysqlConnection.execute(nextDayQuery, subscribedNames);

                            console.log(`查询结果 - 当前表数据点: ${currentDayRows.length}, 下一天数据点: ${nextDayRows.length}`);

                            // 计算差值
                            const consumption = nextDayRows.reduce((sum, nextRow) => {
                                const currentRow = currentDayRows.find(row => row.name === nextRow.name);
                                if (currentRow) {
                                    const diff = nextRow.max_data - currentRow.max_data;
                                    if (diff <= 0) {
                                        console.log(`警告: 点位 ${nextRow.name} 差值异常: ${diff}`);
                                    }
                                    return sum + (diff > 0 ? diff : 0);
                                }
                                console.log(`警告: 找不到对应的当前数据点 ${nextRow.name}`);
                                return sum;
                            }, 0);

                            console.log(`计算得到的消耗量: ${consumption}`);
                            values.push(Number(consumption.toFixed(2)));

                        } catch (error) {
                            console.error(`处理日期 ${dates[i]} 时发生错误:`, error);
                            values.push(0);
                        }
                    }

                    // 添加最后一天的数据处理
                    try {
                        const lastIndex = tableNames.length - 1;
                        const currentTable = tableNames[lastIndex];
                        const nextTable = `minyc${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

                        // 检查表是否存在
                        const [currentTableExists] = await mysqlConnection.execute(`SHOW TABLES LIKE '${currentTable}'`);
                        const [nextTableExists] = await mysqlConnection.execute(`SHOW TABLES LIKE '${nextTable}'`);

                        if (currentTableExists.length === 0 || nextTableExists.length === 0) {
                            console.log(`Table ${currentTable} or ${nextTable} doesn't exist, skipping...`);
                            values.push(0);
                        } else {
                            // 获取最后一天的数据
                            const currentDayQuery = `
                    SELECT name, MAX(data) as max_data
                    FROM ${currentTable}
                    WHERE name IN (${subscribedNames.map(() => '?').join(',')})
                    GROUP BY name
                `;

                            const nextDayQuery = `
                    SELECT name, MAX(data) as max_data
                    FROM ${nextTable}
                    WHERE name IN (${subscribedNames.map(() => '?').join(',')})
                    GROUP BY name
                `;

                            const [currentDayRows] = await mysqlConnection.execute(currentDayQuery, subscribedNames);
                            const [nextDayRows] = await mysqlConnection.execute(nextDayQuery, subscribedNames);

                            const consumption = nextDayRows.reduce((sum, nextRow) => {
                                const currentRow = currentDayRows.find(row => row.name === nextRow.name);
                                if (currentRow) {
                                    const diff = nextRow.max_data - currentRow.max_data;
                                    return sum + (diff > 0 ? diff : 0);
                                }
                                return sum;
                            }, 0);

                            values.push(Number(consumption.toFixed(2)));
                        }
                    } catch (error) {
                        console.error('Error processing last day:', error);
                        values.push(0);
                    }

                    return formatResponse(dates, values);

                } catch (error) {
                    console.error('Query error:', error);
                    return formatResponse(dates, values);
                } finally {
                    if (mysqlConnection) {
                        await mysqlConnection.end();
                        console.log('MySQL connection closed');
                    }
                }
            }

            if (timeType === 'monthly') {
                const today = new Date();
                const dates = [];
                const values = [];

                // 建立 MySQL 连接
                mysqlConnection = await mysql.createConnection(mysqlConfig);
                console.log('MySQL connection established');

                try {
                    // 获取前6个月的数据（包括当前月）
                    for (let i = 5; i >= 0; i--) {
                        const currentDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
                        dates.push(`${currentDate.getMonth() + 1}月`);

                        // 获取月初和月末的日期
                        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                        const daysInMonth = monthEnd.getDate();

                        console.log(`处理月份: ${currentDate.getMonth() + 1}月，该月共${daysInMonth}天`);

                        try {
                            // 扫描整个月份，查找存在的表
                            const existingTables = [];
                            const tableDates = [];
                            
                            // 检查该月每一天的表是否存在
                            for (let day = 1; day <= daysInMonth; day++) {
                                const testDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
                                const testTable = `minyc${testDate.getFullYear()}${String(testDate.getMonth() + 1).padStart(2, '0')}${String(testDate.getDate()).padStart(2, '0')}`;
                                
                                try {
                                    const [exists] = await mysqlConnection.execute(`SHOW TABLES LIKE '${testTable}'`);
                                    if (exists.length > 0) {
                                        existingTables.push(testTable);
                                        tableDates.push(testDate);
                                        console.log(`找到表: ${testTable}, 日期: ${testDate.toISOString().split('T')[0]}`);
                                    }
                                } catch (error) {
                                    console.error(`检查表 ${testTable} 时出错:`, error);
                                }
                            }

                            console.log(`${currentDate.getMonth() + 1}月份共找到 ${existingTables.length} 个表`);

                            // 如果没有找到任何表，跳过该月份
                            if (existingTables.length === 0) {
                                console.log(`${currentDate.getMonth() + 1}月份没有找到任何数据表，跳过统计`);
                                values.push(0);
                                continue;
                            }

                            // 如果只找到一个表，无法计算用电量差值，标记为0
                            if (existingTables.length === 1) {
                                console.log(`${currentDate.getMonth() + 1}月份只找到一个数据表，无法计算用电量差值`);
                                values.push(0);
                                continue;
                            }

                            // 对找到的表按日期排序
                            const sortedIndices = tableDates.map((date, index) => ({ date, index }))
                                .sort((a, b) => a.date - b.date)
                                .map(item => item.index);

                            // 获取最早和最晚的表
                            const earliestTableIndex = sortedIndices[0];
                            const latestTableIndex = sortedIndices[sortedIndices.length - 1];
                            
                            const startTable = existingTables[earliestTableIndex];
                            const endTable = existingTables[latestTableIndex];
                            
                            const startDate = tableDates[earliestTableIndex];
                            const endDate = tableDates[latestTableIndex];

                            console.log(`选择计算区间: ${startDate.toISOString().split('T')[0]} 到 ${endDate.toISOString().split('T')[0]}`);
                            console.log(`使用表: ${startTable} 到 ${endTable}`);

                            // 获取开始和结束时间的数据
                            const [startMonthRows] = await mysqlConnection.execute(
                                `SELECT name, MAX(data) as max_data FROM ${startTable} WHERE name IN (${subscribedNames.map(() => '?').join(',')}) GROUP BY name`,
                                subscribedNames
                            );

                            const [endMonthRows] = await mysqlConnection.execute(
                                `SELECT name, MAX(data) as max_data FROM ${endTable} WHERE name IN (${subscribedNames.map(() => '?').join(',')}) GROUP BY name`,
                                subscribedNames
                            );

                            console.log(`查询结果 - 开始表数据点: ${startMonthRows.length}, 结束表数据点: ${endMonthRows.length}`);

                            // 计算月度用电量
                            const monthlyConsumption = endMonthRows.reduce((sum, endRow) => {
                                const startRow = startMonthRows.find(row => row.name === endRow.name);
                                if (startRow) {
                                    const diff = endRow.max_data - startRow.max_data;
                                    if (diff <= 0) {
                                        console.log(`警告: 点位 ${endRow.name} 差值异常: ${diff}`);
                                    }
                                    return sum + (diff > 0 ? diff : 0);
                                }
                                return sum;
                            }, 0);

                            // 如果开始和结束日期间隔不是整月，按比例放大到整月用电量
                            const daysDiff = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                            let adjustedConsumption = monthlyConsumption;
                            
                            if (daysDiff < daysInMonth * 0.9) {  // 如果间隔小于该月天数的90%，进行调整
                                const ratio = daysInMonth / daysDiff;
                                adjustedConsumption = monthlyConsumption * ratio;
                                console.log(`用电量调整: 原始用电量 ${monthlyConsumption} 基于 ${daysDiff}/${daysInMonth} 天，调整后 ${adjustedConsumption}`);
                            }

                            console.log(`${currentDate.getMonth() + 1}月用电量: ${adjustedConsumption.toFixed(2)}`);
                            values.push(Number(adjustedConsumption.toFixed(2)));

                        } catch (error) {
                            console.error(`处理月份 ${currentDate.getMonth() + 1} 时发生错误:`, error);
                            values.push(0);
                        }
                    }

                    return formatResponse(dates, values);
                } finally {
                    if (mysqlConnection) {
                        await mysqlConnection.end();
                        console.log('MySQL connection closed');
                    }
                }
            }

            // 添加年视图处理逻辑
            if (timeType === 'yearly') {
                const dates = [];
                const values = [];

                // 建立 MySQL 连接
                mysqlConnection = await mysql.createConnection(mysqlConfig);
                console.log('MySQL connection established for yearly view');

                try {
                    const currentYear = new Date().getFullYear();
                    const today = new Date();

                    // 从当前年份往前推4年
                    for (let i = 4; i >= 0; i--) {
                        const year = currentYear - i;
                        dates.push(`${year}年`);
                        
                        console.log(`开始处理 ${year} 年度数据`);
                        
                        try {
                            let yearlyConsumptionValue = 0;
                            let calculationMethod = '';
                            let yearDataCalculated = false;
                            
                            // 方法1: 尝试使用固定计算区间: 年份-01-01 到 年份-12-31
                            console.log(`方法1: 尝试使用固定计算区间: ${year}-01-01 到 ${year}-12-31`);
                            
                            // 定义理想的年初和年末表名
                            const yearStartTableName = `minyc${year}0101`;
                            const yearEndTableName = `minyc${year}1231`;
                            
                            // 检查理想的表是否存在
                            const [startTableExists] = await mysqlConnection.execute(`SHOW TABLES LIKE '${yearStartTableName}'`);
                            const [endTableExists] = await mysqlConnection.execute(`SHOW TABLES LIKE '${yearEndTableName}'`);
                            
                            console.log(`年初表 ${yearStartTableName} 存在: ${startTableExists.length > 0}`);
                            console.log(`年末表 ${yearEndTableName} 存在: ${endTableExists.length > 0}`);
                            
                            let actualStartTable = null;
                            let actualEndTable = null;
                            
                            // 如果理想表存在，直接使用
                            if (startTableExists.length > 0) {
                                actualStartTable = yearStartTableName;
                            }
                            
                            if (endTableExists.length > 0) {
                                actualEndTable = yearEndTableName;
                            }
                            
                            // 如果当前年份，并且是处理当前年份
                            if (year === currentYear && !actualEndTable) {
                                // 使用今天的数据表作为年末表
                                const todayTable = `minyc${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
                                const [todayTableExists] = await mysqlConnection.execute(`SHOW TABLES LIKE '${todayTable}'`);
                                
                                if (todayTableExists.length > 0) {
                                    actualEndTable = todayTable;
                                    console.log(`使用当前日期表 ${todayTable} 作为年末表`);
                                }
                            }
                            
                            // 如果理想表不存在，查找替代表
                            if (!actualStartTable || !actualEndTable) {
                                console.log(`理想表不完整，搜索替代表...`);
                                
                                // 查询该年份所有表
                                const [allTables] = await mysqlConnection.execute('SHOW TABLES');
                                const yearPrefix = `minyc${year}`;
                                
                                // 筛选出属于当前年份的表
                                const yearTables = allTables
                                    .map(row => Object.values(row)[0]) // 获取表名
                                    .filter(tableName => tableName.startsWith(yearPrefix))
                                    .sort(); // 按名称排序（按日期排序）
                                
                                console.log(`${year}年找到 ${yearTables.length} 个表`);
                                
                                if (yearTables.length >= 2) {
                                    // 如果年初表不存在，使用该年最早的表
                                    if (!actualStartTable) {
                                        actualStartTable = yearTables[0];
                                        console.log(`使用 ${actualStartTable} 替代年初表`);
                                    }
                                    
                                    // 如果年末表不存在，使用该年最晚的表
                                    if (!actualEndTable) {
                                        actualEndTable = yearTables[yearTables.length - 1];
                                        console.log(`使用 ${actualEndTable} 替代年末表`);
                                    }
                                } else {
                                    console.log(`${year}年数据表不足，无法使用方法1`);
                                }
                            }
                            
                            // 如果找到了合适的表，计算年度用电量
                            if (actualStartTable && actualEndTable) {
                                // 从表名解析日期
                                const getDateFromTable = (tableName) => {
                                    const yearStr = tableName.substring(5, 9);
                                    const monthStr = tableName.substring(9, 11);
                                    const dayStr = tableName.substring(11, 13);
                                    return new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
                                };
                                
                                const startDate = getDateFromTable(actualStartTable);
                                const endDate = getDateFromTable(actualEndTable);
                                
                                console.log(`实际计算区间: ${startDate.toISOString().split('T')[0]} 到 ${endDate.toISOString().split('T')[0]}`);
                                console.log(`使用表: ${actualStartTable} 到 ${actualEndTable}`);
                                
                                // 获取统计数据
                                const [startYearData] = await mysqlConnection.execute(
                                    `SELECT name, MAX(data) as max_data FROM ${actualStartTable} WHERE name IN (${subscribedNames.map(() => '?').join(',')}) GROUP BY name`,
                                    subscribedNames
                                );

                                const [endYearData] = await mysqlConnection.execute(
                                    `SELECT name, MAX(data) as max_data FROM ${actualEndTable} WHERE name IN (${subscribedNames.map(() => '?').join(',')}) GROUP BY name`,
                                    subscribedNames
                                );
                                
                                console.log(`查询结果 - 开始表数据点: ${startYearData.length}, 结束表数据点: ${endYearData.length}`);

                                if (startYearData.length > 0 && endYearData.length > 0) {
                                    // 计算年度用电量
                                    const yearlyConsumption = endYearData.reduce((sum, endRow) => {
                                        const startRow = startYearData.find(row => row.name === endRow.name);
                                        if (startRow) {
                                            const diff = endRow.max_data - startRow.max_data;
                                            if (diff <= 0) {
                                                console.log(`警告: 点位 ${endRow.name} 差值异常: ${diff}`);
                                                return sum;
                                            }
                                            return sum + diff;
                                        }
                                        return sum;
                                    }, 0);
                                    
                                    // 使用原始用电量，不进行任何调整
                                    let adjustedConsumption = yearlyConsumption;
                                    console.log(`使用原始用电量，不进行调整: ${yearlyConsumption.toFixed(2)}`);
                                    
                                    // 计算理想情况下应该的天数（1月1日到12月31日）
                                    const idealStartDate = new Date(year, 0, 1); // 1月1日
                                    const idealEndDate = new Date(year, 11, 31); // 12月31日
                                    const idealDaysDiff = Math.round((idealEndDate - idealStartDate) / (1000 * 60 * 60 * 24)) + 1;
                                    
                                    // 计算实际使用的天数
                                    const startDate = getDateFromTable(actualStartTable);
                                    const endDate = getDateFromTable(actualEndTable);
                                    const actualDaysDiff = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                                    
                                    // 记录实际区间与理想区间的差异，但不进行调整
                                    if (actualDaysDiff < idealDaysDiff * 0.9) {
                                        console.log(`实际计算天数 ${actualDaysDiff} 小于理想天数 ${idealDaysDiff} 的90%，但按要求不进行调整`);
                                    }
                                    
                                    // 特殊处理当前年份（当前进行中的年份）- 仅记录不调整
                                    if (year === currentYear) {
                                        // 如果是当前年份，记录信息但不预测全年数据
                                        const currentDayOfYear = Math.floor((today - new Date(year, 0, 1)) / (1000 * 60 * 60 * 24)) + 1;
                                        const daysInYear = year % 4 === 0 ? 366 : 365; // 闰年判断
                                        
                                        if (currentDayOfYear < daysInYear * 0.98) { // 如果当前日期不是接近年底
                                            console.log(`当前年份已过 ${currentDayOfYear}/${daysInYear} 天，但按要求不进行预测调整`);
                                        }
                                    }

                                    console.log(`方法1: ${year}年用电量计算结果: ${adjustedConsumption.toFixed(2)}`);
                                    yearlyConsumptionValue = adjustedConsumption;
                                    calculationMethod = '年度表计算法';
                                    yearDataCalculated = true;
                                } else {
                                    console.log(`方法1: 表数据不完整，无法计算年度用电量`);
                                }
                            } else {
                                console.log(`方法1失败: 找不到合适的年度表`);
                            }
                            
                            // 方法2: 按月累加数据计算年度用电
                            if (!yearDataCalculated) {
                                console.log(`方法2: 尝试通过累加月度数据计算 ${year} 年用电量`);
                                
                                let totalYearConsumption = 0;
                                let monthsWithData = 0;
                                const monthsInYear = 12;
                                
                                console.log(`开始逐月检查 ${year} 年的数据...`);
                                
                                // 逐月计算每个月的用电量
                                for (let month = 1; month <= 12; month++) {
                                    // 如果处理当前年份的当前月份及之后的月份，跳过这些未来月份
                                    if (year === currentYear && month > today.getMonth() + 1) {
                                        console.log(`跳过未来月份: ${year}-${month}`);
                                        continue;
                                    }
                                    
                                    console.log(`检查月份 ${year}-${month} 的数据表`);
                                    
                                    // 获取月初和月末日期
                                    const monthStart = new Date(year, month - 1, 1);
                                    const monthEnd = new Date(year, month, 0); // 获取月末日期
                                    const daysInMonth = monthEnd.getDate();
                                    
                                    // 生成月初和月末表名
                                    const monthStartTable = `minyc${year}${String(month).padStart(2, '0')}01`;
                                    const monthEndTable = `minyc${year}${String(month).padStart(2, '0')}${String(daysInMonth).padStart(2, '0')}`;
                                    
                                    // 检查月初和月末表是否存在
                                    const [startTableExists] = await mysqlConnection.execute(`SHOW TABLES LIKE '${monthStartTable}'`);
                                    const [endTableExists] = await mysqlConnection.execute(`SHOW TABLES LIKE '${monthEndTable}'`);
                                    
                                    let monthConsumption = 0;
                                    let monthHasData = false;
                                    
                                    // 如果月初和月末表都存在，直接计算
                                    if (startTableExists.length > 0 && endTableExists.length > 0) {
                                        console.log(`月份 ${year}-${month} 首尾表完整，直接计算`);
                                        
                                        const [startMonthRows] = await mysqlConnection.execute(
                                            `SELECT name, MAX(data) as max_data FROM ${monthStartTable} WHERE name IN (${subscribedNames.map(() => '?').join(',')}) GROUP BY name`,
                                            subscribedNames
                                        );
                                        
                                        const [endMonthRows] = await mysqlConnection.execute(
                                            `SELECT name, MAX(data) as max_data FROM ${monthEndTable} WHERE name IN (${subscribedNames.map(() => '?').join(',')}) GROUP BY name`,
                                            subscribedNames
                                        );
                                        
                                        console.log(`月份 ${year}-${month}: 起始表有 ${startMonthRows.length} 个点位，结束表有 ${endMonthRows.length} 个点位`);
                                        
                                        if (startMonthRows.length > 0 && endMonthRows.length > 0) {
                                            monthConsumption = endMonthRows.reduce((sum, endRow) => {
                                                const startRow = startMonthRows.find(row => row.name === endRow.name);
                                                if (startRow) {
                                                    const diff = endRow.max_data - startRow.max_data;
                                                    if (diff <= 0) {
                                                        console.log(`警告: 点位 ${endRow.name} 差值异常: ${diff}`);
                                                        return sum;
                                                    }
                                                    return sum + diff;
                                                }
                                                return sum;
                                            }, 0);
                                            
                                            if (monthConsumption > 0) {
                                                // 如果天数不足该月的90%，按比例放大
                                                if (daysDiff < daysInMonth * 0.9) {
                                                    console.log(`月份 ${year}-${month} 计算天数 ${daysDiff} 小于月天数 ${daysInMonth} 的90%，但按要求不调整用电量`);
                                                }
                                                
                                                console.log(`月份 ${year}-${month} 用电量: ${monthConsumption.toFixed(2)}`);
                                                monthHasData = true;
                                            } else {
                                                console.log(`月份 ${year}-${month} 计算得到的用电量为零，可能存在数据问题`);
                                            }
                                        } else {
                                            console.log(`月份 ${year}-${month} 表虽然存在但没有匹配的点位数据`);
                                        }
                                    } 
                                    // 如果月初或月末表不存在，尝试查找该月所有表
                                    else {
                                        if (startTableExists.length === 0) {
                                            console.log(`月初表 ${monthStartTable} 不存在`);
                                        }
                                        if (endTableExists.length === 0) {
                                            console.log(`月末表 ${monthEndTable} 不存在`);
                                        }
                                        
                                        console.log(`月份 ${year}-${month} 首尾表不完整，查找该月所有表`);
                                        
                                        // 查询该月所有表
                                        const [allTables] = await mysqlConnection.execute('SHOW TABLES');
                                        const monthPrefix = `minyc${year}${String(month).padStart(2, '0')}`;
                                        
                                        // 筛选出属于当前月份的表
                                        const monthTables = allTables
                                            .map(row => Object.values(row)[0]) // 获取表名
                                            .filter(tableName => tableName.startsWith(monthPrefix))
                                            .sort(); // 按名称排序
                                        
                                        console.log(`月份 ${year}-${month} 找到 ${monthTables.length} 个表`);
                                        
                                        // 如果该月有2个以上表，可以计算用电量
                                        if (monthTables.length >= 2) {
                                            // 获取最早和最晚的表
                                            const earliestTable = monthTables[0];
                                            const latestTable = monthTables[monthTables.length - 1];
                                            
                                            console.log(`使用替代表: ${earliestTable} -> ${latestTable}`);
                                            
                                            // 获取该月用电数据
                                            const [startMonthRows] = await mysqlConnection.execute(
                                                `SELECT name, MAX(data) as max_data FROM ${earliestTable} WHERE name IN (${subscribedNames.map(() => '?').join(',')}) GROUP BY name`,
                                                subscribedNames
                                            );
                                            
                                            const [endMonthRows] = await mysqlConnection.execute(
                                                `SELECT name, MAX(data) as max_data FROM ${latestTable} WHERE name IN (${subscribedNames.map(() => '?').join(',')}) GROUP BY name`,
                                                subscribedNames
                                            );
                                            
                                            console.log(`月份 ${year}-${month}: 替代起始表有 ${startMonthRows.length} 个点位，替代结束表有 ${endMonthRows.length} 个点位`);
                                            
                                            // 计算月度用电量
                                            if (startMonthRows.length > 0 && endMonthRows.length > 0) {
                                                monthConsumption = endMonthRows.reduce((sum, endRow) => {
                                                    const startRow = startMonthRows.find(row => row.name === endRow.name);
                                                    if (startRow) {
                                                        const diff = endRow.max_data - startRow.max_data;
                                                        if (diff <= 0) {
                                                            console.log(`警告: 替代点位 ${endRow.name} 差值异常: ${diff}`);
                                                            return sum;
                                                        }
                                                        return sum + diff;
                                                    }
                                                    return sum;
                                                }, 0);
                                                
                                                // 从表名解析日期
                                                const getDateFromTable = (tableName) => {
                                                    const yearStr = tableName.substring(5, 9);
                                                    const monthStr = tableName.substring(9, 11);
                                                    const dayStr = tableName.substring(11, 13);
                                                    return new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
                                                };
                                                
                                                const startDate = getDateFromTable(earliestTable);
                                                const endDate = getDateFromTable(latestTable);
                                                const daysDiff = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                                                
                                                // 如果天数不足该月的90%，按比例放大
                                                if (daysDiff < daysInMonth * 0.9) {
                                                    console.log(`月份 ${year}-${month} 计算天数 ${daysDiff} 小于月天数 ${daysInMonth} 的90%，但按要求不调整用电量`);
                                                }
                                                
                                                console.log(`月份 ${year}-${month} 用电量: ${monthConsumption.toFixed(2)}`);
                                                monthHasData = true;
                                            } else {
                                                console.log(`月份 ${year}-${month} 替代表没有匹配的点位数据`);
                                            }
                                        } else {
                                            console.log(`月份 ${year}-${month} 没有足够的数据表，跳过`);
                                        }
                                    }
                                    
                                    // 如果该月有数据，累加到年度总量
                                    if (monthHasData && monthConsumption > 0) {
                                        totalYearConsumption += monthConsumption;
                                        monthsWithData++;
                                        console.log(`累计: ${year}年已有 ${monthsWithData} 个月有效数据，累计用电量 ${totalYearConsumption.toFixed(2)}`);
                                    }
                                }
                                
                                console.log(`${year}年统计结果: ${monthsWithData}个月有数据，累计用电量 ${totalYearConsumption.toFixed(2)}`);
                                
                                // 如果至少有一个月有数据，计算全年估计用电量
                                if (monthsWithData > 0) {
                                    console.log(`方法2: ${year}年有 ${monthsWithData} 个月的数据，月度累计用电量: ${totalYearConsumption.toFixed(2)}`);
                                    
                                    // 不再根据月份数据预测全年
                                    if (monthsWithData < monthsInYear && year !== currentYear) {
                                        console.log(`年数据不完整: 只有 ${monthsWithData} 个月的数据，但按要求不进行预测，直接使用累计值 ${totalYearConsumption.toFixed(2)}`);
                                    } else if (year === currentYear) {
                                        // 当前年份特殊处理：仅记录，不预测
                                        if (monthsWithData < today.getMonth() + 1) {
                                            console.log(`当前年份数据不完整: 已过 ${today.getMonth() + 1} 个月，但只有 ${monthsWithData} 个月有数据，按要求不进行预测`);
                                        }
                                        console.log(`当前年份 ${year} 使用已有 ${monthsWithData} 个月实际数据，总计: ${totalYearConsumption.toFixed(2)}`);
                                    }
                                    
                                    console.log(`方法2: ${year}年用电量计算结果(不调整): ${totalYearConsumption.toFixed(2)}`);
                                    yearlyConsumptionValue = totalYearConsumption;
                                    calculationMethod = '月度累加法';
                                    yearDataCalculated = true;
                                } else {
                                    console.log(`方法2失败: ${year}年没有找到任何月度数据`);
                                }
                            }
                            
                            // 方法3: 直接搜索该年所有表
                            if (!yearDataCalculated) {
                                console.log(`方法3: 尝试通过直接查询所有表计算 ${year} 年用电量`);
                                try {
                                    // 获取所有可能的年度表
                                    const [allTables] = await mysqlConnection.execute('SHOW TABLES');
                                    const yearPrefix = `minyc${year}`;
                                    
                                    // 筛选出属于当年的所有表，按日期排序
                                    const yearTables = allTables
                                        .map(row => Object.values(row)[0])
                                        .filter(tableName => tableName.startsWith(yearPrefix))
                                        .sort();
                                    
                                    console.log(`找到 ${yearTables.length} 个与 ${year} 年相关的表`);
                                    
                                    if (yearTables.length >= 2) {
                                        // 取第一个和最后一个表进行计算
                                        const firstTable = yearTables[0];
                                        const lastTable = yearTables[yearTables.length - 1];
                                        
                                        console.log(`尝试使用年度首尾表: ${firstTable} -> ${lastTable}`);
                                        
                                        // 获取数据
                                        const [firstData] = await mysqlConnection.execute(
                                            `SELECT name, MAX(data) as max_data FROM ${firstTable} WHERE name IN (${subscribedNames.map(() => '?').join(',')}) GROUP BY name`,
                                            subscribedNames
                                        );
                                        
                                        const [lastData] = await mysqlConnection.execute(
                                            `SELECT name, MAX(data) as max_data FROM ${lastTable} WHERE name IN (${subscribedNames.map(() => '?').join(',')}) GROUP BY name`,
                                            subscribedNames
                                        );
                                        
                                        console.log(`年度计算: 首表有 ${firstData.length} 个点位，尾表有 ${lastData.length} 个点位`);
                                        
                                        if (firstData.length > 0 && lastData.length > 0) {
                                            // 计算用电量
                                            const yearConsumption = lastData.reduce((sum, lastRow) => {
                                                const firstRow = firstData.find(row => row.name === lastRow.name);
                                                if (firstRow) {
                                                    const diff = lastRow.max_data - firstRow.max_data;
                                                    if (diff <= 0) {
                                                        console.log(`警告: 点位 ${lastRow.name} 年度差值异常: ${diff}`);
                                                        return sum;
                                                    }
                                                    return sum + diff;
                                                }
                                                return sum;
                                            }, 0);
                                            
                                            if (yearConsumption > 0) {
                                                // 解析日期计算天数比例
                                                const getDateFromTable = (tableName) => {
                                                    const yearStr = tableName.substring(5, 9);
                                                    const monthStr = tableName.substring(9, 11);
                                                    const dayStr = tableName.substring(11, 13);
                                                    return new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
                                                };
                                                
                                                const firstDate = getDateFromTable(firstTable);
                                                const lastDate = getDateFromTable(lastTable);
                                                const daysDiff = Math.round((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;
                                                
                                                // 理想的年长度
                                                const idealYearLength = year % 4 === 0 ? 366 : 365;
                                                
                                                // 不调整用电量，直接使用原始值
                                                let adjustedYearConsumption = yearConsumption;
                                                if (daysDiff < idealYearLength * 0.9) {
                                                    console.log(`年度计算区间 ${daysDiff} 天小于理想年长度 ${idealYearLength} 的90%，但按要求不进行调整`);
                                                }
                                                
                                                console.log(`方法3: ${year}年用电量计算结果(不调整): ${adjustedYearConsumption.toFixed(2)}`);
                                                yearlyConsumptionValue = adjustedYearConsumption;
                                                calculationMethod = '全年采样法';
                                                yearDataCalculated = true;
                                            } else {
                                                console.log(`方法3: 计算得到的用电量为零，可能存在数据问题`);
                                            }
                                        } else {
                                            console.log(`方法3: 首尾表没有匹配的点位数据`);
                                        }
                                    } else {
                                        console.log(`方法3: ${year}年没有足够的表进行计算`);
                                    }
                                } catch (error) {
                                    console.error(`方法3执行出错:`, error);
                                }
                            }
                            
                            // 将计算结果添加到结果数组
                            if (yearDataCalculated) {
                                console.log(`${year}年最终用电量(${calculationMethod}): ${yearlyConsumptionValue.toFixed(2)}`);
                                values.push(Number(yearlyConsumptionValue.toFixed(2)));
                            } else {
                                console.log(`${year}年所有方法均失败，无法计算用电量，设置为0`);
                                values.push(0);
                            }
                        } catch (error) {
                            console.log(`Error processing year ${year}:`, error);
                            values.push(0);
                        }
                    }

                    return formatResponse(dates, values);

                } finally {
                    if (mysqlConnection) {
                        await mysqlConnection.end();
                        console.log('MySQL connection closed');
                    }
                }
            }

            return result[timeType] || formatResponse([], []);
        } catch (error) {
            console.error('Error in getChartData:', error);
            throw error;
        }
    }
    async getRealData(building, timeType) {
        let mysqlConnection;
        try {
            // 从 PostgreSQL 获取订阅的数据列
            const subscribedItems = await prisma.energySavingSubscription.findMany({
                where: {
                    subscription: true,
                    deleted_at: null
                },
                select: {
                    name: true,
                    described: true
                }
            });

            // 根据 building 筛选数据
            const filteredItems = subscribedItems.filter(item => {
                const buildingKey = `${building}座`;
                return item.described.includes(buildingKey);
            });

            const subscribedNames = filteredItems.map(item => item.name);
            console.log('Filtered subscribed items:', filteredItems);
            console.log('Filtered names for MySQL query:', subscribedNames);

            if (subscribedNames.length === 0) {
                console.log(`No subscribed items found for building ${building}`);
                return { dates: [], values: [] };
            }

            // 连接 MySQL 并获取最新数据
            mysqlConnection = await mysql.createConnection(mysqlConfig);
            const tableName = 'minyc20241225';

            const placeholders = subscribedNames.map(() => '?').join(',');
            const query = `
                SELECT m1.* 
                FROM ${tableName} m1
                INNER JOIN (
                    SELECT name, MAX(hm) as max_hm
                    FROM ${tableName}
                    WHERE name IN (${placeholders})
                    GROUP BY name
                ) m2 
                ON m1.name = m2.name AND m1.hm = m2.max_hm
            `;

            const [rows] = await mysqlConnection.execute(query, subscribedNames);
            console.log('Retrieved latest data from MySQL:', rows);

            return { dates: [], values: [] }; // 临时返回空数据，等待您的进一步指引
        } catch (error) {
            console.error('Error in getChartData:', error);
            throw error;
        } finally {
            if (mysqlConnection) {
                await mysqlConnection.end();
            }
        }
    }
    async getUsageDistribution(building, timeType, date) {
        try {
            // 获取所有未删除的点位
            const subscribedItems = await prisma.energySavingSubscription.findMany({
                where: {
                    deleted_at: null
                },
                select: {
                    name: true,
                    described: true
                }
            });

            // 首先按建筑物和正向有功电能筛选
            const filteredItems = subscribedItems.filter(item => {
                const buildingKey = `${building}座`;
                if (building === 'C') {
                    return item.described.includes(buildingKey) &&
                        item.described.includes('正向有功') &&
                        item.described.includes('电能');
                }
                return item.described.includes(buildingKey) &&
                    item.described.includes('正向有功电能');
            });

            // 定义能源类型及其关键词
            const energyTypes = {
                '新能源': ['逆变器', '储能', '太阳能', '风机发电', '排潮'],
                '空调': ['空调', '热泵', '新风机'],
                '照明': ['照明'],
                '电梯': ['电梯'],
                '消防': ['消防'],
                '动力': ['电容柜', '配电', '变电站', '工艺'],
                '工作': ['大厅', '中心', '倒班楼', '路由器', '实验室', '监控站', '屏幕'],
                '生活': ['生活泵', '洗衣'],
                '其他': ['蒸汽']
            };

            // 按类型分组点位
            const groupedItems = {};
            for (const [type, keywords] of Object.entries(energyTypes)) {
                groupedItems[type] = filteredItems.filter(item =>
                    keywords.some(keyword => item.described.toLowerCase().includes(keyword.toLowerCase()))
                );
            }

            // 根据时间类型获取表名和查询范围
            let startTableName, endTableName;
            const today = new Date();

            if (timeType === 'day') {
                const selectedDate = new Date(date);
                const yesterdayDate = new Date(selectedDate);
                yesterdayDate.setDate(yesterdayDate.getDate() - 1);

                startTableName = `minyc${yesterdayDate.getFullYear()}${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}${String(yesterdayDate.getDate()).padStart(2, '0')}`;
                endTableName = `minyc${selectedDate.getFullYear()}${String(selectedDate.getMonth() + 1).padStart(2, '0')}${String(selectedDate.getDate()).padStart(2, '0')}`;
            } else {
                // 月数据处理
                const [year, month] = date.split('-');
                const currentYear = today.getFullYear();
                const currentMonth = today.getMonth() + 1;

                // 如果是当前月份
                if (parseInt(year) === currentYear && parseInt(month) === currentMonth) {
                    const startDate = new Date(year, parseInt(month) - 1, 1);
                    startTableName = `minyc${startDate.getFullYear()}${String(startDate.getMonth() + 1).padStart(2, '0')}${String(startDate.getDate()).padStart(2, '0')}`;
                    // 使用今天的日期作为结束日期
                    endTableName = `minyc${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
                } else {
                    // 历史月份
                    const startDate = new Date(year, parseInt(month) - 1, 1);
                    const endDate = new Date(year, parseInt(month), 0); // 获取月末日期

                    startTableName = `minyc${startDate.getFullYear()}${String(startDate.getMonth() + 1).padStart(2, '0')}${String(startDate.getDate()).padStart(2, '0')}`;
                    endTableName = `minyc${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, '0')}${String(endDate.getDate()).padStart(2, '0')}`;
                }
            }

            console.log('Using tables:', { startTableName, endTableName });

            const mysqlConnection = await mysql.createConnection(mysqlConfig);
            try {
                // 检查表是否存在
                const [startTableExists] = await mysqlConnection.execute(`SHOW TABLES LIKE '${startTableName}'`);
                const [endTableExists] = await mysqlConnection.execute(`SHOW TABLES LIKE '${endTableName}'`);

                if (startTableExists.length === 0 || endTableExists.length === 0) {
                    console.log(`Tables ${startTableName} or ${endTableName} don't exist`);
                    return {
                        error: '所选日期暂无数据',
                        data: []
                    };
                }

                const result = [];
                let totalConsumption = 0;

                for (const [type, items] of Object.entries(groupedItems)) {
                    const names = items.map(item => item.name);
                    if (names.length === 0) continue;

                    // 获取开始和结束时间的数据
                    const [startData] = await mysqlConnection.execute(
                        `SELECT name, MAX(data) as max_data FROM ${startTableName} WHERE name IN (${names.map(() => '?').join(',')}) GROUP BY name`,
                        names
                    );

                    const [endData] = await mysqlConnection.execute(
                        `SELECT name, MAX(data) as max_data FROM ${endTableName} WHERE name IN (${names.map(() => '?').join(',')}) GROUP BY name`,
                        names
                    );

                    // 计算消耗
                    const consumption = endData.reduce((sum, end) => {
                        const start = startData.find(s => s.name === end.name);
                        if (start) {
                            const diff = end.max_data - start.max_data;
                            return sum + (diff > 0 ? diff : 0);
                        }
                        return sum;
                    }, 0);

                    totalConsumption += consumption;
                    result.push({
                        name: type,
                        value: consumption
                    });
                }

                // 计算百分比
                const finalResult = result.map(item => ({
                    name: item.name,
                    value: totalConsumption ? Math.round((item.value / totalConsumption) * 100) : 0
                }));

                return finalResult;

            } finally {
                await mysqlConnection.end();
            }

        } catch (error) {
            console.error('Error in getUsageDistribution:', error);
            throw error;
        }
    }
}

module.exports = new EnergySavingService();
