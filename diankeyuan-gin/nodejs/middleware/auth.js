const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    // 从请求头获取 token
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.error('未提供认证令牌', 401);
    }

    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 将用户信息添加到请求对象中
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('认证错误:', error);
    res.error('认证失败', 401);
  }
};

module.exports = auth; 