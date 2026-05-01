import client from './client.js';
import type { User } from '@littysplitty/shared';

export async function fetchUsers(): Promise<User[]> {
  const { data } = await client.get('/users');
  return data;
}

export async function createUser(name: string, color?: string): Promise<User> {
  const { data } = await client.post('/users', { name, color });
  return data;
}

export async function updateUser(id: string, name?: string, color?: string): Promise<User> {
  const { data } = await client.patch(`/users/${id}`, { name, color });
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  await client.delete(`/users/${id}`);
}
