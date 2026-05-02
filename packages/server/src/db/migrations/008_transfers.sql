ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_transfer BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE rules ADD COLUMN IF NOT EXISTS is_transfer BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_transactions_transfer ON transactions(is_transfer);

-- Convert known credit-card payment transfers from the old auto-ignore behavior
-- into visible transfer transactions.
UPDATE transactions t
SET is_transfer = true,
    is_ignored = false,
    updated_at = NOW()
FROM bank_sources bs
WHERE t.bank_source_id = bs.id
  AND bs.parser_key IN ('tangerine_csv', 'amex_csv', 'amex_xls')
  AND t.is_credit = true
  AND (
    t.description ~* 'payment|thank[[:space:]]*you|autopay'
    OR COALESCE(t.raw_description, '') ~* 'payment|thank[[:space:]]*you|autopay'
  );
