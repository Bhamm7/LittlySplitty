import api from './client.js';
import type { Tag } from '@littysplitty/shared';

export async function fetchTags(): Promise<Tag[]> {
  const { data } = await api.get('/tags');
  return data;
}

export async function createTag(tag: { name: string; color?: string }): Promise<Tag> {
  const { data } = await api.post('/tags', tag);
  return data;
}

export async function updateTag(id: string, tag: { name?: string; color?: string }): Promise<Tag> {
  const { data } = await api.patch(`/tags/${id}`, tag);
  return data;
}

export async function deleteTag(id: string) {
  const { data } = await api.delete(`/tags/${id}`);
  return data;
}
