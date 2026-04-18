const router = require('express').Router();
const aiController = require('../controllers/aiController');
const { ensureAuthenticated } = require('../middleware/auth');

router.use(ensureAuthenticated);

router.get('/status', aiController.checkStatus);
router.post('/analyze', aiController.analyze);
router.post('/advice', aiController.getAdvice);
router.post('/categorize', aiController.categorize);

module.exports = router;
