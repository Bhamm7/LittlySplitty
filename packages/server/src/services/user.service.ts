import { pool } from '../config/database.js';
import { AppError } from '../middleware/error-handler.js';

export async function listUsers() {
  const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at ASC');
  return rows;
}

export async function createUser(name: string, color?: string) {
  const { rows } = await pool.query(
    'INSERT INTO users (name, color) VALUES ($1, $2) RETURNING *',
    [name, color || null]
  );
  return rows[0];
}

export async function updateUser(id: string, name?: string, color?: string) {
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (name !== undefined) { setClauses.push(`name = $${idx++}`); params.push(name); }
  if (color !== undefined) { setClauses.push(`color = $${idx++}`); params.push(color); }

  if (setClauses.length === 0) throw new AppError(400, 'No changes provided');
  setClauses.push('updated_at = NOW()');
  params.push(id);

  const { rows } = await pool.query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  );
  if (rows.length === 0) throw new AppError(404, 'User not found');
  return rows[0];
}

export async function deleteUser(id: string) {
  const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
  if (result.rowCount === 0) throw new AppError(404, 'User not found');
}
