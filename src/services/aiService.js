const db = require('../config/db');

/**
 * AI Service - OpenAI integration for financial analysis.
 * Requires OPENAI_API_KEY in .env
 */

function isConfigured() {
  const key = process.env.OPENAI_API_KEY;
  return key && key !== 'your-openai-api-key' && key.length > 10;
}

function getClient() {
  if (!isConfigured()) {
    const err = new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.');
    err.statusCode = 503;
    throw err;
  }
  const OpenAI = require('openai');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function analyzeSpending(userId) {
  const openai = getClient();

  // Get last 3 months of transactions
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const transactions = await db('transactions as t')
    .leftJoin('categories as c', 't.category_id', 'c.id')
    .where('t.user_id', userId)
    .andWhere('t.date', '>=', threeMonthsAgo.toISOString().split('T')[0])
    .select('t.type', 't.amount', 't.currency', 't.description', 't.date', 'c.name as category')
    .orderBy('t.date', 'desc');

  if (transactions.length === 0) {
    return { analysis: 'No transactions found in the last 3 months to analyze.' };
  }

  // Summarize data for the prompt
  const summary = {
    totalTransactions: transactions.length,
    totalIncome: transactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + parseFloat(t.amount), 0),
    totalExpenses: transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + parseFloat(t.amount), 0),
    byCategory: {},
  };

  for (const t of transactions) {
    const cat = t.category || 'Uncategorized';
    if (!summary.byCategory[cat]) {
      summary.byCategory[cat] = { income: 0, expense: 0, count: 0 };
    }
    summary.byCategory[cat][t.type] += parseFloat(t.amount);
    summary.byCategory[cat].count++;
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a personal finance advisor. Analyze the user\'s spending data and provide actionable insights. Be specific, concise, and helpful. Format your response with clear sections using markdown.',
      },
      {
        role: 'user',
        content: `Please analyze my financial data from the last 3 months:\n\n${JSON.stringify(summary, null, 2)}\n\nProvide:\n1. Key observations about my spending patterns\n2. Areas where I could save money\n3. Comparison of income vs expenses\n4. Specific actionable recommendations`,
      },
    ],
    max_tokens: 1000,
  });

  return {
    analysis: completion.choices[0].message.content,
    data: summary,
  };
}

async function getFinancialAdvice(userId, question) {
  const openai = getClient();

  // Get user's financial context
  const [income] = await db('transactions')
    .where({ user_id: userId, type: 'income' })
    .sum('amount as total');
  const [expenses] = await db('transactions')
    .where({ user_id: userId, type: 'expense' })
    .sum('amount as total');

  const context = `User's total income: $${parseFloat(income.total || 0).toFixed(2)}, total expenses: $${parseFloat(expenses.total || 0).toFixed(2)}, net savings: $${(parseFloat(income.total || 0) - parseFloat(expenses.total || 0)).toFixed(2)}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a personal finance advisor. The user is asking for financial advice. Here is their context: ${context}. Provide helpful, practical advice. Be concise and use markdown formatting.`,
      },
      {
        role: 'user',
        content: question,
      },
    ],
    max_tokens: 800,
  });

  return {
    answer: completion.choices[0].message.content,
  };
}

async function autoCategorize(descriptions) {
  const openai = getClient();

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a transaction categorizer. Given transaction descriptions, categorize each one. Return a JSON array where each element has "description" and "category" fields. Use these categories: Food & Dining, Transportation, Housing, Utilities, Entertainment, Healthcare, Shopping, Education, Travel, Insurance, Salary, Freelance, Investments, Rental Income, Savings, Other Income, Other Expenses.',
      },
      {
        role: 'user',
        content: `Categorize these transactions:\n${JSON.stringify(descriptions)}`,
      },
    ],
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  try {
    const result = JSON.parse(completion.choices[0].message.content);
    return result.categories || result;
  } catch {
    return descriptions.map((d) => ({ description: d, category: 'Other Expenses' }));
  }
}

module.exports = {
  isConfigured,
  analyzeSpending,
  getFinancialAdvice,
  autoCategorize,
};
