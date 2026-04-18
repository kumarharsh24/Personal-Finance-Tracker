const db = require('../config/db');
const path = require('path');
const fs = require('fs');

async function attachReceipt(userId, transactionId, filePath) {
  const transaction = await db('transactions')
    .where({ id: transactionId, user_id: userId })
    .first();

  if (!transaction) {
    const err = new Error('Transaction not found');
    err.statusCode = 404;
    throw err;
  }

  // Delete old receipt if exists
  if (transaction.receipt_path) {
    const oldPath = path.join(__dirname, '../../', transaction.receipt_path);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  const [updated] = await db('transactions')
    .where({ id: transactionId, user_id: userId })
    .update({ receipt_path: filePath, updated_at: new Date() })
    .returning('*');

  return updated;
}

async function getReceiptPath(userId, transactionId) {
  const transaction = await db('transactions')
    .where({ id: transactionId, user_id: userId })
    .first();

  if (!transaction || !transaction.receipt_path) {
    return null;
  }

  return path.join(__dirname, '../../', transaction.receipt_path);
}

async function deleteReceipt(userId, transactionId) {
  const transaction = await db('transactions')
    .where({ id: transactionId, user_id: userId })
    .first();

  if (!transaction) {
    const err = new Error('Transaction not found');
    err.statusCode = 404;
    throw err;
  }

  if (transaction.receipt_path) {
    const filePath = path.join(__dirname, '../../', transaction.receipt_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  await db('transactions')
    .where({ id: transactionId, user_id: userId })
    .update({ receipt_path: null, updated_at: new Date() });

  return true;
}

module.exports = {
  attachReceipt,
  getReceiptPath,
  deleteReceipt,
};
