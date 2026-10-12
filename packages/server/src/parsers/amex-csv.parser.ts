import Papa from 'papaparse';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { BaseParser, ParsedRow } from './base-parser.js';

dayjs.extend(customParseFormat);

type AmexCsvRow = Record<string, string>;

export class AmexCsvParser extends BaseParser {
  parse(buffer: Buffer): ParsedRow[] {
    const csv = buffer.toString('utf-8');
    const result = Papa.parse<AmexCsvRow>(csv, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    if (result.errors.length > 0) {
      const criticalErrors = result.errors.filter((e) => e.type !== 'FieldMismatch');
      if (criticalErrors.length > 0) {
        throw new Error(`CSV parse errors: ${criticalErrors.map((e) => e.message).join(', ')}`);
      }
    }

    // AMEX exports two CSV layouts: the year-end summary and the account activity download.
    const parseRow = isAmexActivityCsvFormat(result.meta.fields ?? [])
      ? parseActivityRow
      : parseYearEndRow;

    return result.data.map(parseRow).filter((r): r is ParsedRow => r !== null);
  }
}

// Year-end summary: Category, Card Member, Account Number, Sub-Category, Date, Month-Billed,
// Transaction, Charges $, Credits $
function parseYearEndRow(row: AmexCsvRow): ParsedRow | null {
  const dateStr = row['Date'];
  if (!dateStr) return null;

  // AMEX CSV uses two columns: "Charges $" and "Credits $". Exactly one is populated.
  const chargesStr = (row['Charges $'] ?? row['Charges'] ?? '').toString().trim();
  const creditsStr = (row['Credits $'] ?? row['Credits'] ?? '').toString().trim();

  let amount: number;
  let is_credit: boolean;
  if (creditsStr) {
    amount = parseFloat(creditsStr.replace(/[$,]/g, ''));
    is_credit = true;
  } else if (chargesStr) {
    amount = parseFloat(chargesStr.replace(/[$,]/g, ''));
    is_credit = false;
  } else {
    return null;
  }
  if (isNaN(amount)) return null;

  // AMEX CSV date format: DD/MM/YYYY (e.g. "26/12/2024")
  const date = dayjs(dateStr, 'DD/MM/YYYY');
  if (!date.isValid()) {
    throw new Error(`Invalid date: ${dateStr}`);
  }

  const description = row['Transaction']?.trim() || 'Unknown';
  const memoParts = [row['Category'], row['Sub-Category']]
    .map((s) => s?.trim())
    .filter(Boolean);
  const memo = memoParts.length ? memoParts.join(' / ') : null;

  return {
    transaction_date: date.toDate(),
    description,
    raw_description: description,
    amount,
    is_credit,
    memo,
    merchant_address: null,
    raw_data: { ...row } as Record<string, unknown>,
  };
}

// Account activity: Date, Date Processed, Description, Card Member, Account #, Amount
function parseActivityRow(row: AmexCsvRow): ParsedRow | null {
  const dateStr = row['Date']?.trim();
  const amountStr = (row['Amount'] ?? '').toString().trim();
  if (!dateStr || !amountStr) return null;

  // Single signed column: positive = charge, negative = payment/credit
  const rawAmount = parseFloat(amountStr.replace(/[$,]/g, ''));
  if (isNaN(rawAmount)) return null;

  // Activity date format: DD MMM YYYY (e.g. "06 Oct 2026"), sometimes with a period after the month
  const date = dayjs(dateStr.replace(/([A-Za-z]+)\./g, '$1'), ['DD MMM YYYY', 'D MMM YYYY']);
  if (!date.isValid()) {
    throw new Error(`Invalid date: ${dateStr}`);
  }

  const description = row['Description']?.trim() || 'Unknown';

  return {
    transaction_date: date.toDate(),
    description,
    raw_description: description,
    amount: Math.abs(rawAmount),
    is_credit: rawAmount < 0,
    memo: null,
    merchant_address: null,
    raw_data: { ...row } as Record<string, unknown>,
  };
}

function isAmexYearEndCsvFormat(headers: string[]): boolean {
  const lower = headers.map((h) => h.toLowerCase().trim());
  return lower.includes('card member') &&
    lower.includes('date') &&
    (lower.includes('charges $') || lower.includes('charges')) &&
    (lower.includes('credits $') || lower.includes('credits'));
}

function isAmexActivityCsvFormat(headers: string[]): boolean {
  const lower = headers.map((h) => h.toLowerCase().trim());
  return lower.includes('card member') &&
    lower.includes('date') &&
    lower.includes('date processed') &&
    lower.includes('description') &&
    lower.includes('amount');
}

export function isAmexCsvFormat(headers: string[]): boolean {
  return isAmexYearEndCsvFormat(headers) || isAmexActivityCsvFormat(headers);
}
