import { pool } from '../config/database.js';
import { CreateRuleRequest } from '@littysplitty/shared';
import { rulesEngine } from '../engine/rules-engine.js';
import { AppError } from '../middleware/error-handler.js';

export async function listRules(userId?: string) {
  let query = `SELECT r.*, c.name as category_name, tg.name as tag_name
     FROM rules r
     LEFT JOIN categories c ON r.category_id = c.id
     LEFT JOIN tags tg ON r.tag_id = tg.id`;
  const params: unknown[] = [];
  if (userId) {
    query += ' WHERE r.user_id = $1';
    params.push(userId);
  }
  query += ' ORDER BY r.priority DESC, r.created_at DESC';
  const { rows } = await pool.query(query, params);
  return rows;
}

export async function createRule(data: CreateRuleRequest) {
  const { rows } = await pool.query(
    `INSERT INTO rules (user_id, name, match_field, match_pattern, match_type, category_id, tag_id, is_ignored, is_transfer, priority)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      data.user_id || null,
      data.name,
      data.match_field,
      data.match_pattern,
      data.match_type,
      data.category_id || null,
      data.tag_id || null,
      data.is_ignored || false,
      data.is_transfer || false,
      data.priority || 0,
    ]
  );

  const rule = rows[0];

  if (data.apply_retroactively) {
    const result = await rulesEngine.applySingleRule(rule.id);
    return { ...rule, retroactive_applied: result.applied };
  }

  return rule;
}

export async function updateRule(id: string, data: Partial<CreateRuleRequest>) {
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined)          { setClauses.push(`name = $${idx++}`);          params.push(data.name); }
  if (data.match_field !== undefined)   { setClauses.push(`match_field = $${idx++}`);   params.push(data.match_field); }
  if (data.match_pattern !== undefined) { setClauses.push(`match_pattern = $${idx++}`); params.push(data.match_pattern); }
  if (data.match_type !== undefined)    { setClauses.push(`match_type = $${idx++}`);    params.push(data.match_type); }
  if (data.category_id !== undefined)   { setClauses.push(`category_id = $${idx++}`);   params.push(data.category_id || null); }
  if (data.tag_id !== undefined)        { setClauses.push(`tag_id = $${idx++}`);        params.push(data.tag_id || null); }
  if (data.is_ignored !== undefined)    { setClauses.push(`is_ignored = $${idx++}`);    params.push(data.is_ignored); }
  if (data.is_transfer !== undefined)   { setClauses.push(`is_transfer = $${idx++}`);   params.push(data.is_transfer); }
  if (data.priority !== undefined)      { setClauses.push(`priority = $${idx++}`);      params.push(data.priority); }

  if (setClauses.length === 0) throw new AppError(400, 'No changes provided');
  setClauses.push('updated_at = NOW()');
  params.push(id);

  const { rows } = await pool.query(
    `UPDATE rules SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  );
  if (rows.length === 0) throw new AppError(404, 'Rule not found');
  return rows[0];
}

export async function deleteRule(id: string) {
  const result = await pool.query('DELETE FROM rules WHERE id = $1', [id]);
  if (result.rowCount === 0) throw new AppError(404, 'Rule not found');
}

export async function toggleRule(id: string, isActive: boolean) {
  const { rows } = await pool.query(
    'UPDATE rules SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [isActive, id]
  );
  if (rows.length === 0) throw new AppError(404, 'Rule not found');
  return rows[0];
}

export async function applyRule(id: string) {
  return rulesEngine.applySingleRule(id);
}
