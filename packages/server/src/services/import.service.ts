import crypto from 'crypto';
import { pool } from '../config/database.js';
import { detectBankFormat, getParser, ParsedRow } from '../parsers/index.js';
import { rulesEngine } from '../engine/rules-engine.js';
import { AppError } from '../middleware/error-handler.js';
import { extractTransactionsFromPdf } from './pdf-import.service.js';

// In-memory cache for pending imports (file_hash -> parsed data)
const importCache = new Map<string, { rows: ParsedRow[]; parserKey: string; bankName: string; filename: string; userId: string; expiresAt: number }>();

// Credit-card-side payment entries (e.g. "PAYMENT - THANK YOU", "AUTOPAY PAYMENT")
// are transfers from a debit account, not real income. Mark them as transfers so
// they remain visible without inflating income or expense totals.
const CREDIT_CARD_PARSERS = new Set(['tangerine_csv', 'amex_csv', 'amex_xls', 'td_pdf_credit']);
const PAYMENT_DESCRIPTION = /payment|thank\s*you|autopay/i;
function isCreditCardPaymentTransfer(parserKey: string, row: ParsedRow): boolean {
  return (
    CREDIT_CARD_PARSERS.has(parserKey) &&
    row.is_credit &&
    PAYMENT_DESCRIPTION.test(row.description)
  );
}

// Clean expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of importCache.entries()) {
    if (val.expiresAt < now) importCache.delete(key);
  }
}, 60_000);

export async function uploadAndPreview(buffer: Buffer, filename: string, userId: string) {
  const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

  // Check for duplicate import
  const { rows: existing } = await pool.query(
    'SELECT id FROM imports WHERE file_hash = $1',
    [fileHash]
  );
  if (existing.length > 0) {
    throw new AppError(409, 'This file has already been imported.');
  }

  // Detect and parse
  let parserKey: string;
  let bankName: string;
  let rows: ParsedRow[];

  if (filename.toLowerCase().endsWith('.pdf')) {
    const extracted = await extractTransactionsFromPdf(buffer, filename);
    parserKey = extracted.parserKey;
    bankName = extracted.bankName;
    rows = extracted.rows;
  } else {
    const detected = detectBankFormat(buffer, filename);
    parserKey = detected.parserKey;
    bankName = detected.bankName;
    const parser = getParser(detected.parserKey);
    rows = parser.parse(buffer);
  }

  if (rows.length === 0) {
    throw new AppError(400, 'No transactions found in file.');
  }

  // Sort by date
  rows.sort((a, b) => a.transaction_date.getTime() - b.transaction_date.getTime());

  // Cache for 10 minutes
  importCache.set(fileHash, {
    rows,
    parserKey,
    bankName,
    filename,
    userId,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  const sampleRows = rows.slice(0, 10).map((r) => ({
    transaction_date: r.transaction_date.toISOString().split('T')[0],
    description: r.description,
    raw_description: r.raw_description,
    amount: r.amount,
    is_credit: r.is_credit,
    memo: r.memo,
    merchant_address: r.merchant_address,
  }));

  return {
    bank_source: bankName,
    parser_key: parserKey,
    file_hash: fileHash,
    transaction_count: rows.length,
    date_range_start: rows[0].transaction_date.toISOString().split('T')[0],
    date_range_end: rows[rows.length - 1].transaction_date.toISOString().split('T')[0],
    sample_rows: sampleRows,
  };
}

export async function confirmImport(fileHash: string) {
  const cached = importCache.get(fileHash);
  if (!cached) {
    throw new AppError(400, 'Import preview expired or not found. Please re-upload the file.');
  }

  const { rows, parserKey, bankName, filename, userId } = cached;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get bank source id
    const { rows: bankSources } = await client.query(
      'SELECT id FROM bank_sources WHERE parser_key = $1',
      [parserKey]
    );
    if (bankSources.length === 0) {
      throw new AppError(500, `Bank source not found for parser: ${parserKey}`);
    }
    const bankSourceId = bankSources[0].id;

    const dateStart = rows[0].transaction_date.toISOString().split('T')[0];
    const dateEnd = rows[rows.length - 1].transaction_date.toISOString().split('T')[0];

    // Insert import record
    const { rows: importRows } = await client.query(
      `INSERT INTO imports (user_id, bank_source_id, original_filename, file_hash, transaction_count, date_range_start, date_range_end, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed')
       RETURNING id`,
      [userId, bankSourceId, filename, fileHash, rows.length, dateStart, dateEnd]
    );
    const importId = importRows[0].id;

    // Batch insert transactions
    const transactionIds: string[] = [];
    for (const row of rows) {
      const { rows: txRows } = await client.query(
        `INSERT INTO transactions (user_id, import_id, bank_source_id, transaction_date, description, raw_description, amount, is_credit, is_transfer, memo, merchant_address, raw_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        [
          userId,
          importId,
          bankSourceId,
          row.transaction_date.toISOString().split('T')[0],
          row.description,
          row.raw_description,
          row.amount,
          row.is_credit,
          isCreditCardPaymentTransfer(parserKey, row),
          row.memo,
          row.merchant_address,
          JSON.stringify(row.raw_data),
        ]
      );
      transactionIds.push(txRows[0].id);
    }

    await client.query('COMMIT');

    // Apply rules to newly imported transactions (outside the transaction for safety)
    const ruleResult = await rulesEngine.applyRules(transactionIds, userId);

    importCache.delete(fileHash);

    return {
      import_id: importId,
      transactions_imported: rows.length,
      rules_applied_count: ruleResult.applied,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function listImports(userId?: string) {
  let query = `SELECT i.*, bs.name as bank_source_name
     FROM imports i
     JOIN bank_sources bs ON i.bank_source_id = bs.id`;
  const params: unknown[] = [];
  if (userId) {
    query += ' WHERE i.user_id = $1';
    params.push(userId);
  }
  query += ' ORDER BY i.created_at DESC';
  const { rows } = await pool.query(query, params);
  return rows;
}

export async function deleteImport(importId: string) {
  const result = await pool.query('DELETE FROM imports WHERE id = $1', [importId]);
  if (result.rowCount === 0) {
    throw new AppError(404, 'Import not found');
  }
}
