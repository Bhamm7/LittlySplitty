export interface ParsedRow {
  transaction_date: Date;
  description: string;
  raw_description: string;
  amount: number;       // Always positive
  is_credit: boolean;
  memo: string | null;
  merchant_address: string | null;
  raw_data: Record<string, unknown>;
}

export abstract class BaseParser {
  abstract parse(buffer: Buffer): ParsedRow[];
}
