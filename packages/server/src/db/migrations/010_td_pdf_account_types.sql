INSERT INTO bank_sources (name, parser_key) VALUES
    ('TD Bank Chequing PDF', 'td_pdf_chequing'),
    ('TD Bank Savings PDF', 'td_pdf_savings')
ON CONFLICT (parser_key) DO NOTHING;
