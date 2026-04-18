const importService = require('../services/importService');
const fs = require('fs');

async function importCSV(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const content = fs.readFileSync(req.file.path, 'utf-8');
    const result = await importService.importCSV(req.user.id, content);

    res.json({
      message: `Import complete: ${result.imported} imported, ${result.duplicates} duplicates skipped`,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

async function importPDF(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await importService.importPDF(req.user.id, req.file.path);

    res.json({
      message: `Import complete: ${result.imported} imported, ${result.duplicates} duplicates skipped`,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { importCSV, importPDF };
