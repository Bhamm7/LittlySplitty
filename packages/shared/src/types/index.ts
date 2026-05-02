export interface User {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  is_default: boolean;
  is_business: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankSource {
  id: string;
  name: string;
  parser_key: string;
  created_at: string;
}

export interface Import {
  id: string;
  user_id: string;
  bank_source_id: string;
  bank_source_name?: string;
  original_filename: string;
  file_hash: string;
  transaction_count: number;
  date_range_start: string | null;
  date_range_end: string | null;
  status: 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  import_id: string | null;
  bank_source_id: string;
  bank_source_name?: string | null;
  bank_source_parser_key?: string | null;
  plaid_transaction_id?: string | null;
  plaid_item_id?: string | null;
  transaction_date: string;
  description: string;
  raw_description: string | null;
  amount: number;
  is_credit: boolean;
  is_transfer: boolean;
  category_id: string | null;
  category_name?: string | null;
  category_color?: string | null;
  tag_id: string | null;
  tag_name?: string | null;
  tag_color?: string | null;
  is_ignored: boolean;
  memo: string | null;
  merchant_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Rule {
  id: string;
  user_id: string;
  name: string;
  match_field: 'description' | 'memo';
  match_pattern: string;
  match_type: 'contains' | 'starts_with' | 'exact';
  category_id: string | null;
  category_name?: string | null;
  tag_id: string | null;
  tag_name?: string | null;
  is_ignored: boolean;
  is_transfer: boolean;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ImportPreview {
  bank_source: string;
  parser_key: string;
  file_hash: string;
  transaction_count: number;
  date_range_start: string | null;
  date_range_end: string | null;
  sample_rows: ParsedTransaction[];
}

export interface ParsedTransaction {
  transaction_date: string;
  description: string;
  raw_description: string;
  amount: number;
  is_credit: boolean;
  memo: string | null;
  merchant_address: string | null;
}

export interface TransactionFilters {
  user_id?: string;
  category_id?: string;
  tag_id?: string;
  is_ignored?: boolean;
  is_transfer?: boolean;
  mode?: 'spending' | 'income';
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export interface SpendingSummary {
  total_spent: number;
  total_credits: number;
  net: number;
  transaction_count: number;
  by_category: { category_id: string | null; category_name: string | null; category_color: string | null; total: number; count: number }[];
  by_tag: { tag_id: string | null; tag_name: string | null; tag_color: string | null; total: number; count: number }[];
}

export interface MonthlyBreakdown {
  month: string;
  total_spent: number;
  total_credits: number;
  transaction_count: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CreateRuleRequest {
  user_id?: string;
  name: string;
  match_field: 'description' | 'memo';
  match_pattern: string;
  match_type: 'contains' | 'starts_with' | 'exact';
  category_id?: string;
  tag_id?: string;
  is_ignored?: boolean;
  is_transfer?: boolean;
  priority?: number;
  apply_retroactively?: boolean;
}

export interface UpdateTransactionRequest {
  category_id?: string | null;
  tag_id?: string | null;
  is_ignored?: boolean;
  is_transfer?: boolean;
}

export interface BulkUpdateTransactionRequest {
  ids: string[];
  changes: UpdateTransactionRequest;
}

export interface PlaidItem {
  id: string;
  user_id: string;
  institution_name: string;
  last_synced_at: string | null;
  created_at: string;
}

export interface PlaidSyncResult {
  added: number;
  modified: number;
  removed: number;
  rules_applied: number;
}

export interface TaxReportCategory {
  category_id: string;
  category_name: string;
  category_color: string | null;
  total_income: number;
  total_expenses: number;
  count: number;
}

export interface TaxReport {
  year: number;
  income: { total: number; categories: TaxReportCategory[] };
  expenses: { total: number; categories: TaxReportCategory[] };
  net: number;
}
