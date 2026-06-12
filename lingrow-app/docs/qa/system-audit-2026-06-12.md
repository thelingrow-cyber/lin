# Auditoria de Sistema — Lingrow (completa)

| Campo | Valor |
|-------|-------|
| Auditor | @qa (Quinn) · Fable 5 |
| Data | 2026-06-12 |
| Escopo | App inteiro: store/SRS, telas, motor de IA, banco de produção, contagens |
| Método | Análise de código (caminho crítico completo) + queries de auditoria no banco de produção |
| Veredito | **CONCERNS** — epic de IA aprovado; 2 bugs latentes CRÍTICO/ALTO pré-existentes a corrigir antes do release 1.0.4 |

---

## 🔴 A1 — CRÍTICO: O programa de 1000 frases quebra na frase 401

**Evidência (banco de produção):**
- Tabela `cards` contém apenas as frases built-in de posição **1 a 400** (seed antigo, incompleto).
- `card_progress` tem FK `card_id → cards(id)` (recriada na migração 003) — **exige** que o card exista na tabela.
- As frases 401-1000 existem **só no código do app** (`data/sentences.ts`) — nunca foram para o banco.

**Consequência:** ao responder a frase 401, `saveProgress` viola a FK → `study/[deckId].tsx:117` mostra alert com erro técnico cru → o card **nunca avança** → o programa-promessa do app morre aos 40%, em beco sem saída permanente.

**Urgência real:** usuário mais avançado está na frase **41** (max em produção). No ritmo de 5/dia: ~2,5 meses até o primeiro usuário bater. Bomba com timer, não incêndio.

**Correção recomendada (decisão de @architect/@data-engineer):**
- (a) **Remover a FK de `card_progress.card_id`** — alinha o schema à arquitetura atual (cards built-in são virtuais/client-side por design). Trade-off: perde-se o CASCADE de progresso ao deletar card custom (irrelevante: não existe UI de deletar card). **Recomendada** — migração 005 de 2 linhas + rollback.
- (b) Seed das 600 frases restantes na tabela — perpetua estrutura legada de dono único (ver A2). Não recomendada.

## 🟠 A2 — ALTO: Deck-1000 fantasma na conta do fundador (dupla contagem)

**Evidência:** a tabela `decks` tem **1 linha** `deck-1000-frases` cujo dono é `thelingrow@gmail.com` (resquício do seed antigo).

**Consequência (só nessa conta):** `getDecks()` devolve o deck-1000 → a aba Revisar monta `[DECK_1000 (client), deck-1000 (DB)]` → **mesmo id duas vezes** → due do built-in **contado em dobro** no total + chaves React duplicadas + deck aparece duplicado. Na home, o stat "Decks" conta o 1000 e "Meus Decks" o lista junto do card do programa.

**Correção:** deletar a linha legada (`DELETE FROM decks WHERE id='deck-1000-frases'`) **após** resolver A1 — com a FK atual, o CASCADE de `cards` (400 linhas) → `card_progress` **apagaria progresso de usuários**. Ordem obrigatória: A1 (drop FK) → limpar `cards` builtin → deletar deck. Tudo numa migração única e ensaiada.

## 🟡 A3 — MÉDIO: "5 frases por dia" é na verdade "5 por sessão"

`getStudySession` corta cards novos em `dailyGoal` **por chamada**, sem registrar quantos novos o usuário já viu **no dia**. Estudar 2× no mesmo dia = 10 novas. Infla a curva de revisões futuras e quebra a promessa pedagógica do ritmo. Correção: persistir contador diário de novas (ex. em `user_settings`/`study_sessions`) e descontar.

## 🟡 A4 — MÉDIO (introduzido ontem, `cbd0224`): usuário novo pula o modal de meta

Com o card do programa sempre visível, os botões dele levam **direto** ao estudo — usuário novo nunca vê o modal "quantas frases por dia?" (fica o default 5). Correção pequena: card do programa também passar por `startStudy()` quando `learnedCount === 0`.

## 🟢 Menores / informativos

| # | Severidade | Achado |
|---|-----------|--------|
| A5 | BAIXO | Param `deckId` "gruda" na aba Criar: a cada foco, re-seleciona o deck do parâmetro antigo, sobrepondo escolha manual do usuário |
| A6 | BAIXO | `refund_ai_generation` atualiza `updated_at` → anti-burst pune 15s mesmo após falha reembolsada |
| A7 | INFO | Home e Revisar contam TODOS os cards novos de decks custom no "Para Revisar" (deck IA de 20 → +20). Consistente entre telas; decisão de produto, não bug — mas pode assustar |
| A8 | INFO | 2 erros TS pré-existentes (expo-web-browser, auth.tsx) + 6 pacotes expo desatualizados (warnings no start) |
| A9 | SEGURANÇA | Token `sbp_` e `ANTHROPIC_API_KEY` transitaram pelo chat → **rotacionar ambos antes do release**. Remover usuário QA `qa.ia.test.lingrow@gmail.com` de produção |

## ✅ O que foi auditado e está SÓLIDO

- **Motor de IA:** quota atômica race-safe, refund em falha, kill switch server-side, chave só no servidor, validação dupla de output, prompt-injection mitigado. Validado vivo em produção (6/7 cenários).
- **Fluxo Caminho A/B:** stateless por design — IA nunca escreve em `decks`/`cards`; tela de revisão entre gerar e salvar; `saveCards` com erro propagado (hardening aplicado).
- **Fix da contagem (`dd33f6a`):** lógica home ↔ Revisar consistente entre si (exceto caso A2, que é dado legado, não código).
- **SRS (`computeNextReview`):** regras coerentes (again/hard/good/easy, penalidades e acelerações), sem ilogicidades.
- **Streak:** correto para os casos dia-seguinte/quebra/mesmo-dia.

## Gate do Epic IA (stories IA-1.1, IA-2.1/3.1)

**CONCERNS** — o trabalho do epic em si **passa** (nenhum achado crítico é causado por ele; A4 é ajuste de 3 linhas). Condições para o release 1.0.4: corrigir **A1, A2, A4** (e idealmente A3). A5/A6 podem ir para backlog.

### Plano de correção sugerido (ordem)

1. **@data-engineer:** migração 005 — drop FK `card_progress_card_id_fkey` + limpeza dos 400 cards builtin órfãos + delete do deck-1000 legado (transação única, rollback escrito, ensaiada com SELECT antes)
2. **@dev:** A4 (card do programa → `startStudy()` p/ usuário novo) + A3 (contador diário de novas) + A5 se couber
3. **@devops:** rotacionar token sbp_ + API key, remover usuário QA, PRs e merge

— Quinn, guardião da qualidade 🛡️
