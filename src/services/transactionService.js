const db = require('../config/db');
const { checkBudgetOverrun } = require('./budgetService');

async function getTransactions(userId, filters = {}) {
  const query = db('transactions as t')
    .leftJoin('categories as c', 't.category_id', 'c.id')
    .where('t.user_id', userId)
    .select(
      't.*',
      'c.name as category_name'
    )
    .orderBy('t.date', 'desc')
    .orderBy('t.created_at', 'desc');

  if (filters.type) {
    query.andWhere('t.type', filters.type);
  }
  if (filters.category_id) {
    query.andWhere('t.category_id', filters.category_id);
  }
  if (filters.start_date) {
    query.andWhere('t.date', '>=', filters.start_date);
  }
  if (filters.end_date) {
    query.andWhere('t.date', '<=', filters.end_date);
  }
  if (filters.currency) {
    query.andWhere('t.currency', filters.currency);
  }
  if (filters.search) {
    query.andWhere('t.description', 'ilike', `%${filters.search}%`);
  }

  const limit = Math.min(parseInt(filters.limit) || 50, 200);
  const offset = parseInt(filters.offset) || 0;
  query.limit(limit).offset(offset);

  return query;
}

async function getTransactionById(userId, id) {
  return db('transactions as t')
    .leftJoin('categories as c', 't.category_id', 'c.id')
    .where({ 't.id': id, 't.user_id': userId })
    .select('t.*', 'c.name as category_name')
    .first();
}

async function createTransaction(userId, data) {
  const [transaction] = await db('transactions')
    .insert({
      user_id: userId,
      category_id: data.category_id || null,
      type: data.type,
      amount: data.amount,
      currency: data.currency || 'USD',
      description: data.description || '',
      date: data.date,
    })
    .returning('*');

  // Check budget overrun after creating an expense
  if (transaction.type === 'expense' && transaction.category_id) {
    await checkBudgetOverrun(userId, transaction.category_id);
  }

  return transaction;
}

async function updateTransaction(userId, id, data) {
  const updates = { ...data, updated_at: new Date() };
  const [transaction] = await db('transactions')
    .where({ id, user_id: userId })
    .update(updates)
    .returning('*');

  // Check budget overrun if category changed
  if (transaction && transaction.type === 'expense' && transaction.category_id) {
    await checkBudgetOverrun(userId, transaction.category_id);
  }

  return transaction;
}

async function deleteTransaction(userId, id) {
  const deleted = await db('transactions')
    .where({ id, user_id: userId })
    .del();
  return deleted > 0;
}

async function getTransactionCount(userId, filters = {}) {
  const query = db('transactions').where({ user_id: userId }).count('id as count');
  if (filters.type) query.andWhere({ type: filters.type });
  if (filters.start_date) query.andWhere('date', '>=', filters.start_date);
  if (filters.end_date) query.andWhere('date', '<=', filters.end_date);
  const [result] = await query;
  return parseInt(result.count);
}

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionCount,
};
