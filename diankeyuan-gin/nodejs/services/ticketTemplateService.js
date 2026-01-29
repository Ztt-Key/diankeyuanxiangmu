const prisma = require('../lib/prisma');
const fs = require('fs').promises;
const path = require('path');

// 添加一个工具函数来处理 BigInt 序列化
const serializeBigInt = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigInt(item));
  }

  if (typeof obj === 'object') {
    const result = {};
    for (const key in obj) {
      result[key] = serializeBigInt(obj[key]);
    }
    return result;
  }

  return obj;
};

// 添加一个日期格式化函数
const formatDateTime = (date) => {
  if (!date) return null;
  try {
    // 如果是空对象，返回 null
    if (typeof date === 'object' && Object.keys(date).length === 0) {
      return null;
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch (e) {
    console.warn('日期格式化失败:', e);
    return null;
  }
};

// 添加一个工具函数来安全地转换 BigInt
const safeBigInt = (value) => {
  if (value === null || value === undefined) {
    return BigInt(0);
  }
  try {
    return BigInt(value);
  } catch (e) {
    console.warn('BigInt 转换失败:', e);
    return BigInt(0);
  }
};

// 修改查询结果的处理
const processQueryResult = (item) => {
  if (!item) {
    return {
      ID: '',
      applicantId: '',
      applicantName: '',
      templeId: '',
      CreatedAt: null,
      UpdatedAt: null,
      parsedLog: null,
      parsedValue: null
    };
  }

  // 先处理日期字段
  const created_at = item.created_at instanceof Date ? item.created_at : new Date(item.created_at);
  const updated_at = item.updated_at instanceof Date ? item.updated_at : new Date(item.updated_at);

  const serialized = serializeBigInt(item);

  // 处理 log 和 value 字段
  const parsedLog = (() => {
    try {
      if (!serialized.log) return null;
      // 如果已经是对象，直接返回
      if (typeof serialized.log === 'object') return serialized.log;
      // 否则尝试解析 JSON 字符串
      return JSON.parse(serialized.log);
    } catch (e) {
      console.warn('解析日志失败:', e);
      return null;
    }
  })();

  const parsedValue = (() => {
    try {
      if (!serialized.value) return null;
      // 如果已经是对象，直接返回
      if (typeof serialized.value === 'object') return serialized.value;
      // 否则尝试解析 JSON 字符串
      return JSON.parse(serialized.value);
    } catch (e) {
      console.warn('解析值失败:', e);
      return null;
    }
  })();

  return {
    ...serialized,
    ID: serialized.id,
    applicantId: serialized.applicant_id,
    applicantName: serialized.applicant_name,
    templeId: serialized.temple_id,
    CreatedAt: created_at.toISOString(),
    UpdatedAt: updated_at.toISOString(),
    parsedLog,
    parsedValue
  };
};

class TicketTemplateService {
  async getTemplateList(params) {
    try {
      console.log('params', params);
      
      // 如果是审核人查询
      if (params.currentUserId) {
        console.log('查询审核主管工单');
        
        // 构建基础查询
        let query = `
          SELECT 
            id,
            created_at,
            updated_at,
            deleted_at,
            value,
            log,
            temple_id,
            applicant_id,
            applicant_name
          FROM "three_ticket_examples"
          WHERE deleted_at IS NULL
        `;

        // 添加筛选条件
        const conditions = [];
        const queryParams = [];

        // 添加时间范围条件
        if (params.startCreatedAt) {
          conditions.push(`created_at >= $${queryParams.length + 1}`);
          queryParams.push(new Date(params.startCreatedAt));
        }
        if (params.endCreatedAt) {
          conditions.push(`created_at < $${queryParams.length + 1}`);
          queryParams.push(new Date(params.endCreatedAt));
        }

        // 添加其他筛选条件
        if (params.templeId) {
          conditions.push(`CAST(temple_id AS TEXT) = $${queryParams.length + 1}`);
          queryParams.push(params.templeId.toString());
        }

        if (params.applicantName) {
          conditions.push(`applicant_name ILIKE $${queryParams.length + 1}`);
          queryParams.push(`%${params.applicantName}%`);
        }

        // 添加条件到查询
        if (conditions.length > 0) {
          query += ` AND ${conditions.join(' AND ')}`;
        }

        // 添加排序
        query += ` ORDER BY created_at DESC, id DESC`;

        // 执行查询
        const rawQuery = await prisma.$queryRawUnsafe(query, ...queryParams);

        // 在 JavaScript 中处理数据筛选
        const filteredResults = rawQuery.filter(record => {
          try {
            // 处理申请人ID匹配
            if (record.applicant_id?.toString() === params.currentUserId.toString()) {
              return true;
            }

            // 解析 value
            const value = typeof record.value === 'string' ? JSON.parse(record.value) : record.value;
            
            // 检查 value 中的审核主管信息
            const supervisor = value?.templateData?.['审核主管'];
            if (supervisor) {
              try {
                const supervisorData = typeof supervisor === 'string' ? 
                  JSON.parse(supervisor) : supervisor;
                if (supervisorData.id?.toString() === params.currentUserId.toString()) {
                  return true;
                }
              } catch (e) {
                console.warn('解析审核主管数据失败:', e);
              }
            }

            return false;
          } catch (e) {
            console.warn('处理记录时出错:', e);
            return false;
          }
        });

        // 处理分页
        const startIndex = (params.page - 1) * params.pageSize;
        const endIndex = startIndex + params.pageSize;
        const paginatedResults = filteredResults.slice(startIndex, endIndex);

        // 处理查询结果
        const serializedList = paginatedResults.map(processQueryResult);

        return {
          list: serializedList,
          total: filteredResults.length,
          page: params.page,
          pageSize: params.pageSize
        };
      }

      // 构建查询条件
      let where = {
        deleted_at: null,
        ...(params.startCreatedAt && {
          created_at: {
            // 修改这里的时间查询条件
            [Op.and]: [
              { [Op.gte]: new Date(params.startCreatedAt) },
              { [Op.lte]: new Date(params.endCreatedAt) }
            ]
          }
        }),
        ...(params.templeId && {
          id: BigInt(params.templeId)
        }),
        ...(params.applicantName && {
          applicant_name: {
            contains: params.applicantName,
            mode: 'insensitive'
          }
        })
      }

      // 如果是查询自己的记录
      if (params.applicantId) {
        const rawQuery = await prisma.$queryRaw`
          SELECT 
            id,
            created_at,
            updated_at,
            deleted_at,
            value,
            log,
            temple_id,
            applicant_id,
            applicant_name
          FROM "three_ticket_examples"
          WHERE "deleted_at" IS NULL
          AND "applicant_id" = ${BigInt(params.applicantId)}
          ORDER BY created_at DESC, id DESC
          OFFSET ${(params.page - 1) * params.pageSize}
          LIMIT ${params.pageSize}
        `;

        const countResult = await prisma.$queryRaw`
          SELECT COUNT(*) as total FROM "three_ticket_examples"
          WHERE "deleted_at" IS NULL
          AND "applicant_id" = ${BigInt(params.applicantId)}
        `;

        // 处理查询结果
        const serializedList = (rawQuery || []).map(processQueryResult);

        return {
          list: serializedList,
          total: parseInt(countResult?.[0]?.total || '0'),
          page: params.page,
          pageSize: params.pageSize
        };
      } else {
        // 如果是审核人查询，先打印一下当前用户ID和查询条件
        console.log('当前用户ID:', params.currentUserId);

        // 添加一个调试查询
        const debugQuery = await prisma.$queryRaw`
          SELECT 
            id,
            value::jsonb->'templateData'->>'审核主管' as supervisor_info,
            log::jsonb->>'currentStepType' as step_type,
            applicant_id
          FROM "three_ticket_examples"
          WHERE deleted_at IS NULL
          AND log::jsonb->>'currentStepType' = 'audit'
        `;

        console.log('调试查询结果:', debugQuery);

        // 修改主查询
        const rawQuery = await prisma.$queryRaw`
          WITH parsed_log AS (
            SELECT 
              id,
              created_at,
              updated_at,
              deleted_at,
              value,
              log::jsonb as log_json,
              temple_id,
              applicant_id,
              applicant_name,
              value::jsonb->'templateData'->>'审核主管' as supervisor_info
            FROM "three_ticket_examples"
            WHERE deleted_at IS NULL
            ${params.startCreatedAt ? sql`AND created_at >= ${new Date(params.startCreatedAt)}::timestamp` : sql``}
            ${params.endCreatedAt ? sql`AND created_at <= ${new Date(params.endCreatedAt)}::timestamp` : sql``}
          )
          SELECT *
          FROM parsed_log
          WHERE 
            log_json->>'currentStepType' = 'audit'
            AND NOT EXISTS (
              SELECT 1 FROM jsonb_array_elements(log_json->'history') as h
              WHERE h->>'action' IN ('退回重填', '申请人撤回')
            )
            AND (
              applicant_id IS NULL 
              OR applicant_id != ${safeBigInt(params.currentUserId)}
            )
            AND supervisor_info::jsonb->>'id' = ${params.currentUserId?.toString() || '0'}
          ORDER BY created_at DESC, id DESC
          OFFSET ${(params.page - 1) * params.pageSize}
          LIMIT ${params.pageSize}
        `;

        // 打印查询结果
        console.log('主查询结果:', rawQuery);

        const countResult = await prisma.$queryRaw`
          WITH parsed_log AS (
            SELECT 
              id,
              created_at,
              log::jsonb as log_json,
              applicant_id,
              value::jsonb->'templateData'->>'审核主管' as supervisor_info
            FROM "three_ticket_examples"
            WHERE deleted_at IS NULL
            ${params.startCreatedAt ? sql`AND created_at >= ${new Date(params.startCreatedAt)}::timestamp` : sql``}
            ${params.endCreatedAt ? sql`AND created_at <= ${new Date(params.endCreatedAt)}::timestamp` : sql``}
          )
          SELECT COUNT(*) as total 
          FROM parsed_log
          WHERE 
            log_json->>'currentStepType' = 'audit'
            AND NOT EXISTS (
              SELECT 1 FROM jsonb_array_elements(log_json->'history') as h
              WHERE h->>'action' IN ('退回重填', '申请人撤回')
            )
            AND (
              applicant_id IS NULL 
              OR applicant_id != ${safeBigInt(params.currentUserId)}
            )
            AND supervisor_info::jsonb->>'id' = ${params.currentUserId?.toString() || '0'}
        `;

        // 处理查询结果
        const serializedList = rawQuery.map(processQueryResult);

        return {
          list: serializedList,
          total: parseInt(countResult[0].total),
          page: params.page,
          pageSize: params.pageSize
        };
      }

    } catch (error) {
      console.error('获取模板列表失败:', error);
      throw new Error('获取模板列表失败: ' + error.message);
    }
  }

  async getUsersByAuthorityId(authorityId) {
    try {
      // 使用原生SQL查询
      const users = await prisma.$queryRaw`
        SELECT DISTINCT 
          u.id,
          u.username,
          u.nick_name,
          u.phone,
          u.email,
          u.header_img,
          u.enable
        FROM sys_users u
        INNER JOIN sys_user_authority ua ON u.id = ua.sys_user_id
        WHERE ua.sys_authority_authority_id = ${BigInt(authorityId)}
        AND u.deleted_at IS NULL
      `;

      // 处理 BigInt 序列化
      const serializedUsers = users.map(user => ({
        ...user,
        id: user.id.toString(),
        enable: user.enable?.toString() || null
      }));

      return serializedUsers;
    } catch (error) {
      throw new Error('获取用户列表失败: ' + error.message);
    }
  }

  async updateTicketStatus(params) {
    try {


      const [ticket] = await prisma.$queryRaw`
        SELECT * FROM "three_ticket_examples"
        WHERE "id" = ${BigInt(params.ID)}
        LIMIT 1
      `;

      if (!ticket) {
        throw new Error('工单不存在');
      }

      // 解析当前日志和值
      let currentLog = {};
      let currentValue = {};
      
      try {
        currentLog = typeof ticket.log === 'string' ? JSON.parse(ticket.log) : ticket.log || {};
        currentValue = typeof ticket.value === 'string' ? JSON.parse(ticket.value) : ticket.value || {};
      } catch (e) {
        console.warn('解析数据失败，使用默认值:', e);
      }

      // 确保必要的字段存在
      currentLog.history = currentLog.history || [];
      currentLog.currentStepIndex = currentLog.currentStepIndex || 0;
      currentLog.currentStepType = currentLog.currentStepType || 'input';

      // 更新日志
      const updatedLog = {
        ...currentLog,
        currentStepIndex: params.approved ? 2 : 0,
        currentStepType: params.approved ? 'input' : 'reject',
        history: [
          ...currentLog.history,
          {
            timestamp: new Date().toISOString(),
            action: params.approved ? '审核通过' : '审核不通过',
            content: {
              '审核意见': params.auditContent?.comment || '',
              '审核结果': params.auditContent?.result || (params.approved ? '通过' : '不通过'),
              '签名': params.auditContent?.signature || null
            },
            userId: params.auditorId.toString(), // 转换为字符串
            userName: params.auditorName,
            flowState: {
              stepIndex: currentLog.currentStepIndex || 0,
              stepType: params.approved ? 'input' : 'reject',
              stepName: params.approved ? '工作执行' : '不通过',
              result: params.auditContent?.result || (params.approved ? '通过' : '不通过'),
              comment: params.comment || ''
            }
          }
        ]
      };

      // 将 BigInt 转换为字符串
      const processedLog = JSON.parse(JSON.stringify(updatedLog, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));

      const processedValue = JSON.parse(JSON.stringify(currentValue, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));

      const [updated] = await prisma.$queryRaw`
        UPDATE "three_ticket_examples"
        SET 
          "log" = ${JSON.stringify(processedLog)}::jsonb,
          "value" = ${JSON.stringify(processedValue)}::jsonb,
          "updated_at" = ${new Date()}
        WHERE "id" = ${BigInt(params.ID)}
        RETURNING *
      `;

      // 处理返回结果
      return processQueryResult(updated);
    } catch (error) {
      console.error('更新工单状态失败:', error);
      throw new Error('更新工单状态失败: ' + error.message);
    }
  }
  
  // 处理延期申请
async handleExtension(params) {
  try {
    const [ticket] = await prisma.$queryRaw`
      SELECT * FROM "three_ticket_examples"
      WHERE "id" = ${BigInt(params.ID)}
      LIMIT 1
    `;

    if (!ticket) {
      throw new Error('工单不存在');
    }

    let currentLog = {};
    let currentValue = {};

    try {
      currentLog = typeof ticket.log === 'string' ? JSON.parse(ticket.log) : ticket.log || {};
      currentValue = typeof ticket.value === 'string' ? JSON.parse(ticket.value) : ticket.value || {};
    } catch (e) {
      console.warn('解析数据失败，使用默认值:', e);
    }

    // 确保必要的对象结构存在
    currentValue.templateData = currentValue.templateData || {};
    
    // 更新延期信息
    if (params.content?.reason) {
      currentValue.templateData.延期原因 = params.content.reason;
    }
    if (params.content?.extendDate) {
      currentValue.templateData.延期日期 = params.content.extendDate;
    }

    // 更新工作日志 - 不再追加，而是直接替换
    if (params.content?.dailyLog) {
      currentValue.templateData.dailyLog = params.content.dailyLog.map(log => ({
        ...log,
        timestamp: new Date().toISOString()
      }));
    }

    const updatedLog = {
      ...currentLog,
      currentStepIndex: 2,
      currentStepType: 'input',
      history: [
        ...(currentLog.history || []),
        {
          timestamp: new Date().toISOString(),
          action: '延期申请',
          content: {
            reason: params.content?.reason,
            extendDate: params.content?.extendDate,
            dailyLog: params.content?.dailyLog || []
          },
          userId: params.userId,
          userName: params.userName,
          flowState: {
            stepIndex: 2,
            stepType: 'input',
            stepName: '工作执行',
            result: '已申请延期'
          }
        }
      ]
    };

    // 确保数据是有效的 JSON 字符串
    const logJson = JSON.stringify(updatedLog);
    const valueJson = JSON.stringify(currentValue);

    const [updated] = await prisma.$queryRaw`
      UPDATE "three_ticket_examples"
      SET 
        "log" = ${logJson}::jsonb,
        "value" = ${valueJson}::jsonb,
        "updated_at" = ${new Date()}
      WHERE "id" = ${BigInt(params.ID)}
      RETURNING *
    `;

    return processQueryResult(updated);
  } catch (error) {
    console.error('延期申请处理失败:', error);
    throw new Error('延期申请处理失败: ' + error.message);
  }
}

  // 处理变更负责人
  async handleChangeResponsible(params) {
    try {
      const [ticket] = await prisma.$queryRaw`
        SELECT * FROM "three_ticket_examples"
        WHERE "id" = ${BigInt(params.ID)}
        LIMIT 1
      `;

      if (!ticket) {
        throw new Error('工单不存在');
      }

      let currentLog = {};
      let currentValue = {};

      try {
        currentLog = typeof ticket.log === 'string' ? JSON.parse(ticket.log) : ticket.log || {};
        currentValue = typeof ticket.value === 'string' ? JSON.parse(ticket.value) : ticket.value || {};
      } catch (e) {
        console.warn('解析数据失败，使用默认值:', e);
      }

      // 确保必要的对象结构存在
      currentValue.templateData = currentValue.templateData || {};

      // 直接更新审核主管,不需要等待审核
      if (params.content?.newSupervisor) {
        currentValue.templateData.审核主管 = JSON.stringify(params.content.newSupervisor);
      }

      const updatedLog = {
        ...currentLog,
        currentStepIndex: 2, // 保持在工作执行阶段
        currentStepType: 'input',
        history: [
          ...(currentLog.history || []),
          {
            timestamp: new Date().toISOString(),
            action: '变更负责人',
            content: {
              '变更原因': params.content?.reason || '',
              '变更负责人': params.content?.newSupervisor || null,
              '签名': params.content?.signature || null
            },
            userId: params.userId,
            userName: params.userName,
            flowState: {
              stepIndex: 2,
              stepType: 'input',
              stepName: '工作执行',
              result: '已变更'
            }
          }
        ]
      };

      const [updated] = await prisma.$queryRaw`
        UPDATE "three_ticket_examples"
        SET 
          "log" = ${JSON.stringify(updatedLog)}::jsonb,
          "value" = ${JSON.stringify(currentValue)}::jsonb,
          "updated_at" = ${new Date()}
        WHERE "id" = ${BigInt(params.ID)}
        RETURNING *
      `;

      return processQueryResult(updated);
    } catch (error) {
      console.error('变更负责人处理失败:', error);
      throw new Error('处理变更负责人失败: ' + error.message);
    }
  }

  // 处理工作完成
  async handleComplete(params) {
    try {
      const [ticket] = await prisma.$queryRaw`
        SELECT * FROM "three_ticket_examples"
        WHERE "id" = ${BigInt(params.ID)}
        LIMIT 1
      `;

      if (!ticket) {
        throw new Error('工单不存在');
      }

      let currentLog = {};
      let currentValue = {};

      try {
        currentLog = typeof ticket.log === 'string' ? JSON.parse(ticket.log) : ticket.log || {};
        currentValue = typeof ticket.value === 'string' ? JSON.parse(ticket.value) : ticket.value || {};
      } catch (e) {
        console.warn('解析数据失败，使用默认值:', e);
      }

      // 更新状态为等待负责人审核
      const updatedLog = {
        ...currentLog,
        currentStepIndex: 6, // 终结审核状态
        currentStepType: 'complete_audit',
        history: [
          ...(currentLog.history || []),
          {
            timestamp: new Date().toISOString(),
            action: '提交终结审核',
            content: {},
            userId: params.userId,
            userName: params.userName,
            flowState: {
              stepIndex: 6,
              stepType: 'complete_audit',
              stepName: '终结审核',
              result: '待审核'
            }
          }
        ]
      };

      const [updated] = await prisma.$queryRaw`
        UPDATE "three_ticket_examples"
        SET 
          "log" = ${JSON.stringify(updatedLog)}::jsonb,
          "value" = ${JSON.stringify(currentValue)}::jsonb,
          "updated_at" = ${new Date()}
        WHERE "id" = ${BigInt(params.ID)}
        RETURNING *
      `;

      return processQueryResult(updated);
    } catch (error) {
      console.error('提交终结审核失败:', error);
      throw new Error('提交终结审核失败: ' + error.message);
    }
  }

  // 添加终结审核处理方法
  async handleCompleteAudit(params) {
    try {
   

      const [ticket] = await prisma.$queryRaw`
        SELECT * FROM "three_ticket_examples"
        WHERE "id" = ${BigInt(params.ID)}
        LIMIT 1
      `;

      if (!ticket) {
        throw new Error('工单不存在');
      }

      let currentLog = {};
      let currentValue = {};

      try {
        currentLog = typeof ticket.log === 'string' ? JSON.parse(ticket.log) : ticket.log || {};
        currentValue = typeof ticket.value === 'string' ? JSON.parse(ticket.value) : ticket.value || {};
      } catch (e) {
        console.warn('解析数据失败，使用默认值:', e);
      }

      const isApproved = params.content.result === '通过';

      // 更新状态
      const updatedLog = {
        ...currentLog,
        currentStepIndex: isApproved ? 5 : 2, // 通过则完成，否则返回工作执行
        currentStepType: isApproved ? 'success' : 'input',
        history: [
          ...(currentLog.history || []),
          {
            timestamp: new Date().toISOString(),
            action: `终结审核${isApproved ? '通过' : '拒绝'}`,
            content: params.content,
            userId: params.userId,
            userName: params.userName,
            flowState: {
              stepIndex: isApproved ? 5 : 2,
              stepType: isApproved ? 'success' : 'input',
              stepName: isApproved ? '已完成' : '工作执行',
              result: isApproved ? '通过' : '拒绝'
            }
          }
        ]
      };

      const [updated] = await prisma.$queryRaw`
        UPDATE "three_ticket_examples"
        SET 
          "log" = ${JSON.stringify(updatedLog)}::jsonb,
          "value" = ${JSON.stringify(currentValue)}::jsonb,
          "updated_at" = ${new Date()}
        WHERE "id" = ${BigInt(params.ID)}
        RETURNING *
      `;

      return processQueryResult(updated);
    } catch (error) {
      console.error('处理终结审核失败:', error);
      throw new Error('处理终结审核失败: ' + error.message);
    }
  }

  // 更新工作状态
  async updateWorkStatus(params) {
    try {
      const [ticket] = await prisma.$queryRaw`
        SELECT * FROM "three_ticket_examples"
        WHERE "id" = ${BigInt(params.ID)}
        LIMIT 1
      `;

      if (!ticket) {
        throw new Error('工单不存在');
      }

      const currentLog = JSON.parse(ticket.log || '{}');
      const currentValue = JSON.parse(ticket.value || '{}');

      // 更新工作日志
      if (params.dailyLog) {
        currentValue.templateData = {
          ...currentValue.templateData,
          dailyLog: params.dailyLog
        };
      }

      const updatedLog = {
        ...currentLog,
        history: [
          ...(currentLog.history || []),
          {
            timestamp: new Date().toISOString(),
            action: '更新工作状态',
            content: params.content,
            userId: params.userId,
            userName: params.userName,
            flowState: {
              stepIndex: currentLog.currentStepIndex,
              stepType: currentLog.currentStepType,
              stepName: '工作执行',
              result: '已更新'
            }
          }
        ]
      };

      const [updated] = await prisma.$queryRaw`
        UPDATE "three_ticket_examples"
        SET 
          "log" = ${JSON.stringify(updatedLog)}::jsonb,
          "value" = ${JSON.stringify(currentValue)}::jsonb,
          "updated_at" = ${new Date()}
        WHERE "id" = ${BigInt(params.ID)}
        RETURNING *
      `;

      return processQueryResult(updated);
    } catch (error) {
      throw new Error('更新工作状态失败: ' + error.message);
    }
  }

  // 处理变更负责人审核
  async approveChange(params) {
    try {
      const [ticket] = await prisma.$queryRaw`
        SELECT * FROM "three_ticket_examples"
        WHERE "id" = ${BigInt(params.ID)}
        LIMIT 1
      `;

      if (!ticket) {
        throw new Error('工单不存在');
      }

      let currentLog = {};
      let currentValue = {};

      try {
        currentLog = typeof ticket.log === 'string' ? JSON.parse(ticket.log) : ticket.log || {};
        currentValue = typeof ticket.value === 'string' ? JSON.parse(ticket.value) : ticket.value || {};
      } catch (e) {
        console.warn('解析数据失败，使用默认值:', e);
      }

      const isApproved = params.content.result === '通过';
      
      // 更新审核主管
      if (isApproved && params.content.newSupervisor) {
        currentValue.templateData = currentValue.templateData || {};
        currentValue.templateData.审核主管 = JSON.stringify(params.content.newSupervisor);
      }

      const updatedLog = {
        ...currentLog,
        currentStepIndex: 2, // 返回工作执行阶段
        currentStepType: 'input',
        history: [
          ...(currentLog.history || []),
          {
            timestamp: new Date().toISOString(),
            action: `变更负责人${isApproved ? '审核通过' : '审核拒绝'}`,
            content: params.content,
            userId: params.userId,
            userName: params.userName,
            flowState: {
              stepIndex: 2,
              stepType: 'input',
              stepName: '工作执行',
              result: isApproved ? '通过' : '拒绝'
            }
          }
        ]
      };

      const [updated] = await prisma.$queryRaw`
        UPDATE "three_ticket_examples"
        SET 
          "log" = ${JSON.stringify(updatedLog)}::jsonb,
          "value" = ${JSON.stringify(currentValue)}::jsonb,
          "updated_at" = ${new Date()}
        WHERE "id" = ${BigInt(params.ID)}
        RETURNING *
      `;

      return processQueryResult(updated);
    } catch (error) {
      throw new Error('处理变更负责人审核失败: ' + error.message);
    }
  }

  // 处理工作票作废
  async handleVoid(params) {
    try {
      const [ticket] = await prisma.$queryRaw`
        SELECT * FROM "three_ticket_examples"
        WHERE "id" = ${BigInt(params.ID)}
        LIMIT 1
      `;

      if (!ticket) {
        throw new Error('工单不存在');
      }

      let currentLog = {};
      let currentValue = {};

      try {
        currentLog = typeof ticket.log === 'string' ? JSON.parse(ticket.log) : ticket.log || {};
        currentValue = typeof ticket.value === 'string' ? JSON.parse(ticket.value) : ticket.value || {};
      } catch (e) {
        console.warn('解析数据失败，使用默认值:', e);
      }

      // 更新状态为作废
      const updatedLog = {
        ...currentLog,
        currentStepIndex: -1, // 使用-1表示作废状态
        currentStepType: 'void',
        history: [
          ...(currentLog.history || []),
          {
            timestamp: new Date().toISOString(),
            action: '作废工作票',
            content: {
              reason: params.content?.reason || '申请人主动作废'
            },
            userId: params.userId,
            userName: params.userName,
            flowState: {
              stepIndex: -1,
              stepType: 'void',
              stepName: '已作废',
              result: '已作废'
            }
          }
        ]
      };

      const [updated] = await prisma.$queryRaw`
        UPDATE "three_ticket_examples"
        SET 
          "log" = ${JSON.stringify(updatedLog)}::jsonb,
          "value" = ${JSON.stringify(currentValue)}::jsonb,
          "updated_at" = ${new Date()}
        WHERE "id" = ${BigInt(params.ID)}
        RETURNING *
      `;

      return processQueryResult(updated);
    } catch (error) {
      console.error('作废工作票失败:', error);
      throw new Error('作废工作票失败: ' + error.message);
    }
  }

  // 添加新的服务方法
  async getAllTemplateList(params) {
    try {
      // 构建基础查询
      let query = `
        SELECT 
          id,
          created_at,
          updated_at,
          deleted_at,
          value,
          log,
          temple_id,
          applicant_id,
          applicant_name
        FROM "three_ticket_examples"
        WHERE deleted_at IS NULL
      `;

      // 添加筛选条件
      const conditions = [];
      const queryParams = [];

      if (params.templeId) {
        conditions.push(`CAST(temple_id AS TEXT) = $${queryParams.length + 1}`);
        queryParams.push(params.templeId.toString());
      }

      if (params.applicantName) {
        conditions.push(`applicant_name ILIKE $${queryParams.length + 1}`);
        queryParams.push(`%${params.applicantName}%`);
      }

      if (params.startCreatedAt) {
        conditions.push(`created_at >= $${queryParams.length + 1}`);
        queryParams.push(new Date(params.startCreatedAt));
      }

      if (params.endCreatedAt) {
        conditions.push(`created_at <= $${queryParams.length + 1}`);
        queryParams.push(new Date(params.endCreatedAt));
      }

      // 添加条件到查询
      if (conditions.length > 0) {
        query += ` AND ${conditions.join(' AND ')}`;
      }

      // 添加排序和分页
      query += ` ORDER BY created_at DESC, id DESC
                 OFFSET $${queryParams.length + 1}
                 LIMIT $${queryParams.length + 2}`;

      queryParams.push((params.page - 1) * params.pageSize);
      queryParams.push(params.pageSize);

      // 执行查询
      const rawQuery = await prisma.$queryRawUnsafe(query, ...queryParams);

      // 获取总数
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM "three_ticket_examples"
        WHERE deleted_at IS NULL
        ${conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : ''}
      `;
      
      const countResult = await prisma.$queryRawUnsafe(countQuery, ...queryParams.slice(0, -2));

      // 处理查询结果
      const serializedList = rawQuery.map(processQueryResult);

      return {
        list: serializedList,
        total: parseInt(countResult[0].total),
        page: params.page,
        pageSize: params.pageSize
      };

    } catch (error) {
      console.error('获取所有模板列表失败:', error);
      throw new Error('获取所有模板列表失败: ' + error.message);
    }
  }

  // 添加处理签名图片的方法
  async handleSignatureImage(base64Image) {
    try {
      // 确保目录存在
      const uploadDir = path.join(__dirname, '../assets/work');
      await fs.mkdir(uploadDir, { recursive: true });

      // 生成唯一文件名
      const fileName = `signature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
      const filePath = path.join(uploadDir, fileName);

      // 从base64中提取图片数据
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // 保存文件
      await fs.writeFile(filePath, buffer);

      // 返回相对路径
      return `/work/${fileName}`;
    } catch (error) {
      console.error('保存签名图片失败:', error);
      throw new Error('保存签名图片失败');
    }
  }

  // 获取three_tucjet_template全部列表
  async getTucjetTemplateList() {
    try {
      const templates = await prisma.three_tucjet_template.findMany({
        where: {
          deleted_at: null
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      // 处理返回结果，确保value字段被正确解析
      const processedTemplates = templates.map(template => ({
        id: template.id.toString(),
        name: template.name || '',
        value: template.value ? JSON.parse(JSON.stringify(template.value)) : null,
        created_at: template.created_at ? template.created_at.toISOString() : null,
        updated_at: template.updated_at ? template.updated_at.toISOString() : null
      }));

      return processedTemplates;
    } catch (error) {
      console.error('获取模板列表失败:', error);
      throw new Error('获取模板列表失败: ' + error.message);
    }
  }
}

module.exports = new TicketTemplateService();