const energySavingService = require('../services/energySavingService');

class EnergySavingController {

    async getChartData(req, res) {
        try {
            const { building, timeType } = req.query;
            console.log('Received request with:', { building, timeType });
            const data = await energySavingService.getChartData(building, timeType);
            res.json({ success: true, data });
        } catch (error) {
            console.error('Error in getChartData:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getUsageDistribution(req, res) {
        try {
            const { building, timeType, date } = req.query;
            console.log('Received usage distribution request:', { building, timeType, date });
            const result = await energySavingService.getUsageDistribution(building, timeType, date);
            
            if (result.error) {
                return res.json({ 
                    success: false, 
                    message: result.error,
                    data: [] 
                });
            }

            res.json({ success: true, data: result });
        } catch (error) {
            console.error('Error in getUsageDistribution:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new EnergySavingController();
