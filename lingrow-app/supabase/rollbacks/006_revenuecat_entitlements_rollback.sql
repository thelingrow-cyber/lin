-- ============================================================
-- ROLLBACK de 006_revenuecat_entitlements.sql
-- Reverte TUDO que a 006 criou. Restaura a policy "users_own_settings"
-- (FOR ALL) que existia antes — ou seja, o rollback também REABRE a
-- brecha de segurança corrigida pela 006. Só rodar se o RevenueCat
-- estiver sendo abandonado por completo.
-- Executar manualmente apenas se necessário (não fica em migrations/
-- para o CLI não aplicá-lo automaticamente).
-- ============================================================

BEGIN;

-- 5. Trigger de proteção
DROP TRIGGER IF EXISTS trg_protect_premium_columns ON user_settings;
DROP FUNCTION IF EXISTS protect_premium_columns();

-- 4. Policies novas
DROP POLICY IF EXISTS "users_read_own_settings" ON user_settings;
DROP POLICY IF EXISTS "users_insert_own_settings" ON user_settings;
DROP POLICY IF EXISTS "users_update_own_settings" ON user_settings;

-- Restaura a policy original da migração 001
CREATE POLICY "users_own_settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- 3. app_config seeds (só remove se ninguém mais depender deles)
DELETE FROM app_config WHERE key = 'paywall_enabled';
DELETE FROM app_config WHERE key = 'revenuecat_webhook_secret';

-- 2. Constraint
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS subscription_status_valid;

-- 1. Colunas
ALTER TABLE user_settings DROP COLUMN IF EXISTS revenuecat_customer_id;
ALTER TABLE user_settings DROP COLUMN IF EXISTS subscription_status;

-- 6. Version tracking
DELETE FROM schema_migrations WHERE version = '006_revenuecat_entitlements';

COMMIT;
