import api from './client.js';
import type { Import, ImportPreview } from '@littysplitty/shared';

export async function fetchImports(userId?: string): Promise<Import[]> {
  const params: Record<string, any> = {};
  if (userId) params.user_id = userId;
  const { data } = await api.get('/imports', { params });
  return data;
}

export async function uploadFile(file: File, userId: string): Promise<ImportPreview> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', userId);
  const { data } = await api.post('/imports/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function confirmImport(fileHash: string) {
  const { data } = await api.post('/imports/confirm', { file_hash: fileHash });
  return data;
}

export async function deleteImport(id: string) {
  const { data } = await api.delete(`/imports/${id}`);
  return data;
}
