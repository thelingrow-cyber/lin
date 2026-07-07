# Épico E5 — Motor de Aprendizado: FSRS + Decks da Vida Real

| Campo | Valor |
|-------|-------|
| Release | **1.2 "Percepção"** (junto com E4) |
| Origem | `prd-v2.md` Bloco E (FR-E1..E3) · Movimento 3 da tese (`vision-top1-flashcard-idiomas.md`) · roadmap FSRS (`project_lingrow_v2_roadmap`) |
| Por quê | O mercado SRS já migrou de SM-2 (1987) para FSRS (~20-30% menos revisões para a mesma retenção — é literalmente "menos tempo, mesmo resultado", e vira argumento de marketing: "o algoritmo do Anki moderno"). Movimento 3 transforma o gerador de IA de "tema curto" em "SEU mundo vira deck" — diferencial que nem Anki nem Duolingo podem copiar |
| Dependências | Nenhuma dura. FR-E3 (rótulos reais) depende da migração FSRS desta própria épica |
| Estimativa | 4 stories · ~2 semanas |

## Contexto para quem implementa

- SRS atual: `computeNextReview()` em `store/lingrow.ts` (SM-2 adaptado, MAX_INTERVAL_DAYS=3650, testado em `store/lingrow.test.ts`).
- Estado por card em `card_progress`: repetitions, ease_factor, interval_days, last_review, next_review, consecutive_again, consecutive_easy.
- FSRS: pacote **`ts-fsrs`** (MIT, TypeScript puro, mantido pela comunidade open-spaced-repetition). Estado FSRS: stability, difficulty, state (New/Learning/Review/Relearning), due, lapses, reps.
- Kill switch remoto: padrão `app_config` já existente (`ai_enabled`, `paywall_enabled`) — replicar como `srs_engine`.
- Edge function IA: `supabase/functions/generate-cards/index.ts` (tool-use schema, quota atômica) — o Movimento 3 ESTENDE, não substitui.

---

## Story E5.1 — Migration 008 + estado FSRS dual

**Como** sistema, **quero** armazenar o estado FSRS ao lado do SM-2 **para que** a migração seja reversível e comparável.

### Critérios de aceite
1. Migration `008_fsrs_state.sql` ADITIVA: colunas em `card_progress`: `fsrs_stability REAL`, `fsrs_difficulty REAL`, `fsrs_state SMALLINT`, `fsrs_due TIMESTAMPTZ`, `fsrs_lapses INT` — todas NULLable. Rollback script correspondente.
2. Seed em `app_config`: `('srs_engine', 'sm2')` — FSRS nasce DESLIGADO.
3. Conversão inicial (lazy, no cliente): primeiro review de um card sem estado FSRS converte SM-2→FSRS na hora, com heurística documentada: stability ≈ interval_days atual; difficulty ≈ mapeamento de ease_factor (2.5→5.0 neutro, faixa 1.3-4.0 → 8.5-2.0 linear); state = Review se repetitions>0. (Referência: guia de migração do próprio FSRS; documentar a fórmula exata em comentário.)
4. `saveProgress` grava AMBOS os estados (SM-2 continua atualizando mesmo com FSRS ativo — é o que torna o rollback seguro de verdade).
5. Testes: conversão de 5 perfis de card (novo, maduro, difícil, lapso, teto).

### Tasks
- [ ] Migration 008 + rollback + aplicar em produção
- [ ] `lib/srs/fsrs-adapter.ts` (conversão + tipos)
- [ ] saveProgress dual-write
- [ ] Testes de conversão

---

## Story E5.2 — Agendador FSRS atrás de flag (FR-E1)

**Como** usuário, **quero** revisar menos vezes com a mesma retenção **para que** meus 10 minutos rendam mais.

