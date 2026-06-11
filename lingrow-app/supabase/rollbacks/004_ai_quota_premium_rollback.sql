-- ============================================================
-- ROLLBACK de 004_ai_quota_premium.sql
-- Reverte TUDO que a 004 criou. Não toca em nada anterior à 004.
-- Executar manualmente apenas se necessário (não fica em migrations/
-- para o CLI não aplicá-lo automaticamente).
-- ============================================================

BEGIN;

-- 5. Funções de quota
DROP FUNCTION IF EXISTS consume_ai_generation(UUID, INTEGER);
DROP FUNCTION IF EXISTS refund_ai_generation(UUID);
DROP FUNCTION IF EXISTS record_ai_cards(UUID, INTEGER);

-- 4. Policies (caem junto com as tabelas, mas explícito é melhor que implícito)
DROP POLICY IF EXISTS "users_read_own_ai_usage" ON ai_usage;
DROP POLICY IF EXISTS "authenticated_read_app_config" ON app_config;

-- 3. app_config
DROP TRIGGER IF EXISTS trg_app_config_updated_at ON app_config;
DROP TABLE IF EXISTS app_config;

-- 2. Colunas premium em user_settings (aditivas na 004 → removíveis com segurança)
ALTER TABLE user_settings DROP COLUMN IF EXISTS is_premium;
ALTER TABLE user_settings DROP COLUMN IF EXISTS premium_expires_at;

-- 1. ai_usage
DROP TRIGGER IF EXISTS trg_ai_usage_updated_at ON ai_usage;
DROP TABLE IF EXISTS ai_usage;

-- 6. Version tracking
DELETE FROM schema_migrations WHERE version = '004_ai_quota_premium';

COMMIT;
