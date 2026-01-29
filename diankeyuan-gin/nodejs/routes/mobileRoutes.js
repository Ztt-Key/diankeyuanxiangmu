const express = require('express');
const router = express.Router();
const mobileController = require('../controllers/mobileController');

// 移动端登录路由
router.post('/login', mobileController.login);

// 添加工作票路由
router.post('/three-ticket', mobileController.createThreeTicket);

// 获取用户签名
router.get('/signature', mobileController.getSignature);

// 重置用户签名
router.post('/signature/reset', mobileController.resetSignature);

// 验证签名密码
router.post('/signature/verify', mobileController.verifySignature);

// 获取工作票详情
router.get('/detail/:ticketId', mobileController.getTicketDetail);

module.exports = router;
