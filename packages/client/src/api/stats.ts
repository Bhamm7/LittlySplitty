import api from './client.js';
import type { SpendingSummary, MonthlyBreakdown, Import } from '@littysplitty/shared';

export async function fetchSummary(opts?: {
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  tagId?: string;
  userId?: string;
  mode?: 'spending' | 'income';
}): Promise<SpendingSummary> {
  const params = Object.fromEntries(
    Object.entries({
      date_from: opts?.dateFrom,
      date_to: opts?.dateTo,
      category_id: opts?.categoryId,
      tag_id: opts?.tagId,
      user_id: opts?.userId,
      mode: opts?.mode,
    }).filter(([, v]) => v)
  );
  const { data } = await api.get('/stats/summary', { params });
  return data;
}

export async function fetchMonthly(opts?: {
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  tagId?: string;
  userId?: string;
  mode?: 'spending' | 'income';
}): Promise<MonthlyBreakdown[]> {
  const params = Object.fromEntries(
    Object.entries({
      date_from: opts?.dateFrom,
      date_to: opts?.dateTo,
      category_id: opts?.categoryId,
      tag_id: opts?.tagId,
      user_id: opts?.userId,
      mode: opts?.mode,
    }).filter(([, v]) => v)
  );
  const { data } = await api.get('/stats/monthly', { params });
  return data;
}

export async function fetchRecentImports(limit = 5, userId?: string): Promise<Import[]> {
  const params: Record<string, any> = { limit };
  if (userId) params.user_id = userId;
  const { data } = await api.get('/stats/recent-imports', { params });
  return data;
}
