const { PrismaClient } = require('@prisma/client');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Shanghai'); // 设置默认时区为中国时区

const prisma = new PrismaClient();

class MobileService {
  async findUser(username) {
    return await prisma.sys_users.findFirst({
      where: {
        username: username,
        deleted_at: null
      }
    });
  }

  async createThreeTicket(data) {
    // 将字符串解析为 JSON 对象
    const valueJson = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    const logJson = typeof data.log === 'string' ? JSON.parse(data.log) : data.log;
    
    // 使用 dayjs 生成当前时间
    const now = dayjs().tz('Asia/Shanghai').toDate();
    console.log('now', now);
    // 显式设置 CreatedAt
    const result = await prisma.threeTicketExample.create({
      data: {
        value: valueJson,
        log: logJson,
        templeId: data.templeId,
        applicantId: data.applicantId ? BigInt(data.applicantId) : null,
        applicantName: data.applicantName,
        CreatedAt: now,  // 显式设置 CreatedAt
        // UpdatedAt 由 @updatedAt 自动处理，不需要手动设置
      }
    });
    console.log('result', result);
    return result;
  }

  async getSignature(userId) {
    return await prisma.three_ticket_signature.findFirst({
      where: {
        user_id: userId.toString(),
        deleted_at: null
      }
    });
  }

  async resetSignature(data) {
    // 先删除旧的签名
    await prisma.three_ticket_signature.updateMany({
      where: {
        user_id: data.userId.toString(),
        deleted_at: null
      },
      data: {
        deleted_at: new Date()
      }
    });

    // 创建新的签名
    return await prisma.three_ticket_signature.create({
      data: {
        user_id: data.userId.toString(),
        img_url: data.imgUrl,
        pass_word: data.password,
        info: data.info || {}
      }
    });
  }

  async verifySignature(userId, password) {
    const signature = await prisma.three_ticket_signature.findFirst({
      where: {
        user_id: userId.toString(),
        pass_word: password,
        deleted_at: null
      }
    });

    return signature;
  }

  async getTicketDetail(ticketId) {
    try {
      // 移除非数字字符，确保是有效的数字字符串
      const cleanId = ticketId.toString().replace(/[^0-9]/g, '');
      console.log('cleanId', cleanId);
      return await prisma.threeTicketExample.findFirst({
        where: {
          ID: BigInt(cleanId),
          DeletedAt: null
        }
      });
    } catch (error) {
      console.error('解析工作票ID错误:', error);
      return null;
    }
  }
}

module.exports = new MobileService();
