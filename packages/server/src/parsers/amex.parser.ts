import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { BaseParser, ParsedRow } from './base-parser.js';

dayjs.extend(customParseFormat);

export class AmexParser extends BaseParser {
  parse(buffer: Buffer): ParsedRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON array of arrays to find the header row
    const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    // Find the header row by looking for "Date" and "Amount" columns
    let headerRowIdx = -1;
    let colMap: Record<string, number> = {};

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      if (!Array.isArray(row)) continue;

      const cells = row.map((c) => String(c).trim().toLowerCase());
      const dateIdx = cells.indexOf('date');
      const amountIdx = cells.indexOf('amount');
      const descIdx = cells.indexOf('description');

      if (dateIdx >= 0 && amountIdx >= 0) {
        headerRowIdx = i;
        colMap = {
          date: dateIdx,
          amount: amountIdx,
          description: descIdx >= 0 ? descIdx : -1,
          date_processed: cells.indexOf('date processed'),
          merchant: cells.indexOf('appears on your statement as'),
          merchant_address: cells.indexOf('address'),
          additional_info: cells.indexOf('additional information'),
        };
        break;
      }
    }

    if (headerRowIdx === -1) {
      throw new Error('Could not find header row in Amex file. Expected columns: Date, Amount');
    }

    const results: ParsedRow[] = [];

    for (let i = headerRowIdx + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!Array.isArray(row)) continue;

      const dateStr = String(row[colMap.date] || '').trim();
      const amountStr = String(row[colMap.amount] || '').trim();
      const description = colMap.description >= 0 ? String(row[colMap.description] || '').trim() : '';

      // Skip empty rows and summary rows
      if (!dateStr || !amountStr) continue;

      // Parse amount (remove $ and commas)
      const cleanAmount = amountStr.replace(/[$,]/g, '');
      const rawAmount = parseFloat(cleanAmount);
      if (isNaN(rawAmount)) continue;

      // Parse date - Amex uses "DD Mon. YYYY" format (e.g., "27 Jan. 2026")
      // Strip trailing periods from month abbreviations before parsing
      const normalizedDate = dateStr.replace(/([A-Za-z]+)\./g, '$1');
      let date = dayjs(normalizedDate, 'DD MMM YYYY');
      if (!date.isValid()) {
        date = dayjs(normalizedDate, 'D MMM YYYY');
      }
      if (!date.isValid()) continue; // Skip rows we can't parse dates for

      // Amex: positive = charge (debit), negative = payment/credit
      const is_credit = rawAmount < 0;
      const amount = Math.abs(rawAmount);

      const merchant = colMap.merchant >= 0 ? String(row[colMap.merchant] || '').trim() : null;
      const merchantAddr = colMap.merchant_address >= 0 ? String(row[colMap.merchant_address] || '').trim() : null;

      // Build raw_data object
      const rawDataObj: Record<string, unknown> = {};
      const headers = rawData[headerRowIdx] as string[];
      for (let c = 0; c < headers.length; c++) {
        if (headers[c]) {
          rawDataObj[String(headers[c]).trim()] = row[c];
        }
      }

      results.push({
        transaction_date: date.toDate(),
        description: description || merchant || 'Unknown',
        raw_description: description || '',
        amount,
        is_credit,
        memo: null,
        merchant_address: merchantAddr || null,
        raw_data: rawDataObj,
      });
    }

    return results;
  }
}

export function isAmexFormat(buffer: Buffer): boolean {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    for (const row of data) {
      if (!Array.isArray(row)) continue;
      const cells = row.map((c) => String(c).trim().toLowerCase());
      if (cells.includes('date') && cells.includes('amount')) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}
