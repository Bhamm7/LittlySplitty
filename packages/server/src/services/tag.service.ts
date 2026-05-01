import { pool } from '../config/database.js';
import { AppError } from '../middleware/error-handler.js';

export async function listTags() {
  const { rows } = await pool.query('SELECT * FROM tags ORDER BY name ASC');
  return rows;
}

export async function createTag(data: { name: string; color?: string }) {
  const { rows } = await pool.query(
    'INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING *',
    [data.name, data.color || null]
  );
  return rows[0];
}

export async function updateTag(id: string, data: { name?: string; color?: string }) {
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) { setClauses.push(`name = $${idx++}`); params.push(data.name); }
  if (data.color !== undefined) { setClauses.push(`color = $${idx++}`); params.push(data.color); }

  if (setClauses.length === 0) throw new AppError(400, 'No changes provided');
  setClauses.push('updated_at = NOW()');
  params.push(id);

  const { rows } = await pool.query(
    `UPDATE tags SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  );
  if (rows.length === 0) throw new AppError(404, 'Tag not found');
  return rows[0];
}

export async function deleteTag(id: string) {
  const result = await pool.query('DELETE FROM tags WHERE id = $1', [id]);
  if (result.rowCount === 0) throw new AppError(404, 'Tag not found');
}
