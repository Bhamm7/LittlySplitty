import api from './client.js';
import type { TaxReport } from '@littysplitty/shared';

export async function fetchTaxReport(year: number, userId?: string): Promise<TaxReport> {
  const params: Record<string, any> = { year };
  if (userId) params.user_id = userId;
  const { data } = await api.get('/stats/tax-report', { params });
  return data;
}
