import { useQuery } from '@tanstack/react-query';
import * as statsApi from '../api/stats.js';
import { useUserContext } from '../contexts/UserContext.js';

export function useSummary(dateFrom?: string, dateTo?: string, mode?: string) {
  const { selectedUserId } = useUserContext();
  return useQuery({
    queryKey: ['stats', 'summary', dateFrom, dateTo, selectedUserId, mode],
    queryFn: () => statsApi.fetchSummary(dateFrom, dateTo, selectedUserId || undefined, mode),
  });
}

export function useMonthly(opts?: { dateFrom?: string; dateTo?: string; categoryId?: string; tagId?: string }) {
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
