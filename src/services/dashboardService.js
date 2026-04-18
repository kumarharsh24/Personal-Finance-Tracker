const db = require('../config/db');
const { getCurrentMonthRange, getPreviousMonthRange } = require('../utils/helpers');

async function getDashboardSummary(userId) {
  const currentMonth = getCurrentMonthRange();
  const previousMonth = getPreviousMonthRange();

  // Current month totals
  const [currentIncome] = await db('transactions')
    .where({ user_id: userId, type: 'income' })
    .whereBetween('date', [currentMonth.start, currentMonth.end])
    .sum('amount as total');

  const [currentExpenses] = await db('transactions')
    .where({ user_id: userId, type: 'expense' })
    .whereBetween('date', [currentMonth.start, currentMonth.end])
    .sum('amount as total');

  // Previous month totals for comparison
  const [prevIncome] = await db('transactions')
    .where({ user_id: userId, type: 'income' })
    .whereBetween('date', [previousMonth.start, previousMonth.end])
    .sum('amount as total');

  const [prevExpenses] = await db('transactions')
    .where({ user_id: userId, type: 'expense' })
    .whereBetween('date', [previousMonth.start, previousMonth.end])
    .sum('amount as total');

  // All-time totals
  const [totalIncome] = await db('transactions')
    .where({ user_id: userId, type: 'income' })
    .sum('amount as total');

  const [totalExpenses] = await db('transactions')
    .where({ user_id: userId, type: 'expense' })
    .sum('amount as total');

  const income = parseFloat(currentIncome.total) || 0;
  const expenses = parseFloat(currentExpenses.total) || 0;
  const prevIncomeVal = parseFloat(prevIncome.total) || 0;
  const prevExpensesVal = parseFloat(prevExpenses.total) || 0;

  return {
    currentMonth: {
      income,
      expenses,
      savings: income - expenses,
    },
    previousMonth: {
      income: prevIncomeVal,
      expenses: prevExpensesVal,
      savings: prevIncomeVal - prevExpensesVal,
    },
    allTime: {
      income: parseFloat(totalIncome.total) || 0,
      expenses: parseFloat(totalExpenses.total) || 0,
      savings:
        (parseFloat(totalIncome.total) || 0) -
        (parseFloat(totalExpenses.total) || 0),
    },
    incomeChange: prevIncomeVal > 0
      ? Math.round(((income - prevIncomeVal) / prevIncomeVal) * 100)
      : 0,
    expenseChange: prevExpensesVal > 0
      ? Math.round(((expenses - prevExpensesVal) / prevExpensesVal) * 100)
      : 0,
  };
}

async function getChartData(userId, months = 6) {
  const data = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    let year = now.getFullYear();
    let month = now.getMonth() + 1 - i;
    if (month <= 0) {
      month += 12;
      year--;
    }

    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const [income] = await db('transactions')
      .where({ user_id: userId, type: 'income' })
      .whereBetween('date', [start, end])
      .sum('amount as total');

    const [expense] = await db('transactions')
      .where({ user_id: userId, type: 'expense' })
      .whereBetween('date', [start, end])
      .sum('amount as total');

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    data.push({
      month: monthNames[month - 1],
      year,
      label: `${monthNames[month - 1]} ${year}`,
      income: parseFloat(income.total) || 0,
      expense: parseFloat(expense.total) || 0,
    });
  }

  return data;
}

async function getRecentTransactions(userId, limit = 10) {
  return db('transactions as t')
    .leftJoin('categories as c', 't.category_id', 'c.id')
    .where('t.user_id', userId)
    .select('t.*', 'c.name as category_name')
    .orderBy('t.date', 'desc')
    .orderBy('t.created_at', 'desc')
    .limit(limit);
}

async function getCategoryBreakdown(userId, type = 'expense', startDate, endDate) {
  const query = db('transactions as t')
    .leftJoin('categories as c', 't.category_id', 'c.id')
    .where({ 't.user_id': userId, 't.type': type })
    .groupBy('c.id', 'c.name')
    .select(
      'c.id as category_id',
      'c.name as category_name',
      db.raw('SUM(t.amount) as total'),
      db.raw('COUNT(t.id) as count')
    )
    .orderBy('total', 'desc');

  if (startDate) query.andWhere('t.date', '>=', startDate);
  if (endDate) query.andWhere('t.date', '<=', endDate);

  return query;
}

module.exports = {
  getDashboardSummary,
  getChartData,
  getRecentTransactions,
  getCategoryBreakdown,
};
