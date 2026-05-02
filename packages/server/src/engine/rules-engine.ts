import { pool } from '../config/database.js';
import type { PoolClient } from 'pg';

export class RulesEngine {
  /**
   * Apply all active rules to specific transactions.
   * When userId is provided, only that user's rules are applied.
   */
  async applyRules(transactionIds?: string[], userId?: string): Promise<{ applied: number }> {
    const client = await pool.connect();
    try {
      let ruleQuery = `SELECT id, match_field, match_pattern, match_type, category_id, tag_id, is_ignored, is_transfer
         FROM rules WHERE is_active = true`;
      const ruleParams: unknown[] = [];
      if (userId) {
        ruleQuery += ' AND user_id = $1';
        ruleParams.push(userId);
      }
      ruleQuery += ' ORDER BY priority ASC';

      const { rows: rules } = await client.query(ruleQuery, ruleParams);

      let totalApplied = 0;

      for (const rule of rules) {
        const result = await this._applyRuleRow(client, rule, transactionIds);
        totalApplied += result;
      }

      return { applied: totalApplied };
    } finally {
      client.release();
    }
  }

  /**
   * Apply a single rule to all matching transactions (scoped to the rule's user).
   */
  async applySingleRule(ruleId: string): Promise<{ applied: number }> {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `SELECT match_field, match_pattern, match_type, category_id, tag_id, is_ignored, is_transfer, user_id
         FROM rules WHERE id = $1 AND is_active = true`,
        [ruleId]
      );

      if (rows.length === 0) return { applied: 0 };

      const rule = rows[0];
      const applied = await this._applyRuleRow(client, rule, undefined, rule.user_id);
      return { applied };
    } finally {
      client.release();
    }
  }

  private async _applyRuleRow(
    client: PoolClient,
    rule: { match_field: string; match_pattern: string; match_type: string; category_id: string | null; tag_id: string | null; is_ignored: boolean; is_transfer: boolean },
    transactionIds?: string[],
    userId?: string
  ): Promise<number> {
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (rule.category_id) {
      setClauses.push(`category_id = $${paramIdx++}`);
      params.push(rule.category_id);
    }
    if (rule.tag_id) {
      setClauses.push(`tag_id = $${paramIdx++}`);
      params.push(rule.tag_id);
    }
    if (rule.is_ignored) {
      setClauses.push('is_ignored = true');
    }
    if (rule.is_transfer) {
      setClauses.push('is_transfer = true');
    }

    if (setClauses.length === 0) return 0;

    setClauses.push('updated_at = NOW()');

    const pattern = this.buildPattern(rule.match_pattern, rule.match_type);
    const field = rule.match_field === 'memo' ? 'memo' : 'description';

    params.push(pattern);
    let whereClause = `${field} ILIKE $${paramIdx++}`;

    if (transactionIds && transactionIds.length > 0) {
      params.push(transactionIds);
      whereClause += ` AND id = ANY($${paramIdx++})`;
    }

    if (userId) {
      params.push(userId);
      whereClause += ` AND user_id = $${paramIdx++}`;
    }

    const sql = `UPDATE transactions SET ${setClauses.join(', ')} WHERE ${whereClause}`;
    const result = await client.query(sql, params);
    return result.rowCount || 0;
  }

  private buildPattern(pattern: string, matchType: string): string {
    const escaped = pattern.replace(/%/g, '\\%').replace(/_/g, '\\_');
    switch (matchType) {
      case 'contains':   return `%${escaped}%`;
      case 'starts_with': return `${escaped}%`;
      case 'exact':      return escaped;
      default:           return `%${escaped}%`;
    }
  }
}

export const rulesEngine = new RulesEngine();
