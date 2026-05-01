-- Migrate rules table: drop action_type, add is_ignored
-- A single rule can now set a category, a tag, AND/OR ignore — all at once.

ALTER TABLE rules DROP CONSTRAINT IF EXISTS rules_action_check;
ALTER TABLE rules DROP COLUMN IF EXISTS action_type;
ALTER TABLE rules ADD COLUMN IF NOT EXISTS is_ignored BOOLEAN NOT NULL DEFAULT FALSE;
