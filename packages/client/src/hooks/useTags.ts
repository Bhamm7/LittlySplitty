import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as tagApi from '../api/tags.js';

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: tagApi.fetchTags,
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tagApi.createTag,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof tagApi.updateTag>[1] }) =>
      tagApi.updateTag(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tagApi.deleteTag,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
