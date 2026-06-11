# Story IA-2.1 — Caminho A: Criar deck com IA (tela de entrada + revisão + salvar)

| Campo | Valor |
|-------|-------|
| Epic | `ia-monetizacao` — Fase 2 (`docs/stories/epic-ia-monetizacao.md`) |
| Status | Ready |
| Prioridade | Alta |
| Complexidade | L — 8 pontos (2 fases de tela + estados de erro + hardening + regressão crítica) |
| Autor | @sm (River) |
| Data | 2026-06-11 |
| UX de referência | `docs/features/ai-deck-creator.md` §3-§5 (OBRIGATÓRIO ler) |
| Motor (pronto) | `mobile-new/lib/ai.ts` — `generateCards()`, `AiError`, `getAiUsage()` |
| Branch | `feature/ia-2.1-caminho-a` (a partir de `feature/ia-1.1-motor`) |
| Exigência do fundador | **Melhor UI possível** — barra de qualidade = telas existentes ou acima |

---

## Story

**Como** usuário do Lingrow,
**quero** descrever um tema (ou tocar num atalho) e receber um deck pronto gerado por IA, revisando os cards antes de salvar,
**para que** eu tenha conteúdo novo de estudo sem criar nada do zero.

## Contexto

- Motor (Fase 1) está em produção atrás do kill switch `ai_enabled=false` — **a UI pode ir para produção desligada com segurança**: o botão só aparece com a flag ligada.
- Esta story é SÓ o Caminho A (entrada pela home). Caminho B (dentro do deck) é a Fase 3.
- Decisão de UX fechada: **uma tela com 3 fases internas** (entrada → gerando → revisão) — evita passar a lista de cards entre rotas e o "voltar" da revisão preserva o estado.

## UX obrigatório (do conceito — não inventar além)

**Fase ENTRADA:**
- Campo de tema (máx 100 chars, multiline curto) com placeholder "Ex.: inglês para viagem"
- 4 chips-atalho que PREENCHEM o campo (não gerem direto): ✈️ Viagem · 💼 Reunião de negócios · 🍽️ Pedir em restaurante · 💬 Entrevista de emprego
- Botão primário "Gerar" (roxo `colors.primary`)
- Linha de quota discreta: "✨ {restantes} gerações restantes este mês" (via `getAiUsage`; free=3/premium=20 espelhados como constantes de exibição — o servidor é quem manda)
- SEM seletor de nível e SEM seletor de quantidade (decisão de produto)

**Fase GERANDO:** loading com microcopy encorajador ("Criando seu deck…"), sem travar a UI, sem botão Gerar duplo-clicável.

**Fase REVISÃO:**
- Header: tema + contagem ("8 cards gerados")
- Lista de cards: frente EN visível, **toque vira o card** (mostra verso PT + keyword destacada + nota) — mesma linguagem visual do estudo
- Por card: editar (frente/verso/nota inline ou modal) e excluir
- Campo "Nome do deck" pré-preenchido com o tema (editável)
- Botão primário "Salvar deck ({n} cards)" · secundário "Descartar"
- Descartar/voltar = nada salvo (geração já contou — não mostrar mensagem de estorno)

**Estados de erro (AiError.code → UX):**
| code | UX |
|------|----|
| `quota_exceeded` | Mensagem amigável + uso atual ("3 de 3 usadas") + placeholder de CTA premium (Fase 4 liga) |
| `too_many_requests` | "Aguarde {retryAfterSeconds}s" com contagem regressiva no botão |
| `generation_failed` | "A IA não conseguiu gerar — tente de novo (não contou na sua cota)" |
| `network` | "Sem conexão. Verifique a internet e tente novamente." |
| `feature_disabled` | tela nem deveria estar acessível — voltar à home silenciosamente |

## Critérios de Aceite

- [ ] AC1: Home exibe botão "✨ Criar deck com IA" ao lado de "Novo Deck" **somente quando** `app_config.ai_enabled === 'true'` (lido 1x ao focar a home, cacheado em estado; flag off → botão ausente, zero impacto visual).
- [ ] AC2: Rota nova `app/ai-create.tsx` com as 3 fases acima, fiel ao UX obrigatório.
- [ ] AC3: Chips preenchem o campo (substituem o texto), não disparam geração.
- [ ] AC4: Gerar chama `generateCards({ theme })` — **omitir `count`: o servidor aplica o teto do tier automaticamente**; sucesso → fase revisão com os drafts; todos os estados de erro mapeados conforme tabela.
- [ ] AC5: Na revisão: virar card (animação consistente com o app), editar frente/verso/nota, excluir card (mín. 1 card para salvar).
- [ ] AC6: Salvar cria deck `deck-ai-{Date.now()}` via `saveDeck()` + cards `card-ai-{ts}-{i}` com `position` sequencial via `saveCards()`, navega para `/deck/[deckId]` e mostra confirmação.
- [ ] AC7: O deck salvo aparece na home e na aba Revisar **pela lógica existente, sem nenhuma alteração nela** (deck de IA = deck custom comum).
- [ ] AC8 (hardening pré-mapeado na arquitetura): `saveCards()` passa a **verificar o `error` de cada lote** e lançar exceção — falha de gravação nunca mais é silenciosa. Falha ao salvar → drafts permanecem na tela de revisão + aviso de retry.
- [ ] AC9 — REGRESSÃO (gate da fase): contagem home/Revisar do DECK_1000 + decks custom intacta; fluxo "Novo Deck" manual intacto; `criar.tsx` intacto; typecheck sem erros novos.
- [ ] AC10 — Qualidade visual: roxo `colors.primary`, `fonts` do design system, espaçamentos/sombras consistentes com `index.tsx`/`criar.tsx`. Nada de verde do mockup.

