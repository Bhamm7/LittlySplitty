import { pool } from '../config/database.js';
import { AppError } from '../middleware/error-handler.js';

export async function listCategories() {
  const { rows } = await pool.query('SELECT * FROM categories ORDER BY is_default DESC, name ASC');
  return rows;
}

export async function createCategory(data: { name: string; color?: string; icon?: string; is_business?: boolean }) {
  const { rows } = await pool.query(
    'INSERT INTO categories (name, color, icon, is_business) VALUES ($1, $2, $3, $4) RETURNING *',
    [data.name, data.color || null, data.icon || null, data.is_business ?? false]
  );
  return rows[0];
}

export async function updateCategory(id: string, data: { name?: string; color?: string; icon?: string; is_business?: boolean }) {
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) { setClauses.push(`name = $${idx++}`); params.push(data.name); }
  if (data.color !== undefined) { setClauses.push(`color = $${idx++}`); params.push(data.color); }
  if (data.icon !== undefined) { setClauses.push(`icon = $${idx++}`); params.push(data.icon); }
  if (data.is_business !== undefined) { setClauses.push(`is_business = $${idx++}`); params.push(data.is_business); }

  if (setClauses.length === 0) throw new AppError(400, 'No changes provided');
  setClauses.push('updated_at = NOW()');
  params.push(id);

  const { rows } = await pool.query(
    `UPDATE categories SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  );
  if (rows.length === 0) throw new AppError(404, 'Category not found');
  return rows[0];
}

export async function deleteCategory(id: string) {
  const result = await pool.query('DELETE FROM categories WHERE id = $1', [id]);
  if (result.rowCount === 0) throw new AppError(404, 'Category not found');
}
