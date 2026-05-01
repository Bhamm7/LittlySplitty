import { pool } from '../config/database.js';

export async function getSummary(dateFrom?: string, dateTo?: string, userId?: string, mode?: string) {
  const conditions: string[] = ['t.is_ignored = false'];
  const params: unknown[] = [];
  let idx = 1;

  if (dateFrom) { conditions.push(`t.transaction_date >= $${idx++}`); params.push(dateFrom); }
  if (dateTo) { conditions.push(`t.transaction_date <= $${idx++}`); params.push(dateTo); }
  if (userId) { conditions.push(`t.user_id = $${idx++}`); params.push(userId); }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const isIncome = mode === 'income';
  const creditFilter = isIncome ? 't.is_credit = true' : 'NOT t.is_credit';

  // Overall totals
  const totalsQuery = `
    SELECT
      COALESCE(SUM(CASE WHEN NOT is_credit THEN amount ELSE 0 END), 0) as total_spent,
      COALESCE(SUM(CASE WHEN is_credit THEN amount ELSE 0 END), 0) as total_credits,
      COUNT(*) as transaction_count
    FROM transactions t ${whereClause}
  `;

  // By category — filter by mode
  const byCategoryQuery = `
    SELECT c.id as category_id, c.name as category_name, c.color as category_color,
           COALESCE(SUM(t.amount), 0) as total,
           COUNT(*) as count
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    ${whereClause} AND ${creditFilter}
    GROUP BY c.id, c.name, c.color
    ORDER BY total DESC
  `;

  // By tag — filter by mode
  const byTagQuery = `
    SELECT tg.id as tag_id, tg.name as tag_name, tg.color as tag_color,
           COALESCE(SUM(t.amount), 0) as total,
           COUNT(*) as count
    FROM transactions t
    LEFT JOIN tags tg ON t.tag_id = tg.id
    ${whereClause} AND ${creditFilter}
    GROUP BY tg.id, tg.name, tg.color
    ORDER BY total DESC
  `;

  const [totals, byCategory, byTag] = await Promise.all([
    pool.query(totalsQuery, params),
    pool.query(byCategoryQuery, params),
    pool.query(byTagQuery, params),
  ]);

  const t = totals.rows[0];
  return {
    total_spent: parseFloat(t.total_spent),
    total_credits: parseFloat(t.total_credits),
    net: parseFloat(t.total_spent) - parseFloat(t.total_credits),
    transaction_count: parseInt(t.transaction_count, 10),
    by_category: byCategory.rows.map((r) => ({
      ...r,
      total: parseFloat(r.total),
      count: parseInt(r.count, 10),
    })),
    by_tag: byTag.rows.map((r) => ({
      ...r,
      total: parseFloat(r.total),
      count: parseInt(r.count, 10),
    })),
  };
}

export async function getMonthlyBreakdown(dateFrom?: string, dateTo?: string, categoryId?: string, tagId?: string, userId?: string) {
  const conditions: string[] = ['t.is_ignored = false'];
  const params: unknown[] = [];
  let idx = 1;

  if (dateFrom) { conditions.push(`t.transaction_date >= $${idx++}`); params.push(dateFrom); }
  if (dateTo) { conditions.push(`t.transaction_date <= $${idx++}`); params.push(dateTo); }
  if (categoryId) { conditions.push(`t.category_id = $${idx++}`); params.push(categoryId); }
  if (tagId) { conditions.push(`t.tag_id = $${idx++}`); params.push(tagId); }
  if (userId) { conditions.push(`t.user_id = $${idx++}`); params.push(userId); }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const { rows } = await pool.query(
    `SELECT
       TO_CHAR(t.transaction_date, 'YYYY-MM') as month,
       COALESCE(SUM(CASE WHEN NOT t.is_credit THEN t.amount ELSE 0 END), 0) as total_spent,
       COALESCE(SUM(CASE WHEN t.is_credit THEN t.amount ELSE 0 END), 0) as total_credits,
       COUNT(*) as transaction_count
     FROM transactions t
     ${whereClause}
     GROUP BY TO_CHAR(t.transaction_date, 'YYYY-MM')
     ORDER BY month ASC`,
    params
  );

  return rows.map((r) => ({
    month: r.month,
    total_spent: parseFloat(r.total_spent),
    total_credits: parseFloat(r.total_credits),
    transaction_count: parseInt(r.transaction_count, 10),
  }));
}

export async function getTaxReport(year: number, userId?: string) {
  const params: unknown[] = [`${year}-01-01`, `${year}-12-31`];
  let idx = 3;
  const userClause = userId ? ` AND t.user_id = $${idx++}` : '';
  if (userId) params.push(userId);

  const { rows } = await pool.query(
    `SELECT
       c.id as category_id, c.name as category_name, c.color as category_color,
       COALESCE(SUM(CASE WHEN t.is_credit THEN t.amount ELSE 0 END), 0) as total_income,
       COALESCE(SUM(CASE WHEN NOT t.is_credit THEN t.amount ELSE 0 END), 0) as total_expenses,
       COUNT(*) as count
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     WHERE c.is_business = true
       AND t.is_ignored = false
       AND t.transaction_date >= $1
       AND t.transaction_date <= $2
       ${userClause}
     GROUP BY c.id, c.name, c.color
     ORDER BY c.name ASC`,
    params
  );

  const mapRow = (r: any) => ({
    category_id: r.category_id,
    category_name: r.category_name,
    category_color: r.category_color,
    total_income: parseFloat(r.total_income),
    total_expenses: parseFloat(r.total_expenses),
    count: parseInt(r.count, 10),
  });

  const incomeCategories = rows.filter((r) => parseFloat(r.total_income) > 0).map(mapRow);
  const expenseCategories = rows.filter((r) => parseFloat(r.total_expenses) > 0).map(mapRow);
  const totalIncome = incomeCategories.reduce((s, c) => s + c.total_income, 0);
  const totalExpenses = expenseCategories.reduce((s, c) => s + c.total_expenses, 0);

  return {
    year,
    income: { total: totalIncome, categories: incomeCategories },
    expenses: { total: totalExpenses, categories: expenseCategories },
    net: totalIncome - totalExpenses,
  };
}

export async function getRecentImports(limit = 5, userId?: string) {
  let query = `SELECT i.*, bs.name as bank_source_name
     FROM imports i
     JOIN bank_sources bs ON i.bank_source_id = bs.id`;
  const params: unknown[] = [];
  if (userId) {
    query += ' WHERE i.user_id = $1';
    params.push(userId);
  }
  query += ' ORDER BY i.created_at DESC LIMIT $' + (params.length + 1);
  params.push(limit);
  const { rows } = await pool.query(query, params);
  return rows;
}
