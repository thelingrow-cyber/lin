# Story IA-1.1 — Motor de IA: Edge Function `generate-cards` + cliente `generateCards()`

| Campo | Valor |
|-------|-------|
| Epic | `ia-monetizacao` — Fase 1 (`docs/stories/epic-ia-monetizacao.md`) |
| Status | Ready |
| Prioridade | Alta (bloqueia Fases 2-5) |
| Complexidade | M — 5 pontos (função + cliente + migração + testes manuais; sem UI) |
| Autor | @sm (River) |
| Data | 2026-06-11 |
| Arquitetura | `docs/architecture/ai-deck-creator-architecture.md` (LER ANTES DE CODAR) |
| Branch sugerida | `feature/ia-1.1-motor` |

---

## Story

**Como** app Lingrow,
**quero** uma Edge Function que gere flashcards EN/PT via Claude API com quota controlada no servidor,
**para que** as telas das Fases 2-3 tenham um motor pronto, seguro e testado — sem nenhuma UI ainda.

## Contexto

- Fase 0 concluída: arquitetura aprovada + migração `004_ai_quota_premium.sql` **escrita mas NÃO aplicada**.
- Esta story é **só o motor**: Edge Function + função cliente tipada. Nenhuma tela.
- Decisão central da arquitetura: a função é **stateless** — NUNCA escreve em `decks`/`cards`. Quem salva é o cliente (nas Fases 2-3), pelo caminho existente.

## Critérios de Aceite

- [ ] **AC1 — Migração aplicada com segurança:** snapshot do schema criado ANTES; `004_ai_quota_premium.sql` aplicada; tabelas `ai_usage` e `app_config` existem; funções `consume_ai_generation`, `refund_ai_generation`, `record_ai_cards` existem; flag `ai_enabled` = `'false'`.
- [ ] **AC2 — Auth obrigatória:** requisição sem JWT válido → `401`. Com JWT válido → prossegue.
- [ ] **AC3 — Kill switch:** com `app_config.ai_enabled = 'false'` → `403 { error: 'feature_disabled' }`. Com `'true'` → prossegue. (Checado NO SERVIDOR, não só no app.)
- [ ] **AC4 — Validação de input:** `theme` vazio ou > 100 chars → `422`; `count` fora de 1..teto do tier → clampado (não erro); `level` fora do enum → default `intermediate`.
- [ ] **AC5 — Quota atômica:** free (is_premium=false): 3 gerações/mês, máx 5 cards; premium: 20/mês, máx 20 cards. Quota excedida → `429 { error: 'quota_exceeded', usage }` SEM chamar a Claude API. Reserva via `consume_ai_generation` ANTES da chamada à IA.
- [ ] **AC6 — Geração válida:** sucesso → `200` com `cards[]` no schema exato (`front`, `back`, `keyword`, `keywordPt`, `notes?`) + `usage { used, limit, month }`. JSON validado no servidor antes de devolver.
- [ ] **AC7 — Falha técnica reembolsa:** Claude API falha (timeout/5xx/JSON inválido após retry) → `502` E `refund_ai_generation` chamado (quota devolvida).
- [ ] **AC8 — Caminho B suportado:** `deckContext { name, sampleFronts[] }` opcional influencia o prompt (cards coerentes com o deck existente).
- [ ] **AC9 — Cliente tipado:** `lib/ai.ts` exporta `generateCards(params): Promise<GenerateResult>` usando `supabase.functions.invoke`, com erros tipados (`quota_exceeded`, `feature_disabled`, `network`, `generation_failed`). NENHUM arquivo existente modificado.
- [ ] **AC10 — Zero escrita em tabelas core:** a função não contém NENHUM acesso a `decks`/`cards` (verificável por inspeção).
- [ ] **AC11 — Qualidade:** `npx tsc --noEmit` limpo nos arquivos novos; teste manual da função via `supabase functions serve` documentado no Dev Notes (casos: 401, 403, 422, 429, 200, 502).

## Tasks

- [ ] T1 (@dev): Snapshot do schema + aplicar migração 004 (`supabase db push`) + verificar objetos criados — ⚠️ BLOQUEADO: CLI não instalado/linkado (ver Dev Agent Record)
- [ ] T2 (@dev): Configurar secrets: `ANTHROPIC_API_KEY`, `AI_MODEL_ID=claude-haiku-4-5` (⚠️ pedir a key ao fundador — nunca commitar)
- [x] T3 (@dev): Implementar `supabase/functions/generate-cards/index.ts` (fluxo: JWT → flag → input → tier → quota → Claude (tool use/JSON schema) → validar → record_ai_cards → 200; falha → refund → 502)
- [x] T4 (@dev): Implementar `lib/ai.ts` (tipos + `generateCards()` + mapeamento de erros)
- [ ] T5 (@dev): Testar os 6 cenários de resposta e registrar evidência no story (depende de T1+T2)
- [ ] T6 (@qa): Gate da Fase 1 — validar AC1-AC11 + confirmar zero mudança em arquivos existentes

