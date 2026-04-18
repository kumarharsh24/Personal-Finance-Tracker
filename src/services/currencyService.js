/**
 * Currency conversion service using ExchangeRate API.
 * Uses the free tier (no key required) at https://api.exchangerate-api.com/v4/latest/
 */

// In-memory cache for exchange rates (refreshes every hour)
let ratesCache = {};
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function fetchRates(baseCurrency = 'USD') {
  const now = Date.now();
  const cacheKey = baseCurrency.toUpperCase();

  if (
    ratesCache[cacheKey] &&
    now - cacheTimestamp < CACHE_DURATION
  ) {
    return ratesCache[cacheKey];
  }

  try {
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${cacheKey}`
    );

    if (!response.ok) {
      throw new Error(`Exchange rate API returned ${response.status}`);
    }

    const data = await response.json();
    ratesCache[cacheKey] = data.rates;
    cacheTimestamp = now;
    return data.rates;
  } catch (err) {
    console.error('Failed to fetch exchange rates:', err.message);
    // Return cached data if available, even if stale
    if (ratesCache[cacheKey]) {
      return ratesCache[cacheKey];
    }
    throw err;
  }
}

async function convertAmount(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount;

  const rates = await fetchRates(fromCurrency);
  const rate = rates[toCurrency.toUpperCase()];

  if (!rate) {
    throw new Error(`Unsupported currency: ${toCurrency}`);
  }

  return parseFloat((amount * rate).toFixed(2));
}

async function getSupportedCurrencies() {
  const rates = await fetchRates('USD');
  return Object.keys(rates).sort();
}

async function getRates(baseCurrency = 'USD') {
  return fetchRates(baseCurrency);
}

module.exports = {
  convertAmount,
  getSupportedCurrencies,
  getRates,
};
