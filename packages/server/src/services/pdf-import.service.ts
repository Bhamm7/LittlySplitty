import { env } from '../config/env.js';
import { AppError } from '../middleware/error-handler.js';
import type { ParsedRow, ParserKey } from '../parsers/index.js';

type TdPdfParserKey = Extract<ParserKey, 'td_pdf_chequing' | 'td_pdf_savings' | 'td_pdf_credit'>;

interface PdfExtractionResult {
  parserKey: TdPdfParserKey;
  bankName: string;
  rows: ParsedRow[];
}

interface RawPdfTransaction {
  transaction_date: string;
  description: string;
  raw_description: string;
  amount: number;
  is_credit: boolean;
  memo: string;
  merchant_address: string;
}

const TD_PDF_SCHEMA = {
  type: 'object',
  properties: {
    parser_key: {
      type: 'string',
      enum: ['td_pdf_chequing', 'td_pdf_savings', 'td_pdf_credit'],
    },
    transactions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          transaction_date: { type: 'string' },
          description: { type: 'string' },
          raw_description: { type: 'string' },
          amount: { type: 'number' },
          is_credit: { type: 'boolean' },
          memo: { type: 'string' },
          merchant_address: { type: 'string' },
        },
        required: [
          'transaction_date',
          'description',
          'raw_description',
          'amount',
          'is_credit',
          'memo',
          'merchant_address',
        ],
        additionalProperties: false,
      },
    },
  },
  required: ['parser_key', 'transactions'],
  additionalProperties: false,
} as const;

function extractOutputText(payload: any): string {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text;
  }

  const chunks: string[] = [];
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (typeof content?.text === 'string') {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join('\n').trim();
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  return trimmed;
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseStatementDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(400, `Invalid PDF transaction date: ${value}`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, `Unable to parse PDF transaction date: ${value}`);
  }

  return date;
}

function getBankName(parserKey: TdPdfParserKey): string {
  if (parserKey === 'td_pdf_credit') return 'TD Bank Credit Card PDF';
  if (parserKey === 'td_pdf_savings') return 'TD Bank Savings PDF';
  return 'TD Bank Chequing PDF';
}

function normalizeRow(row: RawPdfTransaction): ParsedRow {
  const description = normalizeString(row.description);
  const rawDescription = normalizeString(row.raw_description) || description;
  const memo = normalizeString(row.memo) || null;
  const merchantAddress = normalizeString(row.merchant_address) || null;
  const amount = Math.abs(Number(row.amount));

  if (!description) {
    throw new AppError(400, 'PDF import returned a transaction with no description');
  }
  if (!Number.isFinite(amount) || amount === 0) {
    throw new AppError(400, `PDF import returned an invalid amount for "${description}"`);
  }

  return {
    transaction_date: parseStatementDate(row.transaction_date),
    description,
    raw_description: rawDescription,
    amount,
    is_credit: Boolean(row.is_credit),
    memo,
    merchant_address: merchantAddress,
    raw_data: {
      source: 'openai_pdf_import',
      statement_transaction: row,
    },
  };
}

function dedupeRows(rows: ParsedRow[]): ParsedRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = [
      row.transaction_date.toISOString().slice(0, 10),
      row.description.toLowerCase(),
      row.raw_description.toLowerCase(),
      row.amount.toFixed(2),
      row.is_credit ? 'credit' : 'debit',
    ].join('|');

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function extractTransactionsFromPdf(buffer: Buffer, filename: string): Promise<PdfExtractionResult> {
  if (!env.OPENAI_API_KEY) {
    throw new AppError(500, 'OPENAI_API_KEY is required to import PDF statements.');
  }

  const prompt = [
    'Extract all posted transactions from this TD Bank PDF statement.',
    'Return statement transactions only. Exclude balances, summaries, rewards, account metadata, interest-rate boxes, payment due boxes, and duplicated carry-over lines.',
    'Use parser_key "td_pdf_credit" for TD credit card statements, "td_pdf_chequing" for TD chequing statements, and "td_pdf_savings" for TD savings statements.',
    'Choose the chequing or savings parser_key from the account type shown on the statement, not from the transaction descriptions.',
    'Infer the year from the statement period when a row only shows month and day.',
    'Amounts must always be positive decimal numbers.',
    'Set is_credit to true when money enters the account and false when money leaves the account.',
    'Keep raw_description close to the statement text, and use empty strings for memo or merchant_address when unavailable.',
  ].join(' ');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENAI_PDF_MODEL,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: 'You extract structured transaction data from TD Bank statement PDFs.',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_file',
              filename,
              file_data: `data:application/pdf;base64,${buffer.toString('base64')}`,
            },
            {
              type: 'input_text',
              text: prompt,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'td_statement_import',
          strict: true,
          schema: TD_PDF_SCHEMA,
        },
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new AppError(502, `OpenAI PDF import failed (${response.status}): ${message.slice(0, 300)}`);
  }

  const payload = await response.json();
  const rawText = stripCodeFences(extractOutputText(payload));
  if (!rawText) {
    throw new AppError(502, 'OpenAI PDF import returned an empty response.');
  }

  let parsed: { parser_key: TdPdfParserKey; transactions: RawPdfTransaction[] };
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new AppError(502, 'OpenAI PDF import returned invalid JSON.');
  }

  if (
    parsed.parser_key !== 'td_pdf_credit' &&
    parsed.parser_key !== 'td_pdf_chequing' &&
    parsed.parser_key !== 'td_pdf_savings'
  ) {
    throw new AppError(502, `OpenAI PDF import returned an unknown parser key: ${String(parsed.parser_key)}`);
  }
  if (!Array.isArray(parsed.transactions)) {
    throw new AppError(502, 'OpenAI PDF import did not return a transaction array.');
  }

  const rows = dedupeRows(parsed.transactions.map((row) => normalizeRow(row)));
  if (rows.length === 0) {
    throw new AppError(400, 'No transactions found in PDF statement.');
  }

  return {
    parserKey: parsed.parser_key,
    bankName: getBankName(parsed.parser_key),
    rows,
  };
}
