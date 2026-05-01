import { pool } from '../config/database.js';
import { TransactionFilters } from '@littysplitty/shared';
import { AppError } from '../middleware/error-handler.js';

export async function listTransactions(filters: TransactionFilters) {
  const {
    user_id,
    category_id,
    tag_id,
    is_ignored,
    date_from,
    date_to,
    search,
    page = 1,
    limit = 50,
    sort_by = 'transaction_date',
    sort_dir = 'desc',
  } = filters;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (user_id) {
    conditions.push(`t.user_id = $${paramIdx++}`);
    params.push(user_id);
  }
  if (category_id) {
    conditions.push(`t.category_id = $${paramIdx++}`);
    params.push(category_id);
  }
  if (tag_id) {
    conditions.push(`t.tag_id = $${paramIdx++}`);
    params.push(tag_id);
  }
  if (is_ignored !== undefined) {
    conditions.push(`t.is_ignored = $${paramIdx++}`);
    params.push(is_ignored);
  }
  if (date_from) {
    conditions.push(`t.transaction_date >= $${paramIdx++}`);
    params.push(date_from);
  }
  if (date_to) {
    conditions.push(`t.transaction_date <= $${paramIdx++}`);
    params.push(date_to);
  }
  if (search) {
    conditions.push(`t.description ILIKE $${paramIdx++}`);
    params.push(`%${search}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Whitelist sort columns
  const allowedSorts = ['transaction_date', 'amount', 'description', 'created_at'];
  const sortCol = allowedSorts.includes(sort_by) ? sort_by : 'transaction_date';
  const sortDirection = sort_dir === 'asc' ? 'ASC' : 'DESC';

  const offset = (page - 1) * limit;

  const countQuery = `SELECT COUNT(*) FROM transactions t ${whereClause}`;
  const dataQuery = `
    SELECT t.*,
           c.name as category_name, c.color as category_color,
           tg.name as tag_name, tg.color as tag_color
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN tags tg ON t.tag_id = tg.id
    ${whereClause}
    ORDER BY t.${sortCol} ${sortDirection}, t.created_at DESC
    LIMIT $${paramIdx++} OFFSET $${paramIdx++}
  `;
  params.push(limit, offset);

  const [countResult, dataResult] = await Promise.all([
    pool.query(countQuery, params.slice(0, params.length - 2)),
    pool.query(dataQuery, params),
  ]);

  const total = parseInt(countResult.rows[0].count, 10);

  return {
    data: dataResult.rows,
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
  };
}

export async function getTransaction(id: string) {
  const { rows } = await pool.query(
    `SELECT t.*, c.name as category_name, c.color as category_color,
            tg.name as tag_name, tg.color as tag_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN tags tg ON t.tag_id = tg.id
     WHERE t.id = $1`,
    [id]
  );
  if (rows.length === 0) throw new AppError(404, 'Transaction not found');
  return rows[0];
}

export async function updateTransaction(id: string, changes: { category_id?: string | null; tag_id?: string | null; is_ignored?: boolean }) {
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (changes.category_id !== undefined) {
    setClauses.push(`category_id = $${idx++}`);
    params.push(changes.category_id);
  }
  if (changes.tag_id !== undefined) {
    setClauses.push(`tag_id = $${idx++}`);
    params.push(changes.tag_id);
  }
  if (changes.is_ignored !== undefined) {
    setClauses.push(`is_ignored = $${idx++}`);
    params.push(changes.is_ignored);
  }

  if (setClauses.length === 0) throw new AppError(400, 'No changes provided');

  setClauses.push('updated_at = NOW()');
  params.push(id);

  const { rows } = await pool.query(
    `UPDATE transactions SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  );
  if (rows.length === 0) throw new AppError(404, 'Transaction not found');
  return rows[0];
}

export async function bulkUpdateTransactions(ids: string[], changes: { category_id?: string | null; tag_id?: string | null; is_ignored?: boolean }) {
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (changes.category_id !== undefined) {
    setClauses.push(`category_id = $${idx++}`);
    params.push(changes.category_id);
  }
  if (changes.tag_id !== undefined) {
    setClauses.push(`tag_id = $${idx++}`);
    params.push(changes.tag_id);
  }
  if (changes.is_ignored !== undefined) {
    setClauses.push(`is_ignored = $${idx++}`);
    params.push(changes.is_ignored);
  }

  if (setClauses.length === 0) throw new AppError(400, 'No changes provided');

  setClauses.push('updated_at = NOW()');
  params.push(ids);

  const result = await pool.query(
    `UPDATE transactions SET ${setClauses.join(', ')} WHERE id = ANY($${idx})`,
    params
  );
  return { updated: result.rowCount || 0 };
}
