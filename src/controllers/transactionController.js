const transactionService = require('../services/transactionService');

async function getAll(req, res, next) {
  try {
    const filters = {
      type: req.query.type,
      category_id: req.query.category_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      currency: req.query.currency,
      search: req.query.search,
      limit: req.query.limit,
      offset: req.query.offset,
    };
    const transactions = await transactionService.getTransactions(
      req.user.id,
      filters
    );
    const count = await transactionService.getTransactionCount(
      req.user.id,
      filters
    );
    res.json({ transactions, total: count });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const transaction = await transactionService.getTransactionById(
      req.user.id,
      req.params.id
    );
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ transaction });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const transaction = await transactionService.createTransaction(
      req.user.id,
      req.validatedBody
    );
    res.status(201).json({ message: 'Transaction created', transaction });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const transaction = await transactionService.updateTransaction(
      req.user.id,
      req.params.id,
      req.validatedBody
    );
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction updated', transaction });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const deleted = await transactionService.deleteTransaction(
      req.user.id,
      req.params.id
    );
    if (!deleted) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getOne, create, update, remove };
