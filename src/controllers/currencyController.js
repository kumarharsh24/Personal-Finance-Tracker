const currencyService = require('../services/currencyService');

async function getRates(req, res, next) {
  try {
    const base = req.query.base || 'USD';
    const rates = await currencyService.getRates(base);
    res.json({ base, rates });
  } catch (err) {
    next(err);
  }
}

async function convert(req, res, next) {
  try {
    const { from, to, amount } = req.query;
    if (!from || !to || !amount) {
      return res
        .status(400)
        .json({ error: 'from, to, and amount query params required' });
    }
    const result = await currencyService.convertAmount(
      parseFloat(amount),
      from.toUpperCase(),
      to.toUpperCase()
    );
    res.json({
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      amount: parseFloat(amount),
      converted: result,
    });
  } catch (err) {
    next(err);
  }
}

async function getSupportedCurrencies(req, res, next) {
  try {
    const currencies = await currencyService.getSupportedCurrencies();
    res.json({ currencies });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRates, convert, getSupportedCurrencies };
