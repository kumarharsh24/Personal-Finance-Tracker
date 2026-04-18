const router = require('express').Router();
const importController = require('../controllers/importController');
const { ensureAuthenticated } = require('../middleware/auth');
const { statementUpload } = require('../middleware/upload');

router.use(ensureAuthenticated);

router.post('/csv', statementUpload.single('statement'), importController.importCSV);
router.post('/pdf', statementUpload.single('statement'), importController.importPDF);

module.exports = router;
