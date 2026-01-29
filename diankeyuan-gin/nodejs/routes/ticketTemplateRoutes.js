const express = require('express');
const router = express.Router();
const ticketTemplateController = require('../controllers/ticketTemplateController');
const multer = require('multer');
const path = require('path');

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../assets/work'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'signature_' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
  },
  fileFilter: function (req, file, cb) {
    // 只允许图片
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('只允许上传图片文件!'), false);
    }
    cb(null, true);
  }
});

router.get('/template/list', ticketTemplateController.getThreeTicketTemplateList);
router.get('/template/users', ticketTemplateController.getUsersByAuthority);
router.post('/template/audit', ticketTemplateController.updateTicketStatus);
router.post('/template/extend', ticketTemplateController.handleExtension);
router.post('/template/change-responsible', ticketTemplateController.handleChangeResponsible);
router.post('/template/complete', ticketTemplateController.handleComplete);
router.post('/template/update-work-status', ticketTemplateController.updateWorkStatus); // 更新工作状态
router.post('/template/approve-change', ticketTemplateController.approveChange);
router.post('/template/complete-audit', ticketTemplateController.handleCompleteAudit);
router.post('/template/void', ticketTemplateController.handleVoid);
router.get('/template/list-all', ticketTemplateController.getAllTicketList);
router.post('/template/upload-signature', ticketTemplateController.uploadSignature);
router.get('/tucjet-templates', ticketTemplateController.getTucjetTemplateList);

// 添加新的文件上传路由
router.post('/template/upload-signature-file', 
  upload.single('signature'), 
  ticketTemplateController.uploadSignatureFile
);

module.exports = router; 