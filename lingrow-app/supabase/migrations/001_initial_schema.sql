-- ============================================================
-- Lingrow — Initial Schema v1.0
-- Migration: 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- DECKS
-- ============================================================
CREATE TABLE IF NOT EXISTS decks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE decks IS 'Coleções de flashcards do usuário';

CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);

-- ============================================================
-- CARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS cards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id      UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  front_text   TEXT NOT NULL,
  back_text    TEXT NOT NULL,
  notes        TEXT,
  audio_url    TEXT,
  position     INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cards IS 'Flashcards individuais com frente/verso';
COMMENT ON COLUMN cards.position IS 'Ordem pedagógica dentro do deck (1-1000)';
COMMENT ON COLUMN cards.audio_url IS 'URL do áudio — carregado sob demanda, nunca autoplay';

CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_cards_position ON cards(deck_id, position);

-- ============================================================
-- CARD_PROGRESS — Coração do algoritmo SRS
-- ============================================================
CREATE TABLE IF NOT EXISTS card_progress (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id        UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  repetitions    INTEGER NOT NULL DEFAULT 0,
  ease_factor    NUMERIC(4,2) NOT NULL DEFAULT 2.50,
  interval_days  INTEGER NOT NULL DEFAULT 1,
  last_review    TIMESTAMPTZ,
  next_review    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consecutive_again  INTEGER NOT NULL DEFAULT 0,
  consecutive_easy   INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, card_id),
  CONSTRAINT ease_factor_min CHECK (ease_factor >= 1.3),
  CONSTRAINT ease_factor_max CHECK (ease_factor <= 5.0),
  CONSTRAINT interval_positive CHECK (interval_days >= 1),
  CONSTRAINT repetitions_positive CHECK (repetitions >= 0)
);

COMMENT ON TABLE card_progress IS 'Estado SRS de cada card por usuário';
COMMENT ON COLUMN card_progress.ease_factor IS 'Fator de facilidade (1.3 mín). Padrão SM-2: 2.5';
COMMENT ON COLUMN card_progress.interval_days IS 'Dias até próxima revisão';
COMMENT ON COLUMN card_progress.consecutive_again IS 'Contador de AGAIN consecutivos — penalidade agressiva ao chegar em 2';
COMMENT ON COLUMN card_progress.consecutive_easy IS 'Contador de EASY consecutivos — acelera intervalo ao chegar em 3';

CREATE INDEX IF NOT EXISTS idx_card_progress_user_id ON card_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_card_progress_next_review ON card_progress(user_id, next_review);
CREATE INDEX IF NOT EXISTS idx_card_progress_due ON card_progress(user_id, next_review);

-- ============================================================
-- USER_SETTINGS — Preferências do usuário
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_goal            INTEGER NOT NULL DEFAULT 5,
  auto_play_audio       BOOLEAN NOT NULL DEFAULT FALSE,
  voice_variant         TEXT NOT NULL DEFAULT 'en-US',
  playback_speed        NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT daily_goal_valid CHECK (daily_goal IN (2, 3, 5, 10)),
  CONSTRAINT playback_speed_valid CHECK (playback_speed BETWEEN 0.5 AND 2.0)
);

COMMENT ON TABLE user_settings IS 'Configurações personalizadas por usuário';
COMMENT ON COLUMN user_settings.daily_goal IS 'Frases por dia: 2 (tranquilo), 3 (moderado), 5 (recomendado), 10 (intensivo)';

-- ============================================================
-- STUDY_SESSIONS — Histórico de sessões de estudo
-- ============================================================
CREATE TABLE IF NOT EXISTS study_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id         UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  cards_studied   INTEGER NOT NULL DEFAULT 0,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,

  CONSTRAINT cards_studied_positive CHECK (cards_studied >= 0)
);

COMMENT ON TABLE study_sessions IS 'Sessões de estudo para streak e progresso';

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(user_id, started_at);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decks_updated_at
  BEFORE UPDATE ON decks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_card_progress_updated_at
  BEFORE UPDATE ON card_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- DECKS
CREATE POLICY "users_own_decks" ON decks
  FOR ALL USING (auth.uid() = user_id);

-- CARDS (acesso via deck do usuário)
CREATE POLICY "users_own_cards" ON cards
  FOR ALL USING (
    deck_id IN (SELECT id FROM decks WHERE user_id = auth.uid())
  );

-- CARD_PROGRESS
CREATE POLICY "users_own_progress" ON card_progress
  FOR ALL USING (auth.uid() = user_id);

-- USER_SETTINGS
CREATE POLICY "users_own_settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- STUDY_SESSIONS
CREATE POLICY "users_own_sessions" ON study_sessions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- SEED: Deck "1000 Frases Essenciais" (template global)
-- Inserido como deck de sistema — user_id será atribuído no app
-- ============================================================

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     TEXT PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migrations (version) VALUES ('001_initial_schema')
  ON CONFLICT (version) DO NOTHING;
