const express = require('express');
const router = express.Router();
const energySavingController = require('../controllers/energySavingController');

// 获取图表数据
router.get('/chart', energySavingController.getChartData);

// 获取用电分布数据
router.get('/usage-distribution', energySavingController.getUsageDistribution);

module.exports = router;