### Critérios de aceite
1. `ts-fsrs` integrado: `lib/srs/engine.ts` expõe `scheduleNext(progress, answer)` que despacha para SM-2 ou FSRS conforme `app_config.srs_engine` (cache local da flag, TTL 1h, fallback sm2 sem rede).
2. Mapeamento de respostas: again→Again, hard→Hard, good→Good, easy→Easy (rating nativo do FSRS). Parâmetros default do FSRS-5; `request_retention: 0.90`.
3. Teto de intervalo mantido (MAX_INTERVAL_DAYS=3650) — a lição da auditoria não se perde no motor novo.
4. `getStudySession` usa `fsrs_due` quando engine=fsrs (cards convertidos) e `next_review` para os demais — sessão mista funciona.
5. Suite de regressão: TODOS os testes SM-2 atuais passam (engine=sm2); suite nova FSRS (novo card, sequências good/easy, lapso, conversão mid-life).
6. Rollout: ligar `srs_engine=fsrs` primeiro só na conta do fundador (flag por config global — para piloto, usar build local com override) → 1 semana de uso real → ligar globalmente.
7. Rollback: `srs_engine=sm2` no banco reverte TODOS os clientes em ≤ 1h sem novo build; SM-2 continuou atualizando (E5.1.4), então nada se perde.

### Tasks
- [ ] ts-fsrs + engine dispatcher + flag remota
- [ ] getStudySession dual-due
- [ ] Suites de teste (regressão + FSRS)
- [ ] Piloto fundador → rollout global

---

## Story E5.3 — Rótulos de intervalo reais (FR-E3)

**Como** usuário, **quero** que os botões digam o intervalo REAL ("Fácil → 12 dias") **para que** eu entenda e confie no agendador (resolve L2 das auditorias técnica e UX).

### Critérios de aceite
1. Cada botão SRS mostra o intervalo que SERÁ aplicado, calculado pelo engine vigente para o card atual: "< 1 min" (again), "{n}d" ou "{n}sem"/"{n}mês" formatado humanizado.
2. Cálculo memoizado por card (4 chamadas de preview do engine, sem custo perceptível).
3. Formatador humanizado testado (1d, 6d, 2sem, 3mês).
4. Acessibility labels dos botões atualizados com o intervalo.

### Tasks
- [ ] Preview de intervalo no engine
- [ ] UI + formatador + testes

---

## Story E5.4 — Deck do SEU mundo (Movimento 3) (FR-E2)

**Como** Mateus, **quero** colar a vaga de emprego que estou disputando (ou um e-mail, ou uma letra de música) **para que** meu deck seja sobre a MINHA vida — não um currículo genérico.

### Critérios de aceite
1. Tela "Criar com IA" ganha um segundo modo (tabs no topo: "Tema" | "Meu texto"): textarea para colar até 4000 caracteres, com placeholder-exemplo ("Cole uma vaga de emprego, um e-mail, uma letra de música…") e 3 chips de exemplo que preenchem demo.
2. Edge function `generate-cards` estendida (parâmetro `sourceText` opcional, mutuamente exclusivo com tema longo): prompt extrai o vocabulário/frases de maior valor DIDÁTICO do texto (não tradução literal do texto inteiro), gera cards no formato padrão, `deckName` sugerido a partir do contexto ("Vaga: Product Manager"). Mesmo tool schema de saída, mesma quota, mesmos limites, `sourceText` tratado como DADO (mitigação de prompt injection existente cobre — validar com teste de injection).
3. Kill switch e clamps: `sourceText` ≤ 4000 chars server-side; free tier segue clampado (5 cards) — o modo texto é isca de conversão premium natural (20 cards de uma vaga real É o momento uau).
4. Tela de revisão existente reutilizada sem mudança.
5. Testes em produção: vaga de emprego real (PT com termos EN), letra de música, e-mail corporativo, texto de injection ("ignore instructions...").
6. Deploy com teste curl imediato (regra aprendida do BOOT_ERROR — ver `project_ai_deck_creator`).
7. Eventos: `ai_generate` ganha `mode: theme|text`, `source_length`.

### Tasks
- [ ] UI modo "Meu texto"
- [ ] Edge function: sourceText + prompt de extração + clamps
- [ ] Testes de injection + 3 cenários reais em prod
- [ ] Analytics + paywall link no clamp do free

---

## Gate do épico

- [ ] FSRS: piloto de 1 semana na conta do fundador sem anomalias (intervalos sane, nada trava) ANTES do rollout global
- [ ] Rollback testado de verdade (ligar fsrs → responder cards → voltar sm2 → agendamentos íntegros)
- [ ] @qa: injection tests no modo texto; quota não burlável via sourceText
- [ ] Marketing pode anunciar: "o algoritmo dos apps de memorização mais avançados do mundo" (FSRS) — coordenar com content engine

— Orion, orquestrando o sistema 🎯
