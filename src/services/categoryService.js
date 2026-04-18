const db = require('../config/db');

const DEFAULT_CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investments', 'Rental Income', 'Other Income'],
  expense: [
    'Food & Dining',
    'Transportation',
    'Housing',
    'Utilities',
    'Entertainment',
    'Healthcare',
    'Shopping',
    'Education',
    'Travel',
    'Insurance',
    'Savings',
    'Other Expenses',
  ],
};

async function seedDefaultCategories(userId) {
  const categories = [];
  for (const [type, names] of Object.entries(DEFAULT_CATEGORIES)) {
    for (const name of names) {
      categories.push({ user_id: userId, name, type });
    }
  }
  await db('categories').insert(categories).onConflict(['user_id', 'name', 'type']).ignore();
}

async function getCategories(userId, type = null) {
  const query = db('categories').where({ user_id: userId }).orderBy('name');
  if (type) {
    query.andWhere({ type });
  }
  return query;
}

async function getCategoryById(userId, id) {
  return db('categories').where({ id, user_id: userId }).first();
}

async function createCategory(userId, { name, type }) {
  const [category] = await db('categories')
    .insert({ user_id: userId, name, type })
    .returning('*');
  return category;
}

async function updateCategory(userId, id, { name, type }) {
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (type !== undefined) updates.type = type;

  const [category] = await db('categories')
    .where({ id, user_id: userId })
    .update(updates)
    .returning('*');
  return category;
}

async function deleteCategory(userId, id) {
  // ON DELETE SET NULL handles transactions gracefully
  const deleted = await db('categories')
    .where({ id, user_id: userId })
    .del();
  return deleted > 0;
}

module.exports = {
  seedDefaultCategories,
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  DEFAULT_CATEGORIES,
};
