const router = require('express').Router();
const transactionController = require('../controllers/transactionController');
const receiptController = require('../controllers/receiptController');
const { ensureAuthenticated } = require('../middleware/auth');
const { validate, transactionSchema, transactionUpdateSchema } = require('../utils/validators');
const { receiptUpload } = require('../middleware/upload');

router.use(ensureAuthenticated);

router.get('/', transactionController.getAll);
router.get('/:id', transactionController.getOne);
router.post('/', validate(transactionSchema), transactionController.create);
router.put('/:id', validate(transactionUpdateSchema), transactionController.update);
router.delete('/:id', transactionController.remove);

// Receipt endpoints
router.post('/:id/receipt', receiptUpload.single('receipt'), receiptController.uploadReceipt);
router.get('/:id/receipt', receiptController.getReceipt);
router.delete('/:id/receipt', receiptController.deleteReceipt);

module.exports = router;
