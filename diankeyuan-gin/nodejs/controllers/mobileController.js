const mobileService = require('../services/mobileService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class MobileController {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.error('用户名和密码不能为空', 400);
      }

      const user = await mobileService.findUser(username);
      
      if (!user) {
        return res.error('用户不存在', 400);
      }

      if (user.enable !== 1n) {
        return res.error('用户已被禁用', 403);
      }

      // 验证密码
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.error('密码错误', 400);
      }

      // 生成 token - 将 BigInt 转换为 Number
      const token = jwt.sign(
        { 
          uuid: user.uuid,
          id: Number(user.id),  // 转换 BigInt 为 Number
          username: user.username 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // 返回用户信息 - 同样需要转换 BigInt
      res.success({
        token,
        user: {
          uuid: user.uuid,
          username: user.username,
          nickName: user.nick_name,
          headerImg: user.header_img,
          phone: user.phone,
          email: user.email,
          id: Number(user.id)  // 如果需要返回 id，也要转换
        }
      }, '登录成功');

    } catch (error) {
      console.error('登录错误:', error);
      res.error('登录失败', 500);
    }
  }

  async createThreeTicket(req, res) {
    try {
      const result = await mobileService.createThreeTicket(req.body);
      
      // 转换 BigInt 为字符串
      const sanitizedResult = JSON.parse(JSON.stringify(result, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      
      res.success(sanitizedResult, '创建成功');
    } catch (error) {
      console.error('创建工作票错误:', error);
      res.error('创建失败', 500);
    }
  }

  async getSignature(req, res) {
    try {
      const userId = req.query.userId || req.body.userId; // 从查询参数或请求体获取用户ID
      
      if (!userId) {
        return res.error('用户ID不能为空', 400);
      }

      const signature = await mobileService.getSignature(userId);
      
      if (!signature) {
        return res.success(null, '未找到签名信息');
      }

      // 转换 BigInt 为字符串
      const sanitizedSignature = JSON.parse(JSON.stringify(signature, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      
      res.success(sanitizedSignature, '获取成功');
    } catch (error) {
      console.error('获取签名错误:', error);
      res.error('获取签名失败', 500);
    }
  }

  async resetSignature(req, res) {
    try {
      const { userId, signature, password } = req.body;

      if (!userId) {
        return res.error('用户ID不能为空', 400);
      }

      if (!signature || !password) {
        return res.error('签名图片和密码不能为空', 400);
      }

      const result = await mobileService.resetSignature({
        userId,
        imgUrl: signature,  // 使用前端上传后返回的路径
        password,
        info: {}  // 默认为空对象
      });

      const sanitizedResult = JSON.parse(JSON.stringify(result, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      
      res.success(sanitizedResult, '重置签名成功');
    } catch (error) {
      console.error('重置签名错误:', error);
      res.error('重置签名失败', 500);
    }
  }

  async verifySignature(req, res) {
    try {
      const { userId, password } = req.body;

      if (!userId || !password) {
        return res.error('用户ID和密码不能为空', 400);
      }
      console.log('userId', userId);
      console.log('password', password);
      const signature = await mobileService.verifySignature(userId, password);
      
      if (!signature) {
        console.log('签名密码验证失败');
        return res.error('签名密码验证失败', 400);
      }

      // 转换 BigInt 为字符串
      const sanitizedSignature = JSON.parse(JSON.stringify(signature, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      console.log('sanitizedSignature', sanitizedSignature);
      res.success(sanitizedSignature, '验证成功');
    } catch (error) {
      console.error('验证签名错误:', error);
      res.error('验证签名失败', 500);
    }
  }

  async getTicketDetail(req, res) {
    try {
      const { ticketId } = req.params;

      if (!ticketId) {
        return res.error('工作票ID不能为空', 400);
      }

      const ticket = await mobileService.getTicketDetail(ticketId);
      
      if (!ticket) {
        return res.error('工作票不存在', 404);
      }

      // 转换 BigInt 为字符串
      const sanitizedTicket = JSON.parse(JSON.stringify(ticket, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      
      res.success(sanitizedTicket, '获取成功');
    } catch (error) {
      console.error('获取工作票详情错误:', error);
      res.error('获取工作票详情失败', 500);
    }
  }
}

module.exports = new MobileController();
