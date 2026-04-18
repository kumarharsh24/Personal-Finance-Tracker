const db = require('../config/db');
const { getMonthRange } = require('../utils/helpers');

async function getMonthlyReport(userId, year, month) {
  const { start, end } = getMonthRange(year, month);

  // Income by category
  const incomeByCategory = await db('transactions as t')
    .leftJoin('categories as c', 't.category_id', 'c.id')
    .where({ 't.user_id': userId, 't.type': 'income' })
    .whereBetween('t.date', [start, end])
    .groupBy('c.id', 'c.name')
    .select(
      'c.name as category',
      db.raw('SUM(t.amount) as total'),
      db.raw('COUNT(t.id) as count')
    )
    .orderBy('total', 'desc');

  // Expenses by category
  const expensesByCategory = await db('transactions as t')
    .leftJoin('categories as c', 't.category_id', 'c.id')
    .where({ 't.user_id': userId, 't.type': 'expense' })
    .whereBetween('t.date', [start, end])
    .groupBy('c.id', 'c.name')
    .select(
      'c.name as category',
      db.raw('SUM(t.amount) as total'),
      db.raw('COUNT(t.id) as count')
    )
    .orderBy('total', 'desc');

  const totalIncome = incomeByCategory.reduce(
    (sum, item) => sum + parseFloat(item.total),
    0
  );
  const totalExpenses = expensesByCategory.reduce(
    (sum, item) => sum + parseFloat(item.total),
    0
  );

  // Daily breakdown
  const dailyData = await db('transactions')
    .where({ user_id: userId })
    .whereBetween('date', [start, end])
    .groupBy('date', 'type')
    .select(
      'date',
      'type',
      db.raw('SUM(amount) as total')
    )
    .orderBy('date');

  return {
    period: { year, month, start, end },
    summary: {
      totalIncome,
      totalExpenses,
      netSavings: totalIncome - totalExpenses,
      savingsRate: totalIncome > 0
        ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)
        : 0,
    },
    incomeByCategory,
    expensesByCategory,
    dailyData,
  };
}

async function getCategoryBreakdownReport(userId, startDate, endDate) {
  const expenses = await db('transactions as t')
    .leftJoin('categories as c', 't.category_id', 'c.id')
    .where({ 't.user_id': userId, 't.type': 'expense' })
    .whereBetween('t.date', [startDate, endDate])
    .groupBy('c.id', 'c.name')
    .select(
      'c.name as category',
      db.raw('SUM(t.amount) as total'),
      db.raw('COUNT(t.id) as count'),
      db.raw('AVG(t.amount) as average'),
      db.raw('MAX(t.amount) as max_amount'),
      db.raw('MIN(t.amount) as min_amount')
    )
    .orderBy('total', 'desc');

  const totalExpenses = expenses.reduce(
    (sum, item) => sum + parseFloat(item.total),
    0
  );

  return expenses.map((item) => ({
    ...item,
    total: parseFloat(item.total),
    average: parseFloat(parseFloat(item.average).toFixed(2)),
    max_amount: parseFloat(item.max_amount),
    min_amount: parseFloat(item.min_amount),
    percentage: totalExpenses > 0
      ? parseFloat(((parseFloat(item.total) / totalExpenses) * 100).toFixed(1))
      : 0,
  }));
}

async function getTrendsReport(userId, months = 6) {
  const data = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    let year = now.getFullYear();
    let month = now.getMonth() + 1 - i;
    if (month <= 0) {
      month += 12;
      year--;
    }

    const { start, end } = getMonthRange(year, month);

    const [income] = await db('transactions')
      .where({ user_id: userId, type: 'income' })
      .whereBetween('date', [start, end])
      .sum('amount as total');

    const [expense] = await db('transactions')
      .where({ user_id: userId, type: 'expense' })
      .whereBetween('date', [start, end])
      .sum('amount as total');

    const incomeVal = parseFloat(income.total) || 0;
    const expenseVal = parseFloat(expense.total) || 0;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    data.push({
      month: monthNames[month - 1],
      year,
      income: incomeVal,
      expenses: expenseVal,
      savings: incomeVal - expenseVal,
    });
  }

  return data;
}

async function exportTransactionsCSV(userId, startDate, endDate) {
  const transactions = await db('transactions as t')
    .leftJoin('categories as c', 't.category_id', 'c.id')
    .where('t.user_id', userId)
    .whereBetween('t.date', [startDate, endDate])
    .select(
      't.date',
      't.type',
      'c.name as category',
      't.amount',
      't.currency',
      't.description'
    )
    .orderBy('t.date', 'desc');

  const header = 'Date,Type,Category,Amount,Currency,Description\n';
  const rows = transactions
    .map(
      (t) =>
        `${t.date},${t.type},"${t.category || 'Uncategorized'}",${t.amount},${t.currency},"${(t.description || '').replace(/"/g, '""')}"`
    )
    .join('\n');

  return header + rows;
}

module.exports = {
  getMonthlyReport,
  getCategoryBreakdownReport,
  getTrendsReport,
  exportTransactionsCSV,
};
