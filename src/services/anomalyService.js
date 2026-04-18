const db = require('../config/db');

/**
 * Anomaly detection using statistical analysis (Z-score method).
 * Flags transactions that are > 2 standard deviations from the mean.
 */

async function detectAnomalies(userId) {
  // Get all expense transactions grouped by category
  const transactions = await db('transactions as t')
    .leftJoin('categories as c', 't.category_id', 'c.id')
    .where({ 't.user_id': userId, 't.type': 'expense' })
    .select('t.*', 'c.name as category_name')
    .orderBy('t.date', 'desc');

  if (transactions.length < 5) {
    return {
      anomalies: [],
      message: 'Not enough transactions for anomaly detection (minimum 5 required).',
    };
  }

  // Calculate stats per category
  const categoryStats = {};
  for (const t of transactions) {
    const cat = t.category_name || 'Uncategorized';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { amounts: [], transactions: [] };
    }
    categoryStats[cat].amounts.push(parseFloat(t.amount));
    categoryStats[cat].transactions.push(t);
  }

  // Also calculate global stats
  const allAmounts = transactions.map((t) => parseFloat(t.amount));
  const globalMean = allAmounts.reduce((a, b) => a + b, 0) / allAmounts.length;
  const globalStdDev = Math.sqrt(
    allAmounts.reduce((sum, val) => sum + Math.pow(val - globalMean, 2), 0) /
      allAmounts.length
  );

  const anomalies = [];
  const THRESHOLD = 2; // Z-score threshold

  // Check per-category anomalies
  for (const [category, data] of Object.entries(categoryStats)) {
    if (data.amounts.length < 3) continue; // Need at least 3 transactions per category

    const mean = data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;
    const stdDev = Math.sqrt(
      data.amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        data.amounts.length
    );

    if (stdDev === 0) continue; // All same amounts, no anomalies

    for (const t of data.transactions) {
      const amount = parseFloat(t.amount);
      const zScore = (amount - mean) / stdDev;

      if (Math.abs(zScore) > THRESHOLD) {
        anomalies.push({
          transaction: {
            id: t.id,
            amount: t.amount,
            description: t.description,
            date: t.date,
            category: category,
          },
          zScore: parseFloat(zScore.toFixed(2)),
          categoryMean: parseFloat(mean.toFixed(2)),
          categoryStdDev: parseFloat(stdDev.toFixed(2)),
          reason:
            zScore > 0
              ? `This transaction ($${amount.toFixed(2)}) is ${zScore.toFixed(1)}x standard deviations above the average ($${mean.toFixed(2)}) for "${category}".`
              : `This transaction ($${amount.toFixed(2)}) is unusually low compared to the average ($${mean.toFixed(2)}) for "${category}".`,
          severity: Math.abs(zScore) > 3 ? 'high' : 'medium',
        });
      }
    }
  }

  // Also check global anomalies
  if (globalStdDev > 0) {
    for (const t of transactions) {
      const amount = parseFloat(t.amount);
      const zScore = (amount - globalMean) / globalStdDev;

      if (
        Math.abs(zScore) > THRESHOLD + 1 && // Use higher threshold for global
        !anomalies.find((a) => a.transaction.id === t.id)
      ) {
        anomalies.push({
          transaction: {
            id: t.id,
            amount: t.amount,
            description: t.description,
            date: t.date,
            category: t.category_name || 'Uncategorized',
          },
          zScore: parseFloat(zScore.toFixed(2)),
          categoryMean: parseFloat(globalMean.toFixed(2)),
          categoryStdDev: parseFloat(globalStdDev.toFixed(2)),
          reason: `This transaction ($${amount.toFixed(2)}) is ${zScore.toFixed(1)}x standard deviations above your overall average spending ($${globalMean.toFixed(2)}).`,
          severity: Math.abs(zScore) > 3 ? 'high' : 'medium',
        });
      }
    }
  }

  // Sort by severity and z-score
  anomalies.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'high' ? -1 : 1;
    return Math.abs(b.zScore) - Math.abs(a.zScore);
  });

  return {
    anomalies: anomalies.slice(0, 20), // Return top 20
    stats: {
      totalTransactions: transactions.length,
      globalMean: parseFloat(globalMean.toFixed(2)),
      globalStdDev: parseFloat(globalStdDev.toFixed(2)),
      categoriesAnalyzed: Object.keys(categoryStats).length,
    },
  };
}

module.exports = {
  detectAnomalies,
};
