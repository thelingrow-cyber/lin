-- ============================================================
-- Lingrow — ROLLBACK da migration 007_learning_profile
-- Remove as 3 colunas do perfil de aprendizado e os constraints.
-- Perda de dados: goal/level_selfreport/onboarding_version coletados
-- até o rollback são descartados (aceitável: dados de personalização,
-- recuperáveis num novo passe de onboarding).
-- ============================================================

ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS goal_valid;
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS level_selfreport_valid;

ALTER TABLE user_settings DROP COLUMN IF EXISTS goal;
ALTER TABLE user_settings DROP COLUMN IF EXISTS level_selfreport;
ALTER TABLE user_settings DROP COLUMN IF EXISTS onboarding_version;

DELETE FROM schema_migrations WHERE version = '007_learning_profile';
