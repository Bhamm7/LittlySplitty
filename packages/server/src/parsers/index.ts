import Papa from 'papaparse';
import { BaseParser, ParsedRow } from './base-parser.js';
import {
  TangerineParser,
  isTangerineCreditFormat,
  isTangerineDebitFormat,
} from './tangerine.parser.js';
import { AmexParser, isAmexFormat } from './amex.parser.js';
import { AmexCsvParser, isAmexCsvFormat } from './amex-csv.parser.js';
import { AppError } from '../middleware/error-handler.js';

export type ParserKey =
  | 'tangerine_csv'
  | 'tangerine_debit_csv'
  | 'amex_csv'
  | 'amex_xls'
  | 'td_pdf_chequing'
  | 'td_pdf_savings'
  | 'td_pdf_credit';

interface DetectionResult {
  parserKey: ParserKey;
  bankName: string;
}

function readCsvHeaders(buffer: Buffer): string[] {
  // Parse only the first row to extract headers without loading the whole file twice
  const csv = buffer.toString('utf-8');
  const result = Papa.parse<string[]>(csv, {
    header: false,
    skipEmptyLines: true,
    preview: 1,
  });
  const first = result.data[0];
  return Array.isArray(first) ? first.map((h) => String(h).trim()) : [];
}

export function detectBankFormat(buffer: Buffer, filename: string): DetectionResult {
  const ext = filename.toLowerCase();

  if (ext.endsWith('.csv')) {
    const headers = readCsvHeaders(buffer);

    if (isAmexCsvFormat(headers)) {
      return { parserKey: 'amex_csv', bankName: 'American Express (CSV)' };
    }
    if (isTangerineCreditFormat(headers)) {
      return { parserKey: 'tangerine_csv', bankName: 'Tangerine Credit Card' };
    }
    if (isTangerineDebitFormat(headers)) {
      return { parserKey: 'tangerine_debit_csv', bankName: 'Tangerine Debit' };
    }
    throw new AppError(400, `Unknown CSV format. Headers found: ${headers.join(', ').substring(0, 200)}`);
  }

  if (ext.endsWith('.xls') || ext.endsWith('.xlsx')) {
    if (isAmexFormat(buffer)) {
      return { parserKey: 'amex_xls', bankName: 'American Express' };
    }
    throw new AppError(400, 'Unknown Excel format. Expected Amex statement columns.');
  }

  throw new AppError(400, `Unsupported file type: ${ext}`);
}

export function getParser(parserKey: ParserKey): BaseParser {
  switch (parserKey) {
    case 'tangerine_csv':
    case 'tangerine_debit_csv':
      return new TangerineParser();
    case 'amex_csv':
      return new AmexCsvParser();
    case 'amex_xls':
      return new AmexParser();
    case 'td_pdf_chequing':
    case 'td_pdf_savings':
    case 'td_pdf_credit':
      throw new AppError(400, `PDF parser ${parserKey} must be handled by the PDF import service`);
    default:
      throw new AppError(400, `Unknown parser: ${parserKey}`);
  }
}

export type { ParsedRow };
