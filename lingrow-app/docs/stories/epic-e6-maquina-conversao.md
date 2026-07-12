# Épico E6 — Máquina de Conversão: Do Primeiro Pixel na Loja ao Winback

| Campo | Valor |
|-------|-------|
| Release | **Distribuído**: E6.1 + E6.5 → 1.0.5 "Receita" · E6.2 + E6.3 + E6.4 → 1.1 "Retenção" · E6.6 → 1.2 "Percepção" |
| Origem | `conversion-audit-2026-07.md` (GAPs 1-6) · `prd-v2.md` Bloco F (FR-F1..F6) |
| Por quê | E1-E5 constroem o produto que converte; E6 fecha as bordas do funil que nenhum épico cobre: o momento de síntese do onboarding (padrão Prequel/Noom), a página da loja, os 14 dias do trial, a produção de prova social e o winback |
| Dependências | E6.1 integra o stepper do E2.2 (implementar juntos ou logo após). E6.5 depende de E2+E6.1 prontos (screenshots mostram o app novo). E6.3/E6.4 dependem de paywall ativo e momentos felizes (E1.5/E3) |
| Regras anti-quebra | Herda as 6 regras do `epic-ia-monetizacao.md`. Regra própria: NENHUMA superfície de conversão bloqueia funcionalidade free — o free continua sendo o melhor flashcard grátis do Brasil |
| Estimativa | 6 stories · E6.1+E6.5 ~1 semana (dentro da janela da 1.0.5) · restante ~2 semanas diluídas |

## Contexto para quem implementa (leia antes)

- Paywall: `app/paywall.tsx` — lógica RevenueCat/compliance intocável; ganha prop `source` (E6.2) além do `context` do E2.4.
- Portas atuais do paywall (as ÚNICAS): `ai-create.tsx:541`, `ai-create.tsx:564`, `meu-ingles.tsx:91` + pós-onboarding (E2.4).
- Dados do quiz: `goal`, `level_selfreport`, `dailyGoal` — salvos pelo E2.2 via `saveSettings` (migration 007).
- Patrimônio: `lib/patrimony.ts` chega com E3.1; até lá, E6.1 usa apenas dados do quiz (não inventa números).
- Trial: estado via RevenueCat `customerInfo` (`usePremium` em `lib/premium.ts`) — período do trial e data de expiração vêm do entitlement.
- Notificações: `lib/notifications.ts`, regra máx 1/dia é ABSOLUTA (coordenação com E3.5: prioridade definida na E6.3).
- Tom de voz: `docs/marketing/brand-positioning.md` §7. Textos deste épico são FINAIS (mudança só via @po).
- Analytics: `lib/analytics.ts` (PostHog), eventos `snake_case`.

---

## Story E6.1 — "Montando seu plano": a tela de síntese do onboarding (FR-F1) 🎯 Release 1.0.5

**Como** Mateus (novo usuário que acabou de responder 3 perguntas), **quero** VER o app transformar minhas respostas num plano meu **para que** eu sinta que o que vem a seguir foi feito para mim — e não que as perguntas foram burocracia.

### Posição no fluxo

```
E2.2 passo 3 (meta) → [E6.1 análise + plano] → E2.3 primeira sessão
```

A navegação do E2.3 ("ao completar o passo 3, navegar DIRETO para study") passa a ser: passo 3 → tela E6.1 → study. Nada mais do E2 muda.

### Especificação da tela (textos finais)

**Fase 1 — Análise (2 a 2,5s, honesta):** fundo da marca, três linhas que se confirmam em sequência (checkmark animado, ~700ms cada):
> "Analisando seu objetivo…" ✓
> "Calibrando seu ponto de partida…" ✓
> "Agendando suas revisões…" ✓

Cada linha corresponde a algo REAL que o app faz com as respostas (goal → capítulo/frases iniciais, level → posição de início da E2.3, meta → agendamento). Nenhuma etapa fake tipo "consultando 10.000 estudos". Tap em qualquer lugar pula a animação. `reduce motion` → mostra as 3 linhas já confirmadas por 800ms e segue.

