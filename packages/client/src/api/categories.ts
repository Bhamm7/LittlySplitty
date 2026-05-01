import api from './client.js';
import type { Category } from '@littysplitty/shared';

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get('/categories');
  return data;
}

export async function createCategory(cat: { name: string; color?: string; is_business?: boolean }): Promise<Category> {
  const { data } = await api.post('/categories', cat);
  return data;
}

export async function updateCategory(id: string, cat: { name?: string; color?: string; is_business?: boolean }): Promise<Category> {
  const { data } = await api.patch(`/categories/${id}`, cat);
  return data;
}

export async function deleteCategory(id: string) {
  const { data } = await api.delete(`/categories/${id}`);
  return data;
}
