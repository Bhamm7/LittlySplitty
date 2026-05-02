import { useQuery } from '@tanstack/react-query';
import * as statsApi from '../api/stats.js';
import { useUserContext } from '../contexts/UserContext.js';

export function useSummary(opts?: {
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  tagId?: string;
  mode?: 'spending' | 'income';
}) {
  const { selectedUserId } = useUserContext();
  return useQuery({
    queryKey: ['stats', 'summary', opts, selectedUserId],
    queryFn: () => statsApi.fetchSummary({ ...opts, userId: selectedUserId || undefined }),
  });
}

export function useMonthly(opts?: {
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  tagId?: string;
  mode?: 'spending' | 'income';
}) {
  const { selectedUserId } = useUserContext();
  return useQuery({
    queryKey: ['stats', 'monthly', opts, selectedUserId],
    queryFn: () => statsApi.fetchMonthly({ ...opts, userId: selectedUserId || undefined }),
  });
}

export function useRecentImports(limit = 5) {
  const { selectedUserId } = useUserContext();
  return useQuery({
    queryKey: ['stats', 'recent-imports', limit, selectedUserId],
    queryFn: () => statsApi.fetchRecentImports(limit, selectedUserId || undefined),
  });
}
