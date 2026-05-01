import { pool } from '../config/database.js';
import { plaidClient } from '../config/plaid.js';
import { Products, CountryCode } from 'plaid';
import { rulesEngine } from '../engine/rules-engine.js';
import { AppError } from '../middleware/error-handler.js';

export async function createLinkToken(userId: string) {
  const response = await plaidClient.linkTokenCreate({
    client_name: 'LittySplitty',
    products: [Products.Transactions],
    country_codes: [CountryCode.Us, CountryCode.Ca],
    language: 'en',
    user: { client_user_id: userId },
  });
  return { link_token: response.data.link_token };
}

export async function exchangePublicToken(publicToken: string, userId: string) {
  // Exchange for permanent access_token
  const exchangeResponse = await plaidClient.itemPublicTokenExchange({
    public_token: publicToken,
  });

  const accessToken = exchangeResponse.data.access_token;
  const itemId = exchangeResponse.data.item_id;

  // Get institution info
  let institutionName = 'Unknown Institution';
  let institutionId: string | null = null;

  try {
    const itemResponse = await plaidClient.itemGet({ access_token: accessToken });
    institutionId = itemResponse.data.item.institution_id || null;

    if (institutionId) {
      const instResponse = await plaidClient.institutionsGetById({
        institution_id: institutionId,
        country_codes: [CountryCode.Us, CountryCode.Ca],
      });
      institutionName = instResponse.data.institution.name;
    }
  } catch {
    // If institution lookup fails, proceed with default name
  }

  // Store in database
  const { rows } = await pool.query(
    `INSERT INTO plaid_items (user_id, item_id, access_token, institution_id, institution_name)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, institution_name, last_synced_at, created_at`,
    [userId, itemId, accessToken, institutionId, institutionName]
  );

  return rows[0];
}

export async function listPlaidItems(userId?: string) {
  let query = `SELECT id, user_id, institution_name, last_synced_at, created_at FROM plaid_items`;
  const params: unknown[] = [];
  if (userId) {
    query += ' WHERE user_id = $1';
    params.push(userId);
  }
  query += ' ORDER BY created_at DESC';
  const { rows } = await pool.query(query, params);
  return rows;
}

export async function syncTransactions(plaidItemId: string) {
  // Load Plaid item
  const { rows: items } = await pool.query(
    'SELECT user_id, access_token, cursor, institution_name FROM plaid_items WHERE id = $1',
    [plaidItemId]
  );
  if (items.length === 0) throw new AppError(404, 'Plaid account not found');

  const { user_id: itemUserId, access_token, cursor: existingCursor, institution_name } = items[0];

  // Resolve or create bank_source for this institution
  const bankSourceId = await resolveBankSource(institution_name);

  // Paginate through transactionsSync
  let cursor = existingCursor || undefined;
  let hasMore = true;
  const allAdded: any[] = [];
  const allModified: any[] = [];
  const allRemoved: string[] = [];

  while (hasMore) {
    const response = await plaidClient.transactionsSync({
      access_token,
      cursor,
      count: 500,
    });

    const { added, modified, removed, next_cursor, has_more } = response.data;
    allAdded.push(...added);
    allModified.push(...modified);
    allRemoved.push(...removed.map((r) => r.transaction_id));
    cursor = next_cursor;
    hasMore = has_more;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Process ADDED transactions
    const newTransactionIds: string[] = [];
    for (const tx of allAdded) {
      // Skip pending transactions
      if (tx.pending) continue;

      const description = tx.merchant_name || tx.name || 'Unknown';
      const rawDescription = tx.original_description || tx.name || '';
      const amount = Math.abs(tx.amount);
      const isCredit = tx.amount < 0;
      const memo = tx.name !== description ? tx.name : null;
      const merchantAddress = buildMerchantAddress(tx.location);

      const { rows: txRows } = await client.query(
        `INSERT INTO transactions
         (user_id, plaid_item_id, plaid_transaction_id, bank_source_id, transaction_date, description, raw_description, amount, is_credit, memo, merchant_address, raw_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (plaid_transaction_id) DO NOTHING
         RETURNING id`,
        [
          itemUserId,
          plaidItemId,
          tx.transaction_id,
          bankSourceId,
          tx.date,
          description,
          rawDescription,
          amount,
          isCredit,
          memo,
          merchantAddress,
          JSON.stringify(tx),
        ]
      );
      if (txRows.length > 0) {
        newTransactionIds.push(txRows[0].id);
      }
    }

    // Process MODIFIED transactions
    let modifiedCount = 0;
    for (const tx of allModified) {
      if (tx.pending) continue;

      const description = tx.merchant_name || tx.name || 'Unknown';
      const rawDescription = tx.original_description || tx.name || '';
      const amount = Math.abs(tx.amount);
      const isCredit = tx.amount < 0;
      const merchantAddress = buildMerchantAddress(tx.location);

      const result = await client.query(
        `UPDATE transactions
         SET description = $1, raw_description = $2, amount = $3, is_credit = $4,
             transaction_date = $5, merchant_address = $6, raw_data = $7, updated_at = NOW()
         WHERE plaid_transaction_id = $8`,
        [description, rawDescription, amount, isCredit, tx.date, merchantAddress, JSON.stringify(tx), tx.transaction_id]
      );
      modifiedCount += result.rowCount || 0;
    }

    // Process REMOVED transactions
    let removedCount = 0;
    if (allRemoved.length > 0) {
      const result = await client.query(
        'DELETE FROM transactions WHERE plaid_transaction_id = ANY($1)',
        [allRemoved]
      );
      removedCount = result.rowCount || 0;
    }

    // Update cursor and last_synced_at
    await client.query(
      'UPDATE plaid_items SET cursor = $1, last_synced_at = NOW(), updated_at = NOW() WHERE id = $2',
      [cursor, plaidItemId]
    );

    await client.query('COMMIT');

    // Apply rules to newly added transactions (outside DB transaction)
    let rulesApplied = 0;
    if (newTransactionIds.length > 0) {
      const ruleResult = await rulesEngine.applyRules(newTransactionIds, itemUserId);
      rulesApplied = ruleResult.applied;
    }

    return {
      added: newTransactionIds.length,
      modified: modifiedCount,
      removed: removedCount,
      rules_applied: rulesApplied,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deletePlaidItem(plaidItemId: string) {
  // Load access token
  const { rows } = await pool.query(
    'SELECT access_token FROM plaid_items WHERE id = $1',
    [plaidItemId]
  );
  if (rows.length === 0) throw new AppError(404, 'Plaid account not found');

  // Remove from Plaid
  try {
    await plaidClient.itemRemove({ access_token: rows[0].access_token });
  } catch {
    // If Plaid removal fails (e.g. already removed), continue with local cleanup
  }

  // Delete local record (transactions stay via ON DELETE SET NULL)
  await pool.query('DELETE FROM plaid_items WHERE id = $1', [plaidItemId]);
}

// --- Helpers ---

async function resolveBankSource(institutionName: string): Promise<string> {
  // Try to find existing bank source for this Plaid institution
  const { rows } = await pool.query(
    'SELECT id FROM bank_sources WHERE name = $1',
    [institutionName]
  );
  if (rows.length > 0) return rows[0].id;

  // Create a new bank source
  const { rows: newRows } = await pool.query(
    `INSERT INTO bank_sources (name, parser_key)
     VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [institutionName, `plaid_${institutionName.toLowerCase().replace(/\s+/g, '_')}`]
  );
  return newRows[0].id;
}

function buildMerchantAddress(location: any): string | null {
  if (!location) return null;
  const parts = [location.address, location.city, location.region, location.postal_code, location.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}
