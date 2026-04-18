const receiptService = require('../services/receiptService');
const path = require('path');
const fs = require('fs');

async function uploadReceipt(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const relativePath = path.relative(
      path.join(__dirname, '../../'),
      req.file.path
    );

    const transaction = await receiptService.attachReceipt(
      req.user.id,
      req.params.id,
      relativePath
    );
    res.json({ message: 'Receipt uploaded', transaction });
  } catch (err) {
    next(err);
  }
}

async function getReceipt(req, res, next) {
  try {
    const filePath = await receiptService.getReceiptPath(
      req.user.id,
      req.params.id
    );
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
}

async function deleteReceipt(req, res, next) {
  try {
    await receiptService.deleteReceipt(req.user.id, req.params.id);
    res.json({ message: 'Receipt deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadReceipt, getReceipt, deleteReceipt };
