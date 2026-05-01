-- Multi-user support: add users table and scope transactions/imports/rules/plaid_items

CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    color       VARCHAR(7),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO users (name, color) VALUES ('Brett', '#3B82F6'), ('Wife', '#EC4899');

-- Add user_id columns (nullable initially for backfill)
ALTER TABLE transactions ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE imports ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE rules ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE plaid_items ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Backfill all existing data to Brett
UPDATE transactions SET user_id = (SELECT id FROM users WHERE name = 'Brett');
UPDATE imports SET user_id = (SELECT id FROM users WHERE name = 'Brett');
UPDATE rules SET user_id = (SELECT id FROM users WHERE name = 'Brett');
UPDATE plaid_items SET user_id = (SELECT id FROM users WHERE name = 'Brett');

-- Enforce NOT NULL after backfill
ALTER TABLE transactions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE imports ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE rules ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE plaid_items ALTER COLUMN user_id SET NOT NULL;

-- Indexes for user-scoped queries
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_imports_user ON imports(user_id);
CREATE INDEX idx_rules_user ON rules(user_id);
CREATE INDEX idx_plaid_items_user ON plaid_items(user_id);