## Dev Notes (contrato — não inventar além disto)

**Request:** `POST /functions/v1/generate-cards` — `{ theme: string≤100, count: number, level?: 'basic'|'intermediate'|'advanced', deckContext?: { name: string, sampleFronts: string[]≤5 } }`

**Limites por tier (constantes na função, lidos de env se existir):** FREE `{ gen: 3, cards: 5 }` · PREMIUM `{ gen: 20, cards: 20 }`. Tier vem de `user_settings.is_premium && (premium_expires_at IS NULL OR > now())` — ler via service role.

**Prompt (diretriz):** system prompt controlado por nós; tema do usuário entra como DADO. Instruir: inglês natural americano, tradução PT-BR correta, keyword = palavra-chave da frase, notes = dica curta de uso em PT. `max_tokens` limitado. Saída via tool use com JSON schema — nunca texto livre.

**Anti-burst:** rejeitar se última geração do usuário < 15s (usar `ai_usage.updated_at`) → `429 { error: 'too_many_requests' }`.

**IDs:** a função NÃO gera IDs — cliente gera ao salvar (Fase 2): `card-ai-{ts}-{i}`.

## O QUE NÃO TOCAR (mapa de risco — arquitetura §6)

`store/lingrow.ts` (nada nesta fase — hardening do saveCards é story da Fase 2) · `data/sentences.ts`/DECK_1000 · `(tabs)/index.tsx`, `revisar.tsx` · `lib/supabase.ts` · qualquer coluna/tabela existente.

## File List (esperado — só arquivos NOVOS)

- `lingrow-app/supabase/functions/generate-cards/index.ts`
- `lingrow-app/mobile-new/lib/ai.ts`
- (já escritos na Fase 0: migração 004 + rollback)

## CodeRabbit Integration

- **Tipo:** Feature (backend crítico) | **Foco:** secrets exposure, validação de input, RLS bypass, error handling
- **Gate:** severidade CRITICAL bloqueia; HIGH corrige ou documenta (máx 2 iterações self-healing)

## Dev Agent Record

**Agent Model Used:** Fable 5 (claude-fable-5)
**Branch:** `feature/ia-1.1-motor` (criada a partir de `fix/revisar-1000-count-banner`)

### Completion Notes

- T3 ✅ `supabase/functions/generate-cards/index.ts` — fluxo completo dos ACs 2-8 e 10: JWT (401) → kill switch server-side (403) → validação/clamp de input (422) → tier free/premium c/ expiração → anti-burst 15s (429) → quota atômica via `consume_ai_generation` (429 sem chamar a IA) → Claude API com tool use/JSON schema forçado + validação server-side do output → `refund_ai_generation` em falha (502) → `record_ai_cards` best-effort → 200. Limites por tier em env vars (calibráveis sem deploy). Zero acesso a `decks`/`cards`.
- T4 ✅ `mobile-new/lib/ai.ts` — `generateCards()` tipado, `AiError` com códigos (`quota_exceeded`, `feature_disabled`, `too_many_requests`, `generation_failed`, `network`, ...), `usage`/`retryAfterSeconds` propagados, + `getAiUsage()` p/ exibir quota (leitura via RLS). Nenhum arquivo existente modificado (AC9).
- Typecheck: apenas os 2 erros pré-existentes do projeto (expo-web-browser, context/auth.tsx) — `lib/ai.ts` adiciona zero erros (AC11 parcial ok).

### Debug Log / Bloqueios

- **T1 bloqueado:** Supabase CLI não instalado e projeto não linkado (`supabase/config.toml` ausente). Migrações 001-003 aparentam ter sido aplicadas via Dashboard. Caminho proposto: `npx supabase login` (interativo, fundador) → `npx supabase link --project-ref ireppvpjhtapnekmucam` → `npx supabase db push`. Alternativa: colar a 004 no SQL Editor do Dashboard.
- **T2 bloqueado:** aguarda `ANTHROPIC_API_KEY` do fundador (console.anthropic.com). Depois: `npx supabase secrets set` + `npx supabase functions deploy generate-cards`.
- **T5:** sem Docker p/ `functions serve` local — plano: testar contra a função deployada (flag `ai_enabled` começa `false`; ligar temporariamente p/ cenários 200/429/502 antes do beta, função sem UI = sem exposição a usuários).

## Change Log

| Data | Quem | O quê |
|------|------|-------|
| 2026-06-11 | @sm (River) | Story criada a partir da arquitetura Fase 0 |
| 2026-06-11 | @po (Pax) | Validação 9/10 → GO. Estimativa M (5 pts) adicionada. Status Draft → Ready |
