CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories
CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    color       VARCHAR(7),
    icon        VARCHAR(50),
    is_default  BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tags
CREATE TABLE tags (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    color       VARCHAR(7),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bank sources
CREATE TABLE bank_sources (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    parser_key  VARCHAR(50) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Imports
CREATE TABLE imports (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_source_id    UUID NOT NULL REFERENCES bank_sources(id),
    original_filename VARCHAR(500) NOT NULL,
    file_hash         VARCHAR(64) NOT NULL UNIQUE,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    date_range_start  DATE,
    date_range_end    DATE,
    status            VARCHAR(20) NOT NULL DEFAULT 'completed',
    error_message     TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_id       UUID NOT NULL REFERENCES imports(id) ON DELETE CASCADE,
    bank_source_id  UUID NOT NULL REFERENCES bank_sources(id),
    transaction_date DATE NOT NULL,
    description     VARCHAR(500) NOT NULL,
    raw_description VARCHAR(500),
    amount          NUMERIC(12,2) NOT NULL,
    is_credit       BOOLEAN NOT NULL DEFAULT false,
    category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
    tag_id          UUID REFERENCES tags(id) ON DELETE SET NULL,
    is_ignored      BOOLEAN NOT NULL DEFAULT false,
    memo            TEXT,
    merchant_address VARCHAR(500),
    raw_data        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_tag ON transactions(tag_id);
CREATE INDEX idx_transactions_ignored ON transactions(is_ignored);
CREATE INDEX idx_transactions_description ON transactions USING gin(to_tsvector('english', description));
CREATE INDEX idx_transactions_import ON transactions(import_id);

-- Rules
CREATE TABLE rules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200) NOT NULL,
    match_field     VARCHAR(20) NOT NULL DEFAULT 'description',
    match_pattern   VARCHAR(500) NOT NULL,
    match_type      VARCHAR(20) NOT NULL DEFAULT 'contains',
    action_type     VARCHAR(20) NOT NULL,
    category_id     UUID REFERENCES categories(id) ON DELETE CASCADE,
    tag_id          UUID REFERENCES tags(id) ON DELETE CASCADE,
    priority        INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_action CHECK (
        (action_type = 'set_category' AND category_id IS NOT NULL) OR
        (action_type = 'set_tag' AND tag_id IS NOT NULL) OR
        (action_type = 'ignore')
    )
);

CREATE INDEX idx_rules_active ON rules(is_active, priority);
