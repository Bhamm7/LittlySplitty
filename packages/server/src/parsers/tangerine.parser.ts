import Papa from 'papaparse';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { BaseParser, ParsedRow } from './base-parser.js';

dayjs.extend(customParseFormat);

type TangerineRow = Record<string, string>;

export class TangerineParser extends BaseParser {
  parse(buffer: Buffer): ParsedRow[] {
    const csv = buffer.toString('utf-8');
    const result = Papa.parse<TangerineRow>(csv, {
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

    return result.data
      .map((row): ParsedRow | null => {
        // Tangerine credit uses "Transaction date"; Tangerine debit uses "Date"
        const dateStr = row['Transaction date'] || row['Date'];
        const amountStr = row['Amount'];
        if (!dateStr || !amountStr) return null;

        const rawAmount = parseFloat(amountStr);
        if (isNaN(rawAmount)) {
          throw new Error(`Invalid amount: ${amountStr}`);
        }

        // Tangerine: negative = debit (purchase/withdrawal), positive = credit (payment/deposit)
        const is_credit = rawAmount > 0;
        const amount = Math.abs(rawAmount);

        const date = dayjs(dateStr, 'MM/DD/YYYY');
        if (!date.isValid()) {
          throw new Error(`Invalid date: ${dateStr}`);
        }

        return {
          transaction_date: date.toDate(),
          description: row['Name']?.trim() || 'Unknown',
          raw_description: row['Name']?.trim() || '',
          amount,
          is_credit,
          memo: row['Memo']?.trim() || null,
          merchant_address: null,
          raw_data: { ...row } as Record<string, unknown>,
        };
      })
      .filter((r): r is ParsedRow => r !== null);
  }
}

// Tangerine credit card export: header starts with "Transaction date"
export function isTangerineCreditFormat(headers: string[]): boolean {
  const lower = headers.map((h) => h.toLowerCase().trim());
  return lower.includes('transaction date') &&
    lower.includes('name') &&
    lower.includes('memo') &&
    lower.includes('amount');
}

// Tangerine chequing/savings export: header starts with "Date"
export function isTangerineDebitFormat(headers: string[]): boolean {
  const lower = headers.map((h) => h.toLowerCase().trim());
  return lower.includes('date') &&
    !lower.includes('transaction date') &&
    lower.includes('name') &&
    lower.includes('memo') &&
    lower.includes('amount');
}
