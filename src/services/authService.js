const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { seedDefaultCategories } = require('./categoryService');

const SALT_ROUNDS = 12;

async function registerUser({ email, password, name }) {
  // Check if email already exists
  const existing = await db('users').where({ email }).first();
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const [user] = await db('users')
    .insert({
      email,
      password_hash,
      name: name || '',
      preferred_currency: 'USD',
    })
    .returning('*');

  // Seed default categories
  await seedDefaultCategories(user.id);

  delete user.password_hash;
  return user;
}

async function getUserById(id) {
  const user = await db('users').where({ id }).first();
  if (user) {
    delete user.password_hash;
  }
  return user;
}

async function updateUserProfile(id, updates) {
  updates.updated_at = new Date();
  const [user] = await db('users').where({ id }).update(updates).returning('*');
  if (user) {
    delete user.password_hash;
  }
  return user;
}

module.exports = {
  registerUser,
  getUserById,
  updateUserProfile,
};
