-- ============================================================
-- Lingrow — Fix A1/A2 da auditoria de sistema (2026-06-12)
-- Migration: 005_fix_builtin_fk_and_legacy_cleanup.sql
-- Auditoria: docs/qa/system-audit-2026-06-12.md
--
-- A1 (CRÍTICO): cards built-in são VIRTUAIS (vivem em data/sentences.ts,
--   por design). A FK card_progress.card_id → cards(id) exigia presença
--   na tabela — mas só as posições 1-400 foram seedadas numa era antiga.
--   Resultado: progresso da frase 401+ é REJEITADO → programa quebra.
--   Fix: remover a FK. O app é o dono do ciclo de vida dos cards built-in.
--
-- A2 (ALTO): o seed antigo deixou 1 deck 'deck-1000-frases' (dono:
--   conta do fundador) + 400 cards órfãos na tabela. Na conta dele,
--   a aba Revisar duplica o deck e conta o due em dobro.
--   Fix: limpar as linhas legadas (com backup restaurável).
--
-- GARANTIA: card_progress (258 linhas, progresso real de usuários)
--   NÃO é tocado. A ordem importa: FK cai ANTES dos DELETEs — com a
--   FK de pé, o CASCADE dos cards apagaria 246 linhas de progresso.
-- Rollback: supabase/rollbacks/005_fix_builtin_fk_and_legacy_cleanup_rollback.sql
-- ============================================================

-- 0. Backup das linhas legadas — restauráveis pelo rollback.
--    RLS ligada sem policies = invisível para clientes (PostgREST).
CREATE TABLE IF NOT EXISTS _legacy_backup_005_cards AS
  SELECT * FROM cards WHERE id LIKE 'card-builtin-%';
CREATE TABLE IF NOT EXISTS _legacy_backup_005_decks AS
  SELECT * FROM decks WHERE id = 'deck-1000-frases';

ALTER TABLE _legacy_backup_005_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE _legacy_backup_005_decks ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE _legacy_backup_005_cards IS 'Backup da migração 005 (400 cards built-in do seed antigo). Remover após 1 ciclo de release estável (>= 1.0.5).';
COMMENT ON TABLE _legacy_backup_005_decks IS 'Backup da migração 005 (deck-1000-frases legado). Remover após 1 ciclo de release estável (>= 1.0.5).';

-- 1. A1 — remover a FK que rejeita progresso de cards virtuais.
--    (PRIMEIRO, obrigatoriamente: impede o CASCADE do passo 2 de
--     apagar o progresso built-in dos usuários.)
ALTER TABLE card_progress DROP CONSTRAINT IF EXISTS card_progress_card_id_fkey;

COMMENT ON COLUMN card_progress.card_id IS 'ID do card (TEXT). SEM FK por design: cards built-in (card-builtin-N) são virtuais — vivem no bundle do app (data/sentences.ts), nunca na tabela cards. Integridade dos cards custom é responsabilidade do app.';

-- 2. A2 — limpeza das linhas legadas do seed antigo.
DELETE FROM cards WHERE id LIKE 'card-builtin-%';
DELETE FROM decks WHERE id = 'deck-1000-frases';

-- 3. Version tracking
INSERT INTO schema_migrations (version) VALUES ('005_fix_builtin_fk_and_legacy_cleanup')
  ON CONFLICT (version) DO NOTHING;
