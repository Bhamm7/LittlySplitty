-- Plaid integration: connected accounts + transaction-level dedup

CREATE TABLE plaid_items (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id           VARCHAR(200) NOT NULL UNIQUE,
    access_token      VARCHAR(200) NOT NULL,
    institution_id    VARCHAR(100),
    institution_name  VARCHAR(200) NOT NULL,
    cursor            TEXT,
    last_synced_at    TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add Plaid columns to transactions
ALTER TABLE transactions
    ADD COLUMN plaid_transaction_id VARCHAR(200) UNIQUE,
    ADD COLUMN plaid_item_id UUID REFERENCES plaid_items(id) ON DELETE SET NULL;

-- Make import_id nullable (Plaid transactions have no file import)
ALTER TABLE transactions ALTER COLUMN import_id DROP NOT NULL;

CREATE INDEX idx_transactions_plaid_item ON transactions(plaid_item_id);
