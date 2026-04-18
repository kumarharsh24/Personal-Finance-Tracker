const router = require('express').Router();
const budgetController = require('../controllers/budgetController');
const { ensureAuthenticated } = require('../middleware/auth');
const { validate, budgetSchema, budgetUpdateSchema } = require('../utils/validators');

router.use(ensureAuthenticated);

router.get('/', budgetController.getAll);
router.get('/:id', budgetController.getOne);
router.post('/', validate(budgetSchema), budgetController.create);
router.put('/:id', validate(budgetUpdateSchema), budgetController.update);
router.delete('/:id', budgetController.remove);

module.exports = router;
