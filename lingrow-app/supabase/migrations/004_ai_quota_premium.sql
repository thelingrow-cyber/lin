-- ============================================================
-- Lingrow — AI Quota, Premium Flags & App Config
-- Migration: 004_ai_quota_premium.sql
-- Epic: ia-monetizacao (Fase 0) | Design: docs/architecture/ai-deck-creator-architecture.md
-- 100% ADITIVA: apenas CREATE TABLE / ADD COLUMN. Nenhuma alteração no que existe.
-- Rollback: 004_ai_quota_premium_rollback.sql
-- ============================================================

-- ============================================================
-- 1. AI_USAGE — consumo de gerações de IA por usuário/mês
--    Escrita: SOMENTE service role (Edge Function). Cliente: leitura própria.
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_usage (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month              TEXT NOT NULL,                -- 'YYYY-MM' (UTC)
  generations_used   INTEGER NOT NULL DEFAULT 0,
  cards_generated    INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, month),
  CONSTRAINT ai_usage_month_format CHECK (month ~ '^\d{4}-\d{2}$'),
  CONSTRAINT ai_usage_generations_positive CHECK (generations_used >= 0),
  CONSTRAINT ai_usage_cards_positive CHECK (cards_generated >= 0)
);

COMMENT ON TABLE ai_usage IS 'Consumo mensal de gerações de IA por usuário. Escrita exclusiva da Edge Function (service role); cliente apenas lê o próprio uso.';
COMMENT ON COLUMN ai_usage.month IS 'Mês de referência em UTC, formato YYYY-MM. Quota zera trocando o mês (nova linha).';
COMMENT ON COLUMN ai_usage.generations_used IS 'Gerações consumidas no mês. Conta na geração (momento do custo), não no salvamento. Falha técnica é reembolsada via refund_ai_generation().';

-- O UNIQUE(user_id, month) já cria o índice da consulta quente (uso do mês corrente).

CREATE TRIGGER trg_ai_usage_updated_at
  BEFORE UPDATE ON ai_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. USER_SETTINGS — flags premium (colunas aditivas)
--    Fonte da verdade na Fase 5: webhook RevenueCat. Até lá: default FALSE.
-- ============================================================
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;

COMMENT ON COLUMN user_settings.is_premium IS 'Entitlement premium ativo. Atualizado pelo webhook RevenueCat (Fase 5). Edge Function valida também premium_expires_at.';
COMMENT ON COLUMN user_settings.premium_expires_at IS 'Expiração do entitlement (trial/assinatura). NULL = sem expiração registrada.';

-- ============================================================
-- 3. APP_CONFIG — feature flags / kill switch
--    Leitura: qualquer autenticado. Escrita: somente service role.
-- ============================================================
CREATE TABLE IF NOT EXISTS app_config (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE app_config IS 'Flags remotas (kill switch sem novo build). ai_enabled controla a feature de IA — checada no app E na Edge Function.';

CREATE TRIGGER trg_app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed: IA nasce DESLIGADA (estado seguro). Liga-se via dashboard quando a Fase 2 estiver no ar.
INSERT INTO app_config (key, value) VALUES ('ai_enabled', 'false')
  ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 4. RLS — cliente lê, nunca escreve
-- ============================================================
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- ai_usage: usuário enxerga apenas o próprio consumo (para exibir "✨ X restantes").
-- Sem policies de INSERT/UPDATE/DELETE → escrita só via service role (bypassa RLS).
DROP POLICY IF EXISTS "users_read_own_ai_usage" ON ai_usage;
CREATE POLICY "users_read_own_ai_usage" ON ai_usage
  FOR SELECT USING (auth.uid() = user_id);

-- app_config: leitura para autenticados; escrita só service role.
DROP POLICY IF EXISTS "authenticated_read_app_config" ON app_config;
CREATE POLICY "authenticated_read_app_config" ON app_config
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- 5. FUNÇÕES ATÔMICAS DE QUOTA (chamadas pela Edge Function, service role)
--    Reserva-antes / reembolso-se-falhar. Race-safe: limite checado no
--    mesmo statement do incremento — concorrência não fura a quota.
-- ============================================================

-- Reserva 1 geração se houver saldo. Retorna o total usado após reserva,
-- ou NULL se a quota estourou (nada é alterado nesse caso).
CREATE OR REPLACE FUNCTION consume_ai_generation(p_user_id UUID, p_limit INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_used INTEGER;
BEGIN
  INSERT INTO ai_usage (user_id, month, generations_used)
  VALUES (p_user_id, to_char(now() AT TIME ZONE 'utc', 'YYYY-MM'), 1)
  ON CONFLICT (user_id, month) DO UPDATE
    SET generations_used = ai_usage.generations_used + 1
    WHERE ai_usage.generations_used < p_limit
  RETURNING generations_used INTO v_used;

  RETURN v_used;  -- NULL ⇒ quota excedida (UPDATE não aplicado)
END;
$$;

COMMENT ON FUNCTION consume_ai_generation(UUID, INTEGER) IS 'Reserva atômica de 1 geração de IA. NULL = quota excedida. Chamar ANTES da Claude API.';

-- Devolve 1 geração (falha técnica da IA — 5xx). Nunca fica negativo.
CREATE OR REPLACE FUNCTION refund_ai_generation(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE ai_usage
  SET generations_used = GREATEST(0, generations_used - 1)
  WHERE user_id = p_user_id
    AND month = to_char(now() AT TIME ZONE 'utc', 'YYYY-MM');
END;
$$;

COMMENT ON FUNCTION refund_ai_generation(UUID) IS 'Reembolsa 1 geração após falha técnica da IA. Falha de rede/modelo não pune o usuário.';

-- Registra quantos cards a geração bem-sucedida produziu (telemetria de custo).
CREATE OR REPLACE FUNCTION record_ai_cards(p_user_id UUID, p_cards INTEGER)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE ai_usage
  SET cards_generated = cards_generated + GREATEST(0, p_cards)
  WHERE user_id = p_user_id
    AND month = to_char(now() AT TIME ZONE 'utc', 'YYYY-MM');
END;
$$;

COMMENT ON FUNCTION record_ai_cards(UUID, INTEGER) IS 'Telemetria: total de cards gerados no mês (calibração de custo).';

-- Defesa em profundidade: revoga execução das funções de quota para clientes.
-- (Edge Function usa service role, que não é afetada.)
REVOKE EXECUTE ON FUNCTION consume_ai_generation(UUID, INTEGER) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION refund_ai_generation(UUID) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION record_ai_cards(UUID, INTEGER) FROM anon, authenticated;

-- ============================================================
-- 6. Version tracking
-- ============================================================
INSERT INTO schema_migrations (version) VALUES ('004_ai_quota_premium')
  ON CONFLICT (version) DO NOTHING;
