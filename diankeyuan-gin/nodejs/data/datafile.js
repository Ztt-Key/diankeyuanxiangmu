const XLSX = require('xlsx');
const path = require('path');

// 读取 Excel 文件
const workbook = XLSX.readFile('./data.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// 将工作表转换为 JSON 数据
const data = XLSX.utils.sheet_to_json(worksheet);

// 过滤包含"有功电能"且不包含"反向"的行
const filteredData = data.filter(row => {
    return row['描述'] && 
           row['描述'].includes('有功电能') && 
           !row['描述'].includes('反向');
});

// 创建新的工作簿和工作表
const newWorkbook = XLSX.utils.book_new();
const newWorksheet = XLSX.utils.json_to_sheet(filteredData);

// 将工作表添加到工作簿
XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Filtered Data');

// 保存为新的 Excel 文件
XLSX.writeFile(newWorkbook, 'filtered_data.xlsx');

console.log('过滤完成，已生成新文件 filtered_data.xlsx');