**Fase 2 — O plano (mesma tela, transição suave):**
> Título: **"Seu plano está pronto."**
> Card do plano (visual de documento/card com o monograma):
> — 🎯 {headline por objetivo} — work: "Inglês para carreira" · travel: "Inglês para o mundo" · study: "Inglês para provas" · abroad: "Inglês para viver fora" · self: "Inglês para você"
> — 📍 Ponto de partida: {por nível} — zero: "Do começo, do jeito certo" · stuck: "Direto no que destrava" · fluency: "Rumo à fluência"
> — 📅 {dailyGoal} frases por dia (~{dailyGoal×0,6 arredondado} min)
> — 📈 "No seu ritmo: ~{dailyGoal×30} frases suas em 30 dias. E elas não somem."
> CTA único: **"Começar agora"** → segue o fluxo do E2.3 (primeira sessão).

A projeção é aritmética transparente (dailyGoal × 30) — nada de estatística inventada (Artigo IV).

### Critérios de aceite
1. Tela nova `app/plan-reveal.tsx` inserida entre o passo 3 do onboarding e a primeira sessão; back desabilitado (plano não se "des-monta"); fluxo do E2.3 em diante intocado.
2. Conteúdo 100% derivado das respostas do quiz (goal/level/dailyGoal) — sem chamadas de rede novas; funciona offline.
3. Animação da fase 1 dura ≤ 2,5s, é pulável por tap, e respeita `reduce motion` (NFR7).
4. Acessibilidade: leitor de tela anuncia as etapas e o plano completo; CTA com `accessibilityLabel`.
5. Eventos: `plan_reveal_viewed`, `plan_reveal_skipped_animation`, `plan_reveal_continue` (com goal, level, daily_goal, onboarding_version).
6. Métrica-gate: plan_reveal → primeira sessão ≥ 90% no funil PostHog (se a tela derrubar a passagem, ela sai — é hipótese instrumentada, não dogma).
7. Typecheck + lint + testes passam; fluxo de usuário existente (onboardingDone=true) intocado.

### Tasks
- [x] Tela `plan-reveal.tsx` (2 fases, textos exatos, reduce-motion)
- [x] Integração no stepper do E2.2 (handoff final para a sessão do E2.3 marcado como TODO no código — hoje navega para a home até E2.3 existir)
- [x] Analytics (plan_reveal_viewed/skipped_animation/continue) — montar o painel do funil no PostHog quando houver dados
- [ ] QA manual Expo Go: 5 combinações de goal/level, tap-skip, reduce-motion, offline

---

## Story E6.2 — Mapa de superfícies de conversão + source tracking (FR-F2) · Release 1.1

**Como** negócio, **quero** portas contextuais para o paywall nos lugares onde o valor acabou de ser sentido **para que** os 50% de conversões que acontecem DEPOIS do Day-0 tenham por onde entrar — sem virar spam.

### Mapa de superfícies (fechado — não expandir sem @po)

| # | Superfície | Quando aparece | Texto |
|---|-----------|----------------|-------|
| S1 | Card premium na home (dispensável) | Usuário free, ≥ 1 sessão concluída, ≥ 3 dias de uso. Dispensado → reaparece no máx. 1×/semana. Some para premium/trial | "Suas {owned} frases estão seguras. O Premium acelera o resto." CTA: "Conhecer" (usuário com patrimônio 0: não aparece) |
| S2 | Linha em Configurações | Sempre (free E premium) | Free: "Lingrow Premium →" · Trial: "Premium · trial até {data}" · Premium: "Premium · ativo" (gestão da assinatura) |
| S3 | Rodapé do resumo de fim de sessão | Só em sessão que completou MARCO (capítulo/50/100 frases), free, máx 1×/dia | linha discreta: "O Premium acelera o próximo capítulo →" |

**Regra global de frequência (inviolável):** no máximo **1 superfície proativa por dia** (S1 e S3 contam; S2 não — é passiva). Contador local em AsyncStorage. Anti-spam é posicionamento da marca.

