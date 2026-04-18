const router = require('express').Router();
const reportController = require('../controllers/reportController');
const { ensureAuthenticated } = require('../middleware/auth');

router.use(ensureAuthenticated);

router.get('/monthly', reportController.getMonthlyReport);
router.get('/category-breakdown', reportController.getCategoryBreakdown);
router.get('/trends', reportController.getTrends);
router.get('/export', reportController.exportCSV);

module.exports = router;
