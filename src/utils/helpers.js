const crypto = require('crypto');

/**
 * Generate a hash for duplicate import detection.
 */
function generateImportHash(date, amount, description) {
  const str = `${date}|${amount}|${description}`.toLowerCase().trim();
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Get the start and end of a month.
 */
function getMonthRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // last day of month
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

/**
 * Get the start and end of the current month.
 */
function getCurrentMonthRange() {
  const now = new Date();
  return getMonthRange(now.getFullYear(), now.getMonth() + 1);
}

/**
 * Get the start and end of the previous month.
 */
function getPreviousMonthRange() {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed, so this is already "previous" month
  if (month === 0) {
    month = 12;
    year--;
  }
  return getMonthRange(year, month);
}

/**
 * Format currency amount.
 */
function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

module.exports = {
  generateImportHash,
  getMonthRange,
  getCurrentMonthRange,
  getPreviousMonthRange,
  formatCurrency,
};
