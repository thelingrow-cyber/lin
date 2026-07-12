# Épico E2 — Onboarding que Converte (Day-0)

| Campo | Valor |
|-------|-------|
| Release | **1.0.5 "Receita"** — PRIMEIRO épico a executar |
| Origem | `prd-v2.md` Bloco A (FR-A1..A5) · `ceo-review-2026-07.md` §5.4, §7 |
| Por quê | ~50% das conversões pagas acontecem no Day 0 (RevenueCat 2026). O onboarding atual (3 slides genéricos) desperdiça todo download |
| Dependências | Nenhuma de código. Paywall já existe (`app/paywall.tsx`). Usa o conteúdo atual (400 frases) — NÃO espera E1 |
| Regras anti-quebra | Herda as 6 regras do `epic-ia-monetizacao.md`: tudo aditivo, QA gate, regressão contagem+auth, migrações reversíveis |
| Estimativa | 4 stories · ~1-2 semanas |

## Contexto para quem implementa (leia antes)

- Onboarding atual: `app/onboarding.tsx` (3 slides FlatList, sem coleta). Será SUBSTITUÍDO.
- Modal de meta diária atual: vive na home (`(tabs)/index.tsx`) — será ABSORVIDO pelo onboarding (cuidado com A4 da auditoria QA: usuário novo não pode pular a definição de meta).
- Persistência de settings: `saveSettings()` em `store/lingrow.ts` — upsert parcial, já hardened.
- Não existe coluna para objetivo/nível em `user_settings` — precisa migration ADITIVA (007).
- Tom de voz: `docs/marketing/brand-positioning.md` §7 — direto, sem infantilização. Todos os textos deste épico JÁ ESTÃO ESPECIFICADOS nas stories; não inventar variações.
- Analytics: padrão existente em `lib/analytics.ts` (PostHog) — seguir naming `snake_case` dos eventos atuais.

---

## Story E2.1 — Migration 007: perfil de aprendizado

**Como** sistema, **quero** persistir objetivo, nível e origem do usuário **para que** personalização e analytics funcionem entre dispositivos.

### Critérios de aceite
1. Migration `007_learning_profile.sql` ADITIVA: colunas em `user_settings`: `goal TEXT` (check: `work|travel|study|abroad|self`), `level_selfreport TEXT` (check: `zero|stuck|fluency`), `onboarding_version TEXT` (para A/B futuro). Todas NULLable (usuários existentes não têm).
2. Rollback script em `supabase/rollbacks/007_learning_profile_rollback.sql`.
3. RLS: colunas seguem as policies existentes de `user_settings` (leitura própria; escrita própria EXCETO campos de entitlement — o trigger 006 não deve ser afetado).
4. `getSettings`/`saveSettings` em `store/lingrow.ts` estendidos com os novos campos (opcionais, upsert parcial mantido).
5. Teste: salvar/ler goal+level roundtrip em `store/lingrow.test.ts`.

### Tasks
- [x] Escrever migration 007 + rollback
- [x] Aplicar em produção — 2026-07-12, via SQL Editor do Dashboard no projeto `ireppvpjhtapnekmucam` ("Success. No rows returned")
- [x] Estender types + getSettings/saveSettings
- [x] Teste unitário roundtrip (3 testes: defaults, roundtrip, upsert parcial)

---

## Story E2.2 — Novo onboarding: 4 passos, 1 toque cada

**Como** Mateus (novo usuário), **quero** que o app me pergunte o que eu quero e onde estou **para que** a primeira experiência seja sobre MIM, não um tour genérico.

### Especificação de telas (textos finais, não alterar sem @po)

**Passo 0 — Promessa (substitui os 3 slides):**
> Título: "Inglês que não some."
> Sub: "Aqui, o que você aprende fica. O app garante — cientificamente."
> CTA: "Começar"

**Passo 1 — Objetivo (FR-A1a):** "O que o inglês vai destravar pra você?"
> Opções (cards com ícone, 1 toque avança): 💼 Trabalho e carreira · ✈️ Viagem · 🎓 Estudos e provas · 🌍 Morar fora · 💪 Por mim mesmo

**Passo 2 — Nível (FR-A1b):** "Onde você está hoje? (sem julgamento — o método funciona em qualquer ponto)"
> Opções: 🌱 Começando do zero · 😤 Entendo, mas travo na hora de usar · 🚀 Já me viro — quero chegar na fluência

**Passo 3 — Meta (FR-A1c):** "Quanto cabe no seu dia?"
> Opções: 5 frases (~3 min) · 10 frases (~6 min) · 15 frases (~9 min)
> Nota sob as opções: "Constância vence intensidade. Dá pra mudar depois."

### Critérios de aceite
1. Cada passo = 1 tela, 1 toque avança (sem botão "próximo" nos passos 1-3), voltar disponível, barra de progresso fina no topo.
2. Respostas salvas via `saveSettings({ goal, levelSelfreport, dailyGoal, onboardingDone: true })` ao FINAL (não por passo — falha de rede no meio não pode deixar perfil pela metade).
3. O modal de meta da home NÃO aparece mais para quem completou este onboarding (mas continua existindo para usuários antigos sem meta — não remover).
4. Falha de rede ao salvar: prossegue para o app (não prende o usuário), retry silencioso na próxima abertura (padrão do `finish()` atual).
5. Acessibilidade: cada opção com `accessibilityLabel` completo; navegável com leitor de tela.
6. Typecheck + lint + testes passam; nenhuma regressão no fluxo de usuário existente (onboardingDone=true pula tudo, como hoje).

