const reportService = require('../services/reportService');

async function getMonthlyReport(req, res, next) {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const report = await reportService.getMonthlyReport(req.user.id, year, month);
    res.json(report);
  } catch (err) {
    next(err);
  }
}

async function getCategoryBreakdown(req, res, next) {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'start and end query params required' });
    }
    const report = await reportService.getCategoryBreakdownReport(
      req.user.id,
      start,
      end
    );
    res.json({ breakdown: report });
  } catch (err) {
    next(err);
  }
}

async function getTrends(req, res, next) {
  try {
    const months = parseInt(req.query.months) || 6;
    const trends = await reportService.getTrendsReport(req.user.id, months);
    res.json({ trends });
  } catch (err) {
    next(err);
  }
}

async function exportCSV(req, res, next) {
  try {
    const now = new Date();
    const start = req.query.start || `${now.getFullYear()}-01-01`;
    const end = req.query.end || now.toISOString().split('T')[0];
    const csv = await reportService.exportTransactionsCSV(req.user.id, start, end);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=transactions_${start}_${end}.csv`
    );
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMonthlyReport, getCategoryBreakdown, getTrends, exportCSV };
