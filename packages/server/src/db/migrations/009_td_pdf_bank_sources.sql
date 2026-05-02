INSERT INTO bank_sources (name, parser_key) VALUES
    ('TD Bank Deposit PDF', 'td_pdf_deposit'),
    ('TD Bank Credit Card PDF', 'td_pdf_credit')
ON CONFLICT (parser_key) DO NOTHING;