### Critérios de aceite
1. `paywall.tsx` ganha prop `source` obrigatória; TODAS as portas existentes (ai-create ×2, meu-ingles, onboarding/E2.4) e novas (S1, S2, S3) passam `source` distinto; evento `paywall_viewed` sempre com source.
2. S1/S2/S3 implementadas conforme mapa; textos exatos; S1 usa `lib/patrimony.ts` (E3.1).
3. Regra de frequência testada (unit): 2ª superfície no mesmo dia não renderiza.
4. Premium/trial NUNCA vê S1/S3; S2 mostra o estado correto dos 3 casos.
5. Funil por source no PostHog: paywall_viewed → trial_started por origem, verificado com dados reais.
6. Regressão: nenhuma funcionalidade free bloqueada; navegação e contagens intactas.

### Tasks
- [ ] Prop `source` no paywall + retrofit das portas existentes
- [ ] Componente do card S1 + regras de exibição/dispensa
- [ ] S2 em Configurações (3 estados) · S3 no resumo de sessão
- [ ] Contador de frequência + testes
- [ ] Dashboard de funil por source no PostHog

---

## Story E6.3 — Jornada do trial: D0 → D14 sem caixa-preta (FR-F3) · Release 1.1

**Como** usuário em trial, **quero** ver o que estou ganhando e saber quando serei cobrado **para que** a decisão de pagar seja informada — e a cobrança nunca seja surpresa.

### Especificação (textos finais)

**Status visível:** linha S2 de Configurações (E6.2) + chip no topo de Meu Inglês: "Trial · termina {data}".

**D7 — recap de valor (notificação local, meio do trial):**
> Título: "1 semana de Premium: {n} frases suas."
> Corpo: "{retainedPct}% retidas. É assim que inglês fica. Restam 7 dias de trial."
> Só dispara se: permissão concedida + n ≥ 10 (sem valor real, sem notificação). Deep link → Meu Inglês.

**D12 — transparência de cobrança (notificação local, 2 dias antes):**
> Título: "Seu trial termina em 2 dias."
> Corpo: "Depois, {preço}/ano. Cancele em Ajustes se não for pra você — suas frases continuam suas no plano grátis."
> SEMPRE dispara (com permissão). Essa notificação é a marca em ação: a indústria lucra com o descuido; o Lingrow avisa.

**Fim de trial sem conversão:** na 1ª abertura após expirar, paywall re-apresentado 1 única vez, `source="trial_expired"`, header próprio:
> "Seu patrimônio continua seu. O Premium continua aqui."
> (fechar → volta ao free normal, sem nag; flag local `trial_expired_paywall_shown`)

**Prioridade de notificação (regra máx 1/dia):** D12 > D7 > notificação de conteúdo (E3.5). Num conflito de dia, a de maior prioridade agenda e a outra não.

### Critérios de aceite
1. Datas do trial derivadas do `customerInfo` do RevenueCat (expiração do entitlement); nenhuma data hardcoded; comportamento correto se o usuário converter no meio (notificações pendentes canceladas).
2. D7 e D12 agendadas como notificações locais no início do trial; regra de prioridade com E3.5 implementada e testada.
3. Re-apresentação pós-expiração 1× exata (flag local); free intocado depois.
4. Eventos: `trial_recap_scheduled/opened`, `trial_ending_notified/opened`, `paywall_viewed` (source=trial_expired).
5. Testes: trial→converte no D5 (cancela D7/D12), trial→expira (D7+D12+re-apresentação), sem permissão de notificação (nada quebra).
6. QA sandbox: ciclo completo com trial acelerado do sandbox Apple.

### Tasks
- [ ] Derivação de datas do trial via RevenueCat + agendamento D7/D12
- [ ] Regra de prioridade de notificações (coordenar com E3.5)
- [ ] Chip de status + re-apresentação pós-expiração
- [ ] Analytics + testes + QA sandbox

