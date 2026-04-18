const budgetService = require('../services/budgetService');

async function getAll(req, res, next) {
  try {
    const budgets = await budgetService.getBudgets(req.user.id);
    res.json({ budgets });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const budget = await budgetService.getBudgetById(req.user.id, req.params.id);
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    res.json({ budget });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const budget = await budgetService.createBudget(
      req.user.id,
      req.validatedBody
    );
    res.status(201).json({ message: 'Budget created', budget });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const budget = await budgetService.updateBudget(
      req.user.id,
      req.params.id,
      req.validatedBody
    );
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    res.json({ message: 'Budget updated', budget });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const deleted = await budgetService.deleteBudget(req.user.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getOne, create, update, remove };
