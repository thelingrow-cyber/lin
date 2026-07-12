-- ============================================================
-- Lingrow — Learning Profile (onboarding que converte)
-- Migration: 007_learning_profile.sql
-- Epic: E2 (onboarding-conversao) | Story: E2.1 | PRD: prd-v2.md FR-A1
-- 100% ADITIVA: 3 colunas NULLable em user_settings. Usuários
-- existentes ficam com NULL (não passaram pelo onboarding novo).
-- As colunas NÃO são de entitlement — o trigger da 006
-- (protect_premium_columns) não as toca, e as policies de RLS da 006
-- (leitura/escrita da própria linha) já as cobrem.
-- Rollback: supabase/rollbacks/007_learning_profile_rollback.sql
-- ============================================================

-- ============================================================
-- 1. USER_SETTINGS — perfil de aprendizado (aditivas)
-- ============================================================
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS goal TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS level_selfreport TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS onboarding_version TEXT;

ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS goal_valid;
ALTER TABLE user_settings ADD CONSTRAINT goal_valid
  CHECK (goal IS NULL OR goal IN ('work', 'travel', 'study', 'abroad', 'self'));

ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS level_selfreport_valid;
ALTER TABLE user_settings ADD CONSTRAINT level_selfreport_valid
  CHECK (level_selfreport IS NULL OR level_selfreport IN ('zero', 'stuck', 'fluency'));

COMMENT ON COLUMN user_settings.goal IS 'Objetivo declarado no onboarding (FR-A1a): work|travel|study|abroad|self. NULL = usuário anterior ao onboarding v2.';
COMMENT ON COLUMN user_settings.level_selfreport IS 'Autoavaliação de nível no onboarding (FR-A1b): zero|stuck|fluency. NULL = usuário anterior ao onboarding v2.';
COMMENT ON COLUMN user_settings.onboarding_version IS 'Versão do fluxo de onboarding que o usuário completou (para A/B e coortes de funil).';

-- ============================================================
-- 2. Version tracking
-- ============================================================
INSERT INTO schema_migrations (version) VALUES ('007_learning_profile')
  ON CONFLICT (version) DO NOTHING;