## Tasks

- [x] T1 (@dev): Branch `feature/ia-2.1-caminho-a` + hardening de `saveCards()` (AC8 — mudança mínima e isolada em `store/lingrow.ts`, NADA além do check de erro)
- [x] T2 (@dev): Helper de flag: `isAiEnabled()` + `isPremiumUser()` + `AI_DISPLAY_LIMITS` em `lib/ai.ts` — usados no botão da home e na linha de quota (AC1)
- [x] T3 (@dev): `app/ai-create.tsx` fase ENTRADA (campo, chips, quota, Gerar) — AC2/AC3
- [x] T4 (@dev): Integração `generateCards` + fase GERANDO + todos os estados de erro (incl. countdown anti-burst) — AC4
- [x] T5 (@dev): Fase REVISÃO (flip, editar inline, excluir c/ guarda mín. 1, nome do deck pré-preenchido) — AC5
- [x] T6 (@dev): Salvar (`deck-ai-{ts}` + `card-ai-{ts}-{i}` posição sequencial, navegação p/ deck, confirmação) — AC6/AC7
- [ ] T7 (@dev): Typecheck ✅ (zero erros novos) + análise de regressão a nível de código ✅; smoke test no dispositivo (Expo Go) PENDENTE — executar junto com T8
- [ ] T8 (@qa): Gate da Fase 2 — AC1-AC10 com foco em AC7/AC9 (contagem)

## O QUE NÃO TOCAR

Lógica de contagem em `index.tsx`/`revisar.tsx` (o botão novo na home é puramente aditivo) · `DECK_1000`/`data/sentences.ts` · SRS/`getStudySession` · `lib/supabase.ts` · `criar.tsx` (fluxo manual continua como está).

## File List (esperado)

- NOVO: `mobile-new/app/ai-create.tsx`
- MODIFICADO: `mobile-new/lib/ai.ts` (+ `isAiEnabled()`)
- MODIFICADO: `mobile-new/store/lingrow.ts` (APENAS hardening do `saveCards`)
- MODIFICADO: `mobile-new/app/(tabs)/index.tsx` (APENAS o botão condicional + estilo)
- MODIFICADO: `mobile-new/app/_layout.tsx` (registrar rota, se necessário)

## Dev Agent Record

**Agent Model Used:** Fable 5 (claude-fable-5) — exigência do fundador p/ UI
**Branch:** `feature/ia-2.1-caminho-a`

### Completion Notes

- Tela única com state machine de 3 fases (`input → generating → review`) — voltar da revisão preserva drafts; cancelar descarta sem salvar.
- **100% tokens do design system** (`colors`/`fonts`/`radius`/`shadow`/`spacing` de `@/theme`) — zero hex solto; gradiente primary→primaryLight idêntico aos CTAs da home; sombras `shadow.card`/`shadow.soft`.
- Todos os 6 estados de erro mapeados, incl. countdown regressivo no botão (`too_many_requests`) e mensagem de quota com placeholder premium.
- Botão "✨ Criar com IA" na home: gradiente, condicionado a `isAiEnabled()` (falha de leitura ⇒ oculto). Em produção a flag está `false` ⇒ **este código pode ir pra produção invisível e inofensivo**.
- Hardening `saveCards`: check de `error` por lote (3 linhas) — falha de gravação agora propaga; na tela, drafts permanecem para retry.
- Mudanças em `index.tsx` puramente aditivas: 1 import, 1 estado, 1 efeito, 1 bloco JSX, 2 estilos. Lógica de contagem INTOCADA (verificado por diff).
- Typecheck: zero erros novos (apenas os 2 pré-existentes do projeto). Cast `as Href` na rota nova (tipo gerado no próximo `expo start`).
- CodeRabbit self-healing: adiado para o gate @qa (review full mode) — registrado para não passar batido.

### Pendência honesta

Smoke test em dispositivo (Expo Go) não executado nesta máquina — flag off em produção impede teste E2E real até a ANTHROPIC_API_KEY existir. Plano: na chegada da key → ligar flag → fundador testa no Expo Go (roteiro no T8/@qa).

## CodeRabbit Integration

- **Tipo:** Feature (UI crítica + 1 mudança em store) | **Foco:** regressão de contagem, error handling de salvamento, estado de loading duplo-submit
- **Gate:** CRITICAL bloqueia; HIGH corrige ou documenta (máx 2 iterações)

## Change Log

| Data | Quem | O quê |
|------|------|-------|
| 2026-06-11 | @sm (River) | Story criada (Fase 2 — Caminho A) com UX do conceito embutido |
| 2026-06-11 | @po (Pax) | Validação 10/10 → GO. AC4 simplificado (count omitido, servidor aplica teto). Draft → Ready |
