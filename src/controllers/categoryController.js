const categoryService = require('../services/categoryService');

async function getAll(req, res, next) {
  try {
    const type = req.query.type || null;
    const categories = await categoryService.getCategories(req.user.id, type);
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const category = await categoryService.getCategoryById(
      req.user.id,
      req.params.id
    );
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ category });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const category = await categoryService.createCategory(
      req.user.id,
      req.validatedBody
    );
    res.status(201).json({ message: 'Category created', category });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const category = await categoryService.updateCategory(
      req.user.id,
      req.params.id,
      req.validatedBody
    );
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category updated', category });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const deleted = await categoryService.deleteCategory(
      req.user.id,
      req.params.id
    );
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({
      message: 'Category deleted. Transactions in this category now have no category assigned.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getOne, create, update, remove };
