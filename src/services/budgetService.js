const db = require('../config/db');
const { getCurrentMonthRange, getMonthRange } = require('../utils/helpers');

async function getBudgets(userId) {
  const budgets = await db('budgets as b')
    .join('categories as c', 'b.category_id', 'c.id')
    .where('b.user_id', userId)
    .select('b.*', 'c.name as category_name', 'c.type as category_type')
    .orderBy('c.name');

  // Calculate current spending for each budget
  const { start, end } = getCurrentMonthRange();
  const enriched = await Promise.all(
    budgets.map(async (budget) => {
      const range =
        budget.period === 'yearly'
          ? getMonthRange(new Date().getFullYear(), 1)
          : { start, end };

      if (budget.period === 'yearly') {
        range.end = `${new Date().getFullYear()}-12-31`;
      }

      const [{ total }] = await db('transactions')
        .where({
          user_id: userId,
          category_id: budget.category_id,
          type: 'expense',
        })
        .whereBetween('date', [range.start, range.end])
        .sum('amount as total');

      const spent = parseFloat(total) || 0;
      const remaining = parseFloat(budget.amount) - spent;
      const percentage = parseFloat(budget.amount) > 0
        ? Math.round((spent / parseFloat(budget.amount)) * 100)
        : 0;

      return {
        ...budget,
        spent,
        remaining,
        percentage,
        is_over: spent > parseFloat(budget.amount),
      };
    })
  );

  return enriched;
}

async function getBudgetById(userId, id) {
  return db('budgets as b')
    .join('categories as c', 'b.category_id', 'c.id')
    .where({ 'b.id': id, 'b.user_id': userId })
    .select('b.*', 'c.name as category_name')
    .first();
}

async function createBudget(userId, data) {
  const [budget] = await db('budgets')
    .insert({
      user_id: userId,
      category_id: data.category_id,
      amount: data.amount,
      currency: data.currency || 'USD',
      period: data.period || 'monthly',
    })
    .returning('*');
  return budget;
}

async function updateBudget(userId, id, data) {
  const updates = { ...data, updated_at: new Date() };
  const [budget] = await db('budgets')
    .where({ id, user_id: userId })
    .update(updates)
    .returning('*');
  return budget;
}

async function deleteBudget(userId, id) {
  const deleted = await db('budgets')
    .where({ id, user_id: userId })
    .del();
  return deleted > 0;
}

async function checkBudgetOverrun(userId, categoryId) {
  const budget = await db('budgets')
    .where({ user_id: userId, category_id: categoryId })
    .first();

  if (!budget) return null;

  const { start, end } = getCurrentMonthRange();
  const range =
    budget.period === 'yearly'
      ? { start: `${new Date().getFullYear()}-01-01`, end: `${new Date().getFullYear()}-12-31` }
      : { start, end };

  const [{ total }] = await db('transactions')
    .where({
      user_id: userId,
      category_id: categoryId,
      type: 'expense',
    })
    .whereBetween('date', [range.start, range.end])
    .sum('amount as total');

  const spent = parseFloat(total) || 0;
  const budgetAmount = parseFloat(budget.amount);

  if (spent > budgetAmount) {
    // Create notification
    const { createNotification } = require('./notificationService');
    const category = await db('categories').where({ id: categoryId }).first();
    const message = `Budget overrun! You've spent $${spent.toFixed(2)} out of your $${budgetAmount.toFixed(2)} budget for "${category ? category.name : 'Unknown'}" this ${budget.period === 'yearly' ? 'year' : 'month'}.`;

    await createNotification(userId, 'budget_overrun', message);
    return { isOver: true, spent, budget: budgetAmount, message };
  }

  return { isOver: false, spent, budget: budgetAmount };
}

module.exports = {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  checkBudgetOverrun,
};
