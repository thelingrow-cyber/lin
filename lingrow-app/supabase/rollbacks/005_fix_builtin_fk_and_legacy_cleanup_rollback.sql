-- ============================================================
-- ROLLBACK de 005_fix_builtin_fk_and_legacy_cleanup.sql
-- Restaura as linhas legadas a partir dos backups embutidos.
--
-- ⚠️ ASSIMETRIA HONESTA: a FK original NÃO pode ser revalidada —
-- existem (por design) linhas de progresso de cards built-in que a
-- violam; era exatamente esse o bug A1. O mais próximo do estado
-- anterior é recriá-la como NOT VALID (vale só p/ escritas futuras).
-- Executar manualmente apenas se necessário.
-- ============================================================

BEGIN;

-- 2. Restaurar linhas legadas (deck antes dos cards: FK cards→decks)
INSERT INTO decks SELECT * FROM _legacy_backup_005_decks
  ON CONFLICT (id) DO NOTHING;
INSERT INTO cards SELECT * FROM _legacy_backup_005_cards
  ON CONFLICT (id) DO NOTHING;

-- 1. Recriar a FK como NOT VALID (não valida linhas existentes)
ALTER TABLE card_progress
  ADD CONSTRAINT card_progress_card_id_fkey
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
  NOT VALID;

-- 3. Version tracking
DELETE FROM schema_migrations WHERE version = '005_fix_builtin_fk_and_legacy_cleanup';

COMMIT;
