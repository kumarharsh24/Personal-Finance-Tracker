const router = require('express').Router();
const categoryController = require('../controllers/categoryController');
const { ensureAuthenticated } = require('../middleware/auth');
const { validate, categorySchema } = require('../utils/validators');

router.use(ensureAuthenticated);

router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getOne);
router.post('/', validate(categorySchema), categoryController.create);
router.put('/:id', validate(categorySchema), categoryController.update);
router.delete('/:id', categoryController.remove);

module.exports = router;
