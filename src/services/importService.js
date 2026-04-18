const db = require('../config/db');
const { parse } = require('csv-parse/sync');
const { generateImportHash } = require('../utils/helpers');

// Keyword-based auto-categorization
const CATEGORY_KEYWORDS = {
  'Food & Dining': ['restaurant', 'cafe', 'coffee', 'food', 'grocery', 'supermarket', 'pizza', 'burger', 'dining', 'eat', 'lunch', 'dinner', 'breakfast', 'uber eats', 'doordash', 'grubhub', 'zomato', 'swiggy'],
  'Transportation': ['uber', 'lyft', 'taxi', 'gas', 'fuel', 'petrol', 'parking', 'transit', 'metro', 'bus', 'train', 'flight', 'airline', 'toll'],
  'Housing': ['rent', 'mortgage', 'property', 'apartment', 'housing', 'lease'],
  'Utilities': ['electric', 'water', 'internet', 'phone', 'mobile', 'broadband', 'wifi', 'cable', 'utility', 'gas bill'],
  'Entertainment': ['netflix', 'spotify', 'movie', 'cinema', 'game', 'gaming', 'concert', 'theater', 'youtube', 'disney', 'hulu', 'amazon prime', 'subscription'],
  'Healthcare': ['doctor', 'hospital', 'pharmacy', 'medical', 'health', 'dental', 'clinic', 'medicine', 'drug'],
  'Shopping': ['amazon', 'walmart', 'target', 'shop', 'store', 'mall', 'clothing', 'electronics', 'flipkart', 'myntra'],
  'Education': ['tuition', 'school', 'college', 'university', 'course', 'book', 'education', 'udemy', 'coursera'],
  'Travel': ['hotel', 'airbnb', 'booking', 'travel', 'vacation', 'trip', 'resort'],
  'Insurance': ['insurance', 'premium', 'policy', 'coverage'],
};

function autoCategorizeTxn(description) {
  const lower = (description || '').toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return category;
      }
    }
  }
  return 'Other Expenses';
}

async function importCSV(userId, fileContent) {
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  const results = {
    total: records.length,
    imported: 0,
    duplicates: 0,
    errors: [],
  };

  // Get user categories
  const categories = await db('categories').where({ user_id: userId });
  const categoryMap = {};
  for (const cat of categories) {
    categoryMap[cat.name.toLowerCase()] = cat;
  }

  for (let i = 0; i < records.length; i++) {
    try {
      const record = records[i];

      // Try to find date, amount, description columns (flexible column names)
      const date = record.Date || record.date || record.DATE ||
        record['Transaction Date'] || record['trans_date'] || record['Posted Date'];
      const amountStr = record.Amount || record.amount || record.AMOUNT ||
        record['Transaction Amount'] || record['trans_amount'] || record.Debit || record.Credit;
      const description = record.Description || record.description || record.DESC ||
        record['Transaction Description'] || record.Narration || record.Memo || record.Details || '';

      if (!date || amountStr === undefined) {
        results.errors.push(`Row ${i + 1}: Missing date or amount`);
        continue;
      }

      const amount = parseFloat(String(amountStr).replace(/[,$]/g, ''));
      if (isNaN(amount)) {
        results.errors.push(`Row ${i + 1}: Invalid amount "${amountStr}"`);
        continue;
      }

      // Generate hash for duplicate detection
      const hash = generateImportHash(date, amount, description);

      // Check for duplicate
      const existing = await db('transactions')
        .where({ user_id: userId, import_hash: hash })
        .first();

      if (existing) {
        results.duplicates++;
        continue;
      }

      // Determine type and auto-categorize
      const type = amount >= 0 ? 'income' : 'expense';
      const categoryName = autoCategorizeTxn(description);
      const categoryKey = categoryName.toLowerCase();
      let categoryId = null;

      if (categoryMap[categoryKey]) {
        categoryId = categoryMap[categoryKey].id;
      } else {
        // Create the category if it doesn't exist
        const catType = type === 'income' ? 'income' : 'expense';
        try {
          const [newCat] = await db('categories')
            .insert({ user_id: userId, name: categoryName, type: catType })
            .returning('*');
          categoryMap[categoryKey] = newCat;
          categoryId = newCat.id;
        } catch (e) {
          // Might exist already (race condition), try to find it
          const found = await db('categories')
            .where({ user_id: userId, name: categoryName, type: catType })
            .first();
          if (found) {
            categoryMap[categoryKey] = found;
            categoryId = found.id;
          }
        }
      }

      // Parse date
      let parsedDate;
      try {
        parsedDate = new Date(date).toISOString().split('T')[0];
      } catch {
        results.errors.push(`Row ${i + 1}: Invalid date "${date}"`);
        continue;
      }

      await db('transactions').insert({
        user_id: userId,
        category_id: categoryId,
        type,
        amount: Math.abs(amount),
        currency: 'USD',
        description: description.substring(0, 500),
        date: parsedDate,
        is_imported: true,
        import_hash: hash,
      });

      results.imported++;
    } catch (err) {
      results.errors.push(`Row ${i + 1}: ${err.message}`);
    }
  }

  return results;
}

async function importPDF(userId, filePath) {
  try {
    const pdfParse = require('pdf-parse');
    const fs = require('fs');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    const text = data.text;

    // Try to extract transactions from PDF text
    // This is a best-effort parser for common bank statement formats
    const lines = text.split('\n').filter((l) => l.trim());
    const transactions = [];

    // Common pattern: DATE DESCRIPTION AMOUNT
    const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
    const amountRegex = /[\-]?\$?[\d,]+\.\d{2}/g;

    for (const line of lines) {
      const dateMatch = line.match(dateRegex);
      if (!dateMatch) continue;

      const amounts = line.match(amountRegex);
      if (!amounts || amounts.length === 0) continue;

      const date = dateMatch[1];
      const amount = amounts[amounts.length - 1]; // Usually the last number is the amount
      const description = line
        .replace(dateRegex, '')
        .replace(amountRegex, '')
        .trim()
        .substring(0, 500);

      if (description.length > 0) {
        transactions.push({ date, amount, description });
      }
    }

    // Convert to CSV-like format and use importCSV logic
    if (transactions.length === 0) {
      return {
        total: 0,
        imported: 0,
        duplicates: 0,
        errors: ['Could not parse any transactions from the PDF. Please try CSV format.'],
      };
    }

    const csvContent = 'Date,Amount,Description\n' +
      transactions.map((t) =>
        `${t.date},${t.amount},"${t.description.replace(/"/g, '""')}"`
      ).join('\n');

    return importCSV(userId, csvContent);
  } catch (err) {
    return {
      total: 0,
      imported: 0,
      duplicates: 0,
      errors: [`PDF parsing failed: ${err.message}`],
    };
  }
}

module.exports = {
  importCSV,
  importPDF,
  autoCategorizeTxn,
};
