-- ============================================================
-- Lingrow — RevenueCat Entitlements & Premium RLS Hardening
-- Migration: 006_revenuecat_entitlements.sql
-- Epic: ia-monetizacao (Fase 5) | Plano: docs/stories/fase-5-paywall-plano.md
--       Preço/formato: docs/monetization-strategy-2026-07.md (v2.0)
-- 100% ADITIVA nas colunas. A parte não-aditiva é a policy de UPDATE
-- (substitui "users_own_settings" por uma versão que protege os campos
-- de entitlement — ver seção 2).
-- Rollback: supabase/rollbacks/006_revenuecat_entitlements_rollback.sql
-- ============================================================

-- ============================================================
-- 1. USER_SETTINGS — colunas do RevenueCat (aditivas)
-- ============================================================
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS revenuecat_customer_id TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'free';

ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS subscription_status_valid;
ALTER TABLE user_settings ADD CONSTRAINT subscription_status_valid
  CHECK (subscription_status IN ('free', 'trial', 'active', 'expired', 'cancelled'));

COMMENT ON COLUMN user_settings.revenuecat_customer_id IS 'App User ID do RevenueCat — vincula a assinatura ao usuário Supabase.';
COMMENT ON COLUMN user_settings.subscription_status IS 'Estado da assinatura, espelhado pelo webhook RevenueCat. "free" é o estado inicial de todo usuário.';

-- ============================================================
-- 2. RLS — bloquear o cliente de escrever nos campos de entitlement
--    (achado: technical-debt-assessment-2026-07.md §6 — o cliente hoje
--    consegue se auto-promover a premium via upsert na própria linha.
--    A fonte da verdade passa a ser EXCLUSIVAMENTE o webhook, que roda
--    como service role e portanto ignora RLS.)
-- ============================================================

DROP POLICY IF EXISTS "users_own_settings" ON user_settings;

-- Leitura: cliente continua lendo a própria linha inteira (precisa ver
-- is_premium/subscription_status para liberar UI de feature).
CREATE POLICY "users_read_own_settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

-- Inserção: só a própria linha, e SEM poder nascer premium.
CREATE POLICY "users_insert_own_settings" ON user_settings
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND is_premium = FALSE
    AND subscription_status = 'free'
  );

-- Atualização: só a própria linha, e os campos de entitlement precisam
-- permanecer EXATAMENTE como já estavam (não dá pra mudar via UPDATE do
-- cliente). O trigger abaixo é a garantia real; o WITH CHECK aqui é a
-- primeira barreira.
CREATE POLICY "users_update_own_settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 3. Trigger — defesa em profundidade contra o próprio Postgres
--    (o WITH CHECK acima não consegue comparar "valor antigo vs novo"
--    fora de um trigger; sem isso, um upsert do cliente ainda conseguiria
--    setar is_premium=true numa linha existente).
-- ============================================================
CREATE OR REPLACE FUNCTION protect_premium_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Triggers disparam independente de RLS — inclusive para conexões com a
  -- service_role key (que bypassa RLS, mas não bypassa trigger). Por isso
  -- o webhook precisa ser identificado pelo ROLE de Postgres da conexão
  -- (current_user), não por claim de JWT: o client do Supabase autenticado
  -- com a service role key conecta literalmente como o role `service_role`.
  IF current_user = 'service_role' THEN
    RETURN NEW;
  END IF;

  NEW.is_premium := OLD.is_premium;
  NEW.premium_expires_at := OLD.premium_expires_at;
  NEW.subscription_status := OLD.subscription_status;
  NEW.revenuecat_customer_id := OLD.revenuecat_customer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION protect_premium_columns() IS 'Reverte qualquer tentativa do cliente de alterar campos de entitlement num UPDATE. Service role (webhook RevenueCat) passa direto.';

DROP TRIGGER IF EXISTS trg_protect_premium_columns ON user_settings;
CREATE TRIGGER trg_protect_premium_columns
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION protect_premium_columns();

-- ============================================================
-- 4. APP_CONFIG — seeds do paywall (nasce seguro/desligado)
-- ============================================================
INSERT INTO app_config (key, value) VALUES ('paywall_enabled', 'false')
  ON CONFLICT (key) DO NOTHING;
INSERT INTO app_config (key, value) VALUES ('revenuecat_webhook_secret', '')
  ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE app_config IS 'Flags remotas (kill switch sem novo build). ai_enabled controla a feature de IA; paywall_enabled controla a exibição da tela de assinatura — ambas checadas no app E na Edge Function correspondente.';

-- ============================================================
-- 5. Version tracking
-- ============================================================
INSERT INTO schema_migrations (version) VALUES ('006_revenuecat_entitlements')
  ON CONFLICT (version) DO NOTHING;