---

## Story E6.4 — Produção de prova social: pedido de avaliação nos momentos felizes (FR-F4) · Release 1.1

**Como** produto, **quero** pedir avaliação na loja exatamente quando o usuário acabou de vencer algo **para que** a página da loja acumule a prova social que converte os próximos downloads.

### Gatilhos (fechados) e gating

| Gatilho | Condição |
|---------|----------|
| Fim de capítulo (E1.5) | A partir do 2º capítulo completado |
| Marco de patrimônio (E3.3) | 50 ou 100 frases |
| Recuperação completa (E3.2) | Sessão de recuperação concluída com sucesso |

**Gating (inviolável):** máx 1 pedido a cada 60 dias (persistido); nunca no mesmo dia de um paywall dismissado; nunca após erro; a Apple limita a 3×/ano e pode não exibir — o app não controla a exibição, só a tentativa.

### Critérios de aceite
1. `expo-store-review` integrado via `lib/review.ts` (`maybeAskForReview(trigger)`) — nenhuma chamada direta fora dele.
2. Os 3 gatilhos instrumentados; gating de 60 dias testado (unit).
3. Configurações ganha linha "Avaliar o Lingrow" (link direto para a página de avaliação na loja — canal manual sempre disponível).
4. Evento `review_prompt_attempted` (trigger) — honesto: a API não confirma exibição; instrumentamos a tentativa.
5. Android: `expo-store-review` cai para in-app review do Play (mesma lib); degradação testada.
6. Regressão: celebrações (E1.5/E3.3) não ganham fricção — o pedido vem DEPOIS da celebração, nunca no lugar.

### Tasks
- [ ] `lib/review.ts` + gating persistido + testes
- [ ] Integrar nos 3 gatilhos + linha em Configurações
- [ ] QA device real iOS + Android

---

## Story E6.5 — A loja como página de vendas: ficha on-brand + screenshots + feature graphic (FR-F5) 🎯 Release 1.0.5 (gate de submissão)

**Como** pessoa que encontrou o Lingrow na loja, **quero** entender em 5 segundos que este app é para quem já tentou e não quer mais recomeçar **para que** o download seja a continuação óbvia.

### Escopo

**(a) Ficha reescrita (App Store + Play Store), on-brand:** substitui a descrição atual de `app-store-metadata.md` (que hoje diz "inglês, espanhol e outros idiomas" — contradiz o não-goal do PRD — e não usa o hook). Estrutura final:
> 1ª linha (a única que aparece sem expandir): **"Inglês que não some. Para quem não aceita mais voltar do zero."**
> Parágrafos: a dor nomeada sem drama (já tentou, não reteve) → o método (SRS: o app sabe quando você vai esquecer e age antes) → o plano pessoal (3 perguntas, plano seu) → patrimônio (o que você aprende fica — e o app prova) → IA (seus decks, do seu mundo).
> Palavras-chave: revisar as atuais mantendo "anki, repetição espaçada, flashcard" (alto intent) e removendo "espanhol".
> Somente inglês como idioma-alvo, "frases" (não "cards") no texto voltado ao usuário.

**(b) Roteiro de 6 screenshots (6.7" + 6.1"), cada um com headline sobreposta em device frame:**

| # | Tela capturada | Headline |
|---|----------------|----------|
| 1 | Home com hero de patrimônio (ou 1ª sessão se E3.1 não estiver no ar) | "Inglês que não some." |
| 2 | Plano personalizado (E6.1) | "Seu plano em 3 perguntas." |
| 3 | Sessão de estudo (card frontal) | "Frases reais. Do seu mundo." |
| 4 | Tela de revisão / notificação de conteúdo | "O app sabe quando você vai esquecer. E age antes." |
| 5 | Criar com IA | "A IA monta seus decks." |
| 6 | Meu Inglês / celebração de capítulo | "Veja seu inglês crescer — e ficar." |

