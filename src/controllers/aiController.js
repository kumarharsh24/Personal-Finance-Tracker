const aiService = require('../services/aiService');

async function checkStatus(req, res) {
  res.json({ configured: aiService.isConfigured() });
}

async function analyze(req, res, next) {
  try {
    const result = await aiService.analyzeSpending(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getAdvice(req, res, next) {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }
    const result = await aiService.getFinancialAdvice(req.user.id, question);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function categorize(req, res, next) {
  try {
    const { descriptions } = req.body;
    if (!descriptions || !Array.isArray(descriptions)) {
      return res
        .status(400)
        .json({ error: 'descriptions array is required' });
    }
    const result = await aiService.autoCategorize(descriptions);
    res.json({ categories: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { checkStatus, analyze, getAdvice, categorize };
