import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TransactionFilters } from '@littysplitty/shared';
import * as txApi from '../api/transactions.js';
import { useUserContext } from '../contexts/UserContext.js';

export function useTransactions(filters: TransactionFilters) {
  const { selectedUserId } = useUserContext();
  const mergedFilters = { ...filters, user_id: selectedUserId || undefined };
  return useQuery({
    queryKey: ['transactions', mergedFilters],
    queryFn: () => txApi.fetchTransactions(mergedFilters),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Parameters<typeof txApi.updateTransaction>[1] }) =>
      txApi.updateTransaction(id, changes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useBulkUpdateTransactions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: txApi.bulkUpdateTransactions,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
