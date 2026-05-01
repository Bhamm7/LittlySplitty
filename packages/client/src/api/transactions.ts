import api from './client.js';
import type { TransactionFilters, PaginatedResponse, Transaction, UpdateTransactionRequest, BulkUpdateTransactionRequest } from '@littysplitty/shared';

export async function fetchTransactions(filters: TransactionFilters): Promise<PaginatedResponse<Transaction>> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
  );
  const { data } = await api.get('/transactions', { params });
  return data;
}

export async function fetchTransaction(id: string): Promise<Transaction> {
  const { data } = await api.get(`/transactions/${id}`);
  return data;
}

export async function updateTransaction(id: string, changes: UpdateTransactionRequest): Promise<Transaction> {
  const { data } = await api.patch(`/transactions/${id}`, changes);
  return data;
}

export async function bulkUpdateTransactions(req: BulkUpdateTransactionRequest) {
  const { data } = await api.patch('/transactions/bulk/update', req);
  return data;
}
