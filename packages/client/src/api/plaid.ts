import api from './client.js';
import type { PlaidItem, PlaidSyncResult } from '@littysplitty/shared';

export async function createLinkToken(userId: string): Promise<{ link_token: string }> {
  const { data } = await api.post('/plaid/link-token', { user_id: userId });
  return data;
}

export async function exchangePublicToken(publicToken: string, userId: string): Promise<PlaidItem> {
  const { data } = await api.post('/plaid/exchange-token', { public_token: publicToken, user_id: userId });
  return data;
}

export async function fetchPlaidItems(userId?: string): Promise<PlaidItem[]> {
  const params: Record<string, any> = {};
  if (userId) params.user_id = userId;
  const { data } = await api.get('/plaid/items', { params });
  return data;
}

export async function syncPlaidItem(id: string): Promise<PlaidSyncResult> {
  const { data } = await api.post(`/plaid/items/${id}/sync`);
  return data;
}

export async function deletePlaidItem(id: string): Promise<void> {
  await api.delete(`/plaid/items/${id}`);
}