### Tasks
- [x] Reescrever `app/onboarding.tsx` (4 passos, estado local, textos exatos acima)
- [x] Remover trigger do modal de meta para novos usuários (manter para legados — condição `onboardingVersion` na home)
- [x] Analytics por passo (onboarding_started/step_completed/completed com onboarding_version)
- [ ] QA manual no Expo Go (fluxo novo + fluxo usuário existente)

---

## Story E2.3 — Primeira sessão personalizada + tela-semente do patrimônio

**Como** novo usuário, **quero** estudar minhas primeiras 5 frases IMEDIATAMENTE após o onboarding **para que** eu sinta o valor antes de qualquer tela de navegação ("aha em 60 segundos").

### Critérios de aceite
1. Ao completar o passo 3, navegar DIRETO para `study/[deckId]` do deck 1000 com sessão de 5 frases (não para a home).
2. Seleção das 5 frases por `level_selfreport` (com o conteúdo ATUAL de 400 frases): `zero` → posições 1-5; `stuck` → 150-154; `fluency` → 300-304. (Mapeamento simples; o placement test real chega com E1/FR-B4 — registrar posições puladas como não-vistas, sem marcar progresso.)
3. Ao final da sessão de 5, exibir **tela-semente** (nova, `app/first-session-done.tsx`):
   > "5 frases suas. ✅"
   > "O Lingrow agenda a revisão de cada uma no momento exato antes de você esquecer. Amanhã eu te chamo pra primeira."
   > CTA: "Conhecer meu espaço" → home.
4. A tela-semente pede permissão de notificação NESTE momento (contexto máximo — acabou de ser prometido um lembrete), usando o fluxo existente de `lib/notifications.ts`.
5. Progresso das 5 frases salvo normalmente via `saveProgress` (SRS real desde o primeiro toque).
6. Usuário que fecha o app no meio: próxima abertura vai para a home normal (sem loop de onboarding).

### Tasks
- [x] Parametrizar sessão de estudo para aceitar `sessionSize` + `startPosition` via params (`StudySessionOptions` + `FIRST_SESSION_START`)
- [x] Criar `app/first-session-done.tsx` com textos exatos
- [x] Mover pedido de permissão de notificação para a tela-semente
- [x] Testes de regressão: sessão normal do deck 1000 intacta (4 testes novos; 19/19 verdes)

---

## Story E2.4 — Paywall Day-0 + funil instrumentado

**Como** negócio, **quero** apresentar o trial no momento de maior valor percebido do primeiro dia **para que** a conversão Day-0 aconteça sem sujar a experiência free.

### Critérios de aceite
1. Após a tela-semente (CTA "Conhecer meu espaço"), ANTES da home, exibir o paywall existente (`app/paywall.tsx`) 1 única vez, com botão de fechar visível no topo (guideline Apple).
2. O paywall ganha um header contextual quando vem do onboarding: "Você plantou 5 frases hoje. O Premium acelera o resto." (prop `context="onboarding"`; layout atual preservado nos demais contextos).
3. Nunca mais reapresentar automaticamente no Day 0 (persistir flag local `paywall_d0_shown`).
4. Eventos PostHog (FR-A5), todos com `onboarding_version`: `onboarding_started`, `onboarding_step_completed` (step, choice), `onboarding_completed` (goal, level, daily_goal), `first_session_started`, `first_session_completed`, `seed_screen_viewed`, `notification_permission_result` (granted), `paywall_viewed` (context), `trial_started`, `paywall_dismissed`.
5. Funil verificável no PostHog: cada evento aparece em sequência num teste real de ponta a ponta (Expo Go).
6. Gate de release 1.0.5: fluxo completo signup→onboarding→sessão→semente→paywall→home testado em sandbox com compra de trial funcionando.

### Tasks
- [x] Prop `context` no paywall + header condicional (sair do paywall Day-0 leva à home; demais contextos intactos)
- [x] Flag local `paywall_d0_shown` (`lib/flags.ts`)
- [x] Todos os eventos em `lib/analytics.ts` (funil completo: onboarding → plano → 1ª sessão → semente → paywall)
- [ ] Teste E2E manual completo + screenshot do funil no PostHog ⏳ depende do setup RevenueCat/ASC

---

## Gate do épico (antes de 1.0.5 ir para a Apple)

- [ ] @qa: fluxo novo E fluxo de usuário existente sem regressão (contagem 1000, streak, revisões, IA)
- [ ] Onboarding completion > 70% em teste com ≥ 5 pessoas reais (amigos/beta)
- [ ] Setup externo completo (App Store Connect + RevenueCat + webhook secret + migration 006 + deploy functions) — SEM isso o botão de compra falha no review da Apple (rejeição automática; ver `project_lingrow_beta_state`)
- [ ] Push @devops + PR + build EAS 1.0.5

— Orion, orquestrando o sistema 🎯
