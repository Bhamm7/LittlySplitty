-- Default bank sources
INSERT INTO bank_sources (name, parser_key) VALUES
    ('Tangerine Credit Card', 'tangerine_csv'),
    ('American Express', 'amex_xls');

-- Default categories
INSERT INTO categories (name, color, is_default) VALUES
    ('Groceries',        '#4CAF50', true),
    ('Dining',           '#FF9800', true),
    ('Transportation',   '#2196F3', true),
    ('Shopping',         '#9C27B0', true),
    ('Entertainment',    '#E91E63', true),
    ('Bills & Utilities','#607D8B', true),
    ('Health',           '#00BCD4', true),
    ('Pets',             '#8BC34A', true),
    ('Home',             '#795548', true),
    ('Other',            '#9E9E9E', true);

-- Default tags
INSERT INTO tags (name, color) VALUES
    ('Me',    '#1976D2'),
    ('Wife',  '#D32F2F'),
    ('Split', '#388E3C');
