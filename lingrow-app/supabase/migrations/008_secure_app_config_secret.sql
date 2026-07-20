-- ============================================================
-- Lingrow — Fecha vazamento do segredo do webhook via RLS
-- Migration: 008_secure_app_config_secret.sql
-- Achado: auditoria de segurança 2026-07-19 (S1, CRÍTICO).
--
-- A migration 004 criou a policy "authenticated_read_app_config" com
-- USING (true): QUALQUER usuário autenticado lê TODAS as linhas de
-- app_config. Na época a tabela só continha 'ai_enabled' (não sensível).
-- A migration 006 então inseriu 'revenuecat_webhook_secret' NA MESMA
-- tabela — passando a expor o segredo do webhook a qualquer usuário
-- logado (basta `select * from app_config` com a anon key + JWT).
--
-- Com esse segredo, um atacante forja um POST no webhook público
-- (revenuecat-webhook), que roda como service role, e concede is_premium
-- a QUALQUER user_id (fraude de assinatura) ou eleva o próprio tier de
-- quota de IA — gastando a ANTHROPIC_API_KEY do fundador.
--
-- Correção: a leitura do cliente passa a ser restrita às DUAS flags que o
-- app realmente lê (ai_enabled, paywall_enabled). O webhook continua lendo
-- o segredo normalmente porque conecta como service_role, que bypassa RLS.
--
-- 100% compatível com o app atual:
--   lib/ai.ts::isAiEnabled()       -> lê 'ai_enabled'      (permitido)
--   lib/premium.ts::isPaywallEnabled() -> lê 'paywall_enabled' (permitido)
-- Rollback: supabase/rollbacks/008_secure_app_config_secret_rollback.sql
-- ============================================================

-- Whitelist explícita: só as flags públicas ficam legíveis pelo cliente.
-- Qualquer chave nova sensível (segredos, tokens) fica invisível por
-- padrão — o cliente só enxerga o que for adicionado a esta lista de propósito.
DROP POLICY IF EXISTS "authenticated_read_app_config" ON app_config;
CREATE POLICY "authenticated_read_app_config" ON app_config
  FOR SELECT TO authenticated
  USING (key IN ('ai_enabled', 'paywall_enabled'));

COMMENT ON POLICY "authenticated_read_app_config" ON app_config IS
  'Cliente lê apenas as flags públicas (kill switches). Segredos como revenuecat_webhook_secret NUNCA são expostos — o webhook os lê via service role, que bypassa RLS. Ver migration 008.';

-- Version tracking
INSERT INTO schema_migrations (version) VALUES ('008_secure_app_config_secret')
  ON CONFLICT (version) DO NOTHING;
