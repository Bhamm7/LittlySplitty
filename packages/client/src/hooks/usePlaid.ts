import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as plaidApi from '../api/plaid.js';
import { useUserContext } from '../contexts/UserContext.js';

export function usePlaidItems() {
  const { selectedUserId } = useUserContext();
  return useQuery({
    queryKey: ['plaid-items', selectedUserId],
    queryFn: () => plaidApi.fetchPlaidItems(selectedUserId || undefined),
  });
}

export function useCreateLinkToken() {
  return useMutation({
    mutationFn: (userId: string) => plaidApi.createLinkToken(userId),
  });
}

export function useExchangePublicToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ publicToken, userId }: { publicToken: string; userId: string }) =>
      plaidApi.exchangePublicToken(publicToken, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plaid-items'] });
    },
  });
}

export function useSyncPlaidItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: plaidApi.syncPlaidItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plaid-items'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useDeletePlaidItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: plaidApi.deletePlaidItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plaid-items'] });
    },
  });
}
