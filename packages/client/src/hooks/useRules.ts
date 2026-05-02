import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ruleApi from '../api/rules.js';
import type { CreateRuleRequest } from '@littysplitty/shared';
import { useUserContext } from '../contexts/UserContext.js';

export function useRules() {
  const { selectedUserId } = useUserContext();
  return useQuery({
    queryKey: ['rules', selectedUserId],
    queryFn: () => ruleApi.fetchRules(selectedUserId || undefined),
  });
}

export function useCreateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rule: CreateRuleRequest) => ruleApi.createRule(rule),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rules'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['tax'] });
    },
  });
}

export function useUpdateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRuleRequest> }) =>
      ruleApi.updateRule(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rules'] }),
  });
}

export function useToggleRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      ruleApi.toggleRule(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rules'] }),
  });
}

export function useApplyRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ruleApi.applyRule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['tax'] });
    },
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ruleApi.deleteRule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rules'] }),
  });
}
