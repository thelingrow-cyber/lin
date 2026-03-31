-- Migration 003: Fix ID columns (UUID → TEXT) and add onboarding_done

-- ============================================================
-- 1. Drop foreign key constraints before altering types
-- ============================================================
ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_deck_id_fkey;
ALTER TABLE card_progress DROP CONSTRAINT IF EXISTS card_progress_card_id_fkey;
ALTER TABLE study_sessions DROP CONSTRAINT IF EXISTS study_sessions_deck_id_fkey;

-- ============================================================
-- 2. Change ID columns from UUID to TEXT
-- ============================================================

-- decks
ALTER TABLE decks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE decks ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- cards
ALTER TABLE cards ALTER COLUMN id DROP DEFAULT;
ALTER TABLE cards ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE cards ALTER COLUMN deck_id TYPE TEXT USING deck_id::TEXT;

-- card_progress
ALTER TABLE card_progress ALTER COLUMN id DROP DEFAULT;
ALTER TABLE card_progress ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE card_progress ALTER COLUMN card_id TYPE TEXT USING card_id::TEXT;

-- user_settings
ALTER TABLE user_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE user_settings ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- study_sessions
ALTER TABLE study_sessions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE study_sessions ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE study_sessions ALTER COLUMN deck_id TYPE TEXT USING deck_id::TEXT;

-- ============================================================
-- 3. Re-add foreign key constraints
-- ============================================================
ALTER TABLE cards ADD CONSTRAINT cards_deck_id_fkey
  FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE;

ALTER TABLE card_progress ADD CONSTRAINT card_progress_card_id_fkey
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE;

ALTER TABLE study_sessions ADD CONSTRAINT study_sessions_deck_id_fkey
  FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE;

-- ============================================================
-- 4. Add onboarding_done column (was missing from 002)
-- ============================================================
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- 5. Remove daily_goal constraint (app can set any value now)
-- ============================================================
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS daily_goal_valid;

INSERT INTO schema_migrations (version) VALUES ('003_fix_text_ids_and_onboarding')
  ON CONFLICT (version) DO NOTHING;
