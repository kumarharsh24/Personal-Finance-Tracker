const router = require('express').Router();
const currencyController = require('../controllers/currencyController');
const { ensureAuthenticated } = require('../middleware/auth');

router.use(ensureAuthenticated);

router.get('/rates', currencyController.getRates);
router.get('/convert', currencyController.convert);
router.get('/supported', currencyController.getSupportedCurrencies);

module.exports = router;
