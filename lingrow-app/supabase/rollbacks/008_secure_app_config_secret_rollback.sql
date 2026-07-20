-- ============================================================
-- ROLLBACK de 008_secure_app_config_secret.sql
-- Restaura a policy aberta USING (true) da migration 004.
-- ATENÇÃO: rodar isto REABRE o vazamento do segredo do webhook
-- (S1, crítico). Só usar se app_config voltar a conter apenas dados
-- não sensíveis. Executar manualmente apenas se necessário.
-- ============================================================

BEGIN;

DROP POLICY IF EXISTS "authenticated_read_app_config" ON app_config;
CREATE POLICY "authenticated_read_app_config" ON app_config
  FOR SELECT TO authenticated USING (true);

DELETE FROM schema_migrations WHERE version = '008_secure_app_config_secret';

COMMIT;
