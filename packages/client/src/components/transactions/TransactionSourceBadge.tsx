import { Building2 } from 'lucide-react';
import type { Transaction } from '@littysplitty/shared';

type SourceMeta =
  | { label: string; kind: 'amex' | 'mastercard' | 'td' | 'bank' };

function getSourceMeta(transaction: Pick<Transaction, 'bank_source_name' | 'bank_source_parser_key'>): SourceMeta {
  const parserKey = transaction.bank_source_parser_key?.toLowerCase() || '';
  const sourceName = transaction.bank_source_name?.toLowerCase() || '';

  if (parserKey.includes('amex') || sourceName.includes('american express')) {
    return { label: 'American Express', kind: 'amex' };
  }

  if (parserKey.includes('td_pdf_chequing')) {
    return { label: 'TD Chequing', kind: 'td' };
  }

  if (parserKey.includes('td_pdf_savings')) {
    return { label: 'TD Savings', kind: 'td' };
  }

  if (parserKey.includes('td_pdf_credit')) {
    return { label: 'TD Credit', kind: 'td' };
  }

  if (parserKey.includes('td_pdf_deposit') || sourceName.includes('td bank')) {
    return { label: 'TD Bank', kind: 'td' };
  }

  if (parserKey.includes('tangerine_debit')) {
    return { label: 'Tangerine Chequing', kind: 'bank' };
  }

  if (parserKey.includes('tangerine')) {
    return { label: 'Tangerine Credit', kind: 'mastercard' };
  }

  return { label: transaction.bank_source_name || 'Bank', kind: 'bank' };
}

function AmexCard() {
  return (
    <span className="inline-flex h-5 w-7 shrink-0 items-center justify-center rounded-[6px] bg-gradient-to-br from-sky-700 via-blue-700 to-indigo-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]">
      <span className="text-[9px] font-black leading-none text-white">A</span>
    </span>
  );
}

function MastercardCard() {
  return (
    <span className="relative inline-flex h-5 w-7 shrink-0 items-center justify-center rounded-[6px] bg-white ring-1 ring-gray-200">
      <span className="absolute left-[7px] h-2.5 w-2.5 rounded-full bg-[#EB6A1D] opacity-95" />
      <span className="absolute right-[7px] h-2.5 w-2.5 rounded-full bg-[#F59E0B] opacity-90" />
      <span className="absolute h-2.5 w-1.5 rounded-full bg-[#D97706] opacity-80" />
    </span>
  );
}

function TdBadge() {
  return (
    <span className="inline-flex h-5 w-7 shrink-0 items-center justify-center rounded-[6px] bg-[#11843b] shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]">
      <span className="text-[9px] font-black leading-none tracking-[-0.08em] text-white">TD</span>
    </span>
  );
}

function BankBadge() {
  return (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-600">
      <Building2 className="h-3.5 w-3.5" strokeWidth={1.8} />
    </span>
  );
}

export default function TransactionSourceBadge(transaction: Pick<Transaction, 'bank_source_name' | 'bank_source_parser_key'>) {
  const meta = getSourceMeta(transaction);

  return (
    <span title={meta.label} aria-label={meta.label}>
      {meta.kind === 'amex' ? <AmexCard /> : null}
      {meta.kind === 'mastercard' ? <MastercardCard /> : null}
      {meta.kind === 'td' ? <TdBadge /> : null}
      {meta.kind === 'bank' ? <BankBadge /> : null}
    </span>
  );
}
