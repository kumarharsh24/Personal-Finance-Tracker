const dashboardService = require('../services/dashboardService');
const anomalyService = require('../services/anomalyService');

async function getSummary(req, res, next) {
  try {
    const summary = await dashboardService.getDashboardSummary(req.user.id);
    res.json(summary);
  } catch (err) {
    next(err);
  }
}

async function getChartData(req, res, next) {
  try {
    const months = parseInt(req.query.months) || 6;
    const data = await dashboardService.getChartData(req.user.id, months);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

async function getRecent(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const transactions = await dashboardService.getRecentTransactions(
      req.user.id,
      limit
    );
    res.json({ transactions });
  } catch (err) {
    next(err);
  }
}

async function getCategoryBreakdown(req, res, next) {
  try {
    const { type, start_date, end_date } = req.query;
    const data = await dashboardService.getCategoryBreakdown(
      req.user.id,
      type || 'expense',
      start_date,
      end_date
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

async function getAnomalies(req, res, next) {
  try {
    const result = await anomalyService.detectAnomalies(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary, getChartData, getRecent, getCategoryBreakdown, getAnomalies };
