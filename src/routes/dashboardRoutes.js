const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');
const { ensureAuthenticated } = require('../middleware/auth');

router.use(ensureAuthenticated);

router.get('/summary', dashboardController.getSummary);
router.get('/chart-data', dashboardController.getChartData);
router.get('/recent', dashboardController.getRecent);
router.get('/category-breakdown', dashboardController.getCategoryBreakdown);
router.get('/anomalies', dashboardController.getAnomalies);

module.exports = router;
