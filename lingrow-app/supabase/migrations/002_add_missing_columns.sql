-- Migration 002: Add missing columns

-- decks: color e is_built_in
ALTER TABLE decks ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#7C3AED';
ALTER TABLE decks ADD COLUMN IF NOT EXISTS is_built_in BOOLEAN NOT NULL DEFAULT FALSE;

-- cards: keyword e keyword_pt
ALTER TABLE cards ADD COLUMN IF NOT EXISTS keyword TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS keyword_pt TEXT;

-- user_settings: streak e last_study_date
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS last_study_date TEXT;

INSERT INTO schema_migrations (version) VALUES ('002_add_missing_columns')
  ON CONFLICT (version) DO NOTHING;