Produção: capturas do app REAL pós-E2/E6.1 (nunca mockups de features que não existem — Artigo IV), composição com headlines na paleta da marca (#6D28D9), export nos tamanhos exigidos pela Apple (6.7": 1290×2796 · 6.1": 1179×2556).

**(c) Play Store:** feature graphic 1024×500 (monograma + "Inglês que não some." sobre gradiente da marca) + confirmação do ícone Android corrigido (C1/C2 da auditoria UX — a correção dos assets é pré-requisito, referenciada aqui, executada como quick-win da auditoria).

**(d) Fora do escopo (registrado, não fazer agora):** preview video (App Store) — alto custo de produção, adiado para pós-1.1 quando houver motion (E4.3) para filmar.

### Critérios de aceite
1. Ficha nova (PT-BR) para App Store e Play Store aprovada pelo fundador ANTES do upload; `app-store-metadata.md` atualizado como fonte da verdade.
2. 12 screenshots (6×2 tamanhos) + feature graphic prontos nos tamanhos exatos, capturados do app real da 1.0.5.
3. Nenhuma menção a features inexistentes, nenhum depoimento inventado, nenhuma nota/prêmio falso.
4. Upload no App Store Connect + Play Console pelo @devops (autoridade exclusiva de release).
5. Baseline de conversão da loja (impressões→downloads) registrada no dia do go-live para medir o efeito.

### Tasks
- [ ] Reescrever ficha (App Store + Play) → aprovação do fundador
- [ ] Capturar telas do app 1.0.5 + compor 6 screenshots ×2 tamanhos (@ux-design-expert dirige)
- [ ] Feature graphic 1024×500 + conferir ícone Android corrigido
- [ ] Atualizar `app-store-metadata.md` + upload (@devops) + registrar baseline

---

## Story E6.6 — Winback v1: a porta de volta para quem saiu (FR-F6) · Release 1.2

**Como** ex-trialist ou ex-assinante, **quero** ser recebido de volta com o que construí (não com culpa nem pressão) **para que** reconsiderar o Premium seja natural.

### Critérios de aceite
1. Detecção de estado "lapsed" (trial expirado há ≥ 7 dias sem conversão, ou assinatura expirada) via RevenueCat `customerInfo` — sem backend novo.
2. A tela de volta sem culpa (E3.2) ganha variante para lapsed: mesma estrutura, com linha adicional "Seu patrimônio continua seu — no grátis e sempre." e CTA secundário "Ver o Premium de novo" (`source="winback"`). Máx 1 exibição/30 dias.
3. Cancelamento/expiração detectados → pesquisa local de 1 pergunta, 1× ("O que faltou? Preço · Conteúdo · Tempo · Outro"), dispensável, resposta em evento `churn_reason`.
4. Investigação documentada (spike, sem promessa de entrega): ofertas win-back nativas do App Store Connect (StoreKit) — viabilidade com RevenueCat, registrada em `docs/spikes/winback-offers.md`.
5. Eventos: `winback_screen_viewed`, `paywall_viewed` (source=winback), `churn_reason`.
6. Nenhuma dessas superfícies aparece para usuário free que nunca fez trial (não é público winback).

### Tasks
- [ ] Detecção lapsed + variante da tela de retorno
- [ ] Pesquisa de churn 1 pergunta + analytics
- [ ] Spike de win-back offers (timebox 1 dia)

---

## Gate do épico

- [ ] 1.0.5: E6.1 no funil com plan_reveal→sessão ≥ 90% em teste real (≥ 5 pessoas); ficha + screenshots aprovados pelo fundador e no ar junto com a submissão
- [ ] 1.1: regra "máx 1 superfície proativa/dia" e "máx 1 notificação/dia" auditadas pelo @qa (spam é falha de gate, não detalhe)
- [ ] Funil por source funcionando no PostHog antes de qualquer discussão de otimização
- [ ] @qa: zero regressão em onboarding (E2), celebrações (E1.5/E3.3) e compliance do paywall (compra sandbox ok)
- [ ] Push @devops + PR por release

— Orion, orquestrando o sistema 🎯
