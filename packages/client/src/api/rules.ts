import api from './client.js';
import type { Rule, CreateRuleRequest } from '@littysplitty/shared';

export async function fetchRules(userId?: string): Promise<Rule[]> {
  const params: Record<string, any> = {};
  if (userId) params.user_id = userId;
  const { data } = await api.get('/rules', { params });
  return data;
}

export async function createRule(rule: CreateRuleRequest): Promise<Rule> {
  const { data } = await api.post('/rules', rule);
  return data;
}

export async function updateRule(id: string, rule: Partial<CreateRuleRequest>): Promise<Rule> {
  const { data } = await api.patch(`/rules/${id}`, rule);
  return data;
}

export async function toggleRule(id: string, isActive: boolean): Promise<Rule> {
  const { data } = await api.patch(`/rules/${id}/toggle`, { is_active: isActive });
  return data;
}

export async function applyRule(id: string) {
  const { data } = await api.post(`/rules/${id}/apply`);
  return data;
}

export async function deleteRule(id: string) {
  const { data } = await api.delete(`/rules/${id}`);
  return data;
}
