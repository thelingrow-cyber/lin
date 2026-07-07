# Épico E3 — Patrimônio de Conhecimento: A Máquina de Retenção

| Campo | Valor |
|-------|-------|
| Release | **1.1 "Retenção"** (junto com E1) |
| Origem | `prd-v2.md` Bloco C (FR-C1..C7) · Movimento 2 da tese (`vision-top1-flashcard-idiomas.md`) · decisões §5.1 e §5.2 do `ceo-review-2026-07.md` |
| Por quê | Streak 7+ dias = 2,4× retenção; widget = +60% commitment; share cards = 5-10× organic. O Lingrow não tem NENHUMA dessas alavancas — e a que tem (streak) contradiz a marca quando pune |
| Dependências | E2 lançado. E1.2 (capítulos) para o FR-C7 premium; o resto independe de E1 |
| Decisão do fundador embutida | Patrimônio no FREE (hero da home), profundidade no premium — aprovar antes de implementar (§5.1 do CEO review) |
| Estimativa | 6 stories · ~3 semanas (widget iOS é o item de maior risco técnico) |

## Contexto para quem implementa

- Dados do patrimônio JÁ EXISTEM: `card_progress` (repetitions, ease_factor, interval, next_review). Cálculo de retenção: mesmo padrão de `app/meu-ingles.tsx` (learnedCards, atRisk, retentionPct) — extrair para `lib/patrimony.ts` reutilizável.
- Streak atual: `user_settings.streak` + `updateStreak()` em `store/lingrow.ts`.
- Notificações: `lib/notifications.ts` (locais, expo-notifications).
- Widget iOS NÃO roda em Expo Go — exige dev client + extensão nativa (ver E3.4).
- Tom de voz: nunca linguagem de perda/culpa. Todos os textos especificados aqui são finais.

---

## Story E3.1 — `lib/patrimony.ts` + hero da home (FR-C1)

**Como** usuário free, **quero** ver meu patrimônio ("N frases suas · X% retidas") como número central do app **para que** a promessa da marca seja visível todo dia.

### Critérios de aceite
1. Novo `lib/patrimony.ts`: `getPatrimony(): { owned: number; retainedPct: number; atRisk: number; minutesToRecover: number }` — owned = cards com repetitions>0; atRisk = due agora; retainedPct = (owned-atRisk)/owned; minutesToRecover = atRisk × 25s arredondado p/ min. Puro e testável (recebe progress[] como parâmetro).
2. Hero da home substituído: patrimônio grande ("87 frases suas"), retenção como sub ("91% retidas hoje"), streak REDUZIDO a chip secundário ao lado (🔥 12).
3. `meu-ingles.tsx`: o número-hero e % deixam de ser premium-only (tela aberta a todos mostra patrimônio + streak); as seções profundas (E3.6) ficam premium.
4. Usuário com 0 frases: hero mostra o convite do programa (comportamento atual preservado).
5. Testes unitários de `getPatrimony` (0 cards, tudo em dia, tudo em risco, arredondamentos).
6. Regressão: contagem, barra, navegação intactas.

### Tasks
- [ ] `lib/patrimony.ts` + testes
- [ ] Refactor do hero da home
- [ ] Abrir números básicos do meu-ingles ao free
- [ ] QA visual em iPhone real

---

## Story E3.2 — Volta sem culpa + streak sem punição (FR-C2, FR-C3)

**Como** usuário que sumiu por 2 semanas, **quero** voltar e ver o que FICOU (não o que perdi) **para que** voltar seja o momento-herói, não o momento-vergonha.

### Especificação de textos (finais)

**Tela de retorno (ausência ≥ 3 dias), antes da home:**
> "Bem-vindo de volta."
> "Seu inglês não foi embora: **{retainedPct}% intacto**."
> "{atRisk} frases precisam de retoque — {minutesToRecover} min para recuperação total."
> CTA primário: "Recuperar agora" → sessão só com os cards em risco. Secundário: "Ver meu espaço" → home.

**Quebra de streak (no chip da home, 1ª visualização após quebra):**
> tooltip/bottom-sheet: "{N} dias construídos. A contagem recomeça — **o inglês fica**. {owned} frases continuam suas."

### Critérios de aceite
1. Detecção de ausência: `lastStudyDate` vs hoje ≥ 3 dias → tela de retorno 1× (flag local até a próxima ausência).
2. **Proteção de constância** (FR-C3c): `updateStreak()` alterado — 1 dia de gap por semana-calendário NÃO zera (streak continua, contador de proteções usado/semana em settings local). Comunicação: quando a proteção salva o streak, chip mostra "🔥 12 · protegido hoje".
3. NENHUM texto do app usa linguagem de perda por streak ("perdeu", "quebrou", "zerou" são proibidos — auditar strings existentes).
4. Sessão de recuperação: filtra só cards due (já suportado pelo agendador — verificar `getStudySession`).
5. Testes: updateStreak com gap de 1 dia (protege), 2 dias (zera com mensagem certa), semana com 2 gaps (2º não protege).
6. Eventos: `comeback_screen_viewed` (daysAway, retainedPct), `comeback_recover_started`, `streak_protected`.

### Tasks
- [ ] Tela de retorno + detecção
- [ ] Lógica de proteção no updateStreak + testes
- [ ] Auditoria de strings de perda
- [ ] Analytics

---

## Story E3.3 — Share card de marcos (FR-C4)

**Como** usuário que completou um capítulo/marco, **quero** compartilhar uma imagem bonita **para que** meu progresso vire prova social (e aquisição orgânica para o app).

### Critérios de aceite
1. Componente `components/ShareCard.tsx` renderizado off-screen e capturado com `react-native-view-shot`, compartilhado via `expo-sharing`. Dois formatos: 9:16 (Stories) e 1:1 (feed) — usuário escolhe no preview.
2. Design do card: fundo gradiente da marca (#6D28D9→primaryLight), monograma, marco em destaque ("Capítulo: Reuniões sem travar ✓"), patrimônio ("87 frases que não somem"), assinatura "lingrow · inglês que não some". SEM screenshot da UI — é um artefato desenhado (padrão Duolingo: share card como artefato premium).
3. Pontos de disparo: fim de capítulo (E1.5), marcos de patrimônio (50/100/250/500/1000 frases), fim de nível CEFR.
4. Eventos: `share_card_viewed`, `share_card_shared` (formato, marco), `share_card_dismissed`. Meta instrumentada: share rate por celebração.
5. Funciona sem rede (tudo local).
6. Preview com botão único "Compartilhar" → share sheet nativo.

### Tasks
- [ ] Instalar react-native-view-shot (verificar compat Expo SDK)
- [ ] ShareCard 2 formatos + captura
- [ ] Integrar nos 3 pontos de disparo
- [ ] Analytics + QA em iPhone real (Stories de verdade)

---

## Story E3.4 — Widget iOS de patrimônio (FR-C5) ⚠️ maior risco técnico do épico

**Como** usuário, **quero** ver meu patrimônio e revisões pendentes na home screen/lock screen **para que** o Lingrow esteja presente sem precisar abrir o app.

### Abordagem técnica (decidida — não redescobrir)
- Expo managed NÃO suporta widget → usar **`@bacons/apple-targets`** (config plugin) + **EAS dev client**. Widget em SwiftUI (WidgetKit), dados compartilhados via **App Group** (`group.com.lingrow.flashcards`): o app RN escreve JSON (`patrimony.json`: owned, retainedPct, dueToday, updatedAt) no container compartilhado a cada sessão concluída/abertura; o widget lê.
- Tamanhos: systemSmall (home) + accessoryCircular/accessoryRectangular (lock screen).
- Android (Glance) fica explicitamente FORA desta story (backlog 1.2+).

### Critérios de aceite
1. Widget small: monograma + "87 frases · 91%" + badge "{due} p/ revisar" quando due>0.
2. Lock screen circular: número due (ou ✓ quando zero). Rectangular: "87 frases suas · 12 p/ revisar".
3. Dados atualizam: ao fechar sessão, ao abrir o app, e via timeline do WidgetKit (refresh a cada 4h para recalcular due com base em next_review armazenado no JSON — gravar a lista de próximos horários, não só a contagem).
4. Tap no widget abre o app na sessão de revisão (deep link `lingrow://review`).
5. Build EAS com a extensão passa no App Store review (sem entitlements faltando).
6. Evento `widget_installed` (primeira leitura de dados pelo widget) para medir adoção (meta PRD: ≥15% dos iOS MAU).
7. Onboarding do widget: card dispensável na home (1× após 3 dias de uso) ensinando a adicionar.

### Tasks
- [ ] Config plugin + App Group + dev client novo
- [ ] Escrita do patrimony.json no app RN
- [ ] Widget SwiftUI (small + 2 lock screen)
- [ ] Deep link + card de onboarding do widget
- [ ] Build EAS + teste em device real

---

## Story E3.5 — Notificação com conteúdo (FR-C6)

**Como** usuário, **quero** que a notificação me mostre O QUE está em risco **para que** ela seja informação valiosa, não spam de app.

### Critérios de aceite
1. A notificação diária cita uma frase real em risco: título "'{keyword}' está quase escapando" · corpo "Reveja '{front}' e mais {n-1} frases — {minutos} min." — dados calculados NO AGENDAMENTO (notificação local; escolher o card de próximo vencimento do dia seguinte).
2. Horário: média das horas das últimas 5 sessões do usuário (fallback 19h). Máximo 1/dia (regra atual mantida).
3. Sem frases em risco amanhã → notificação NÃO é agendada (silêncio quando não há valor — anti-spam é posicionamento).
4. Tap abre direto a sessão de revisão (deep link).
5. Regressão: fluxo atual de permissões e cancelamento em sessão ativa intacto (NFR5 do PRD v1).
6. Eventos: `notification_scheduled` (hasContent), `notification_opened`.

### Tasks
- [ ] Cálculo de frase em risco no agendamento
- [ ] Horário adaptativo
- [ ] Deep link para revisão
- [ ] Testes de agenda (dia sem risco, usuário sem histórico)

---

## Story E3.6 — Meu Inglês profundo (premium) (FR-C7)

**Como** assinante, **quero** o mapa completo do meu inglês **para que** eu tenha um motivo para CONTINUAR pagando no mês 6 (gancho de permanência).

### Critérios de aceite
1. Seções premium na tela Meu Inglês (a partir dos dados locais + `card_progress`; zero IA, zero migração):
   - **Curva de retenção** (últimas 8 semanas: % retido por semana — requer snapshot semanal em AsyncStorage a partir de agora; mostrar "coletando dados" até ter 2 pontos);
   - **Heatmap de constância** (90 dias, estilo GitHub, derivado de study_sessions/progress created_at);
   - **Projeção**: "No seu ritmo ({X} frases/semana), você completa as 1000 em {mês/ano}";
   - **Frases em risco NOMEADAS** (lista das top 10 due, tap → revisar);
   - **Retenção por capítulo/nível** (depende de E1.2; se E1 atrasar, agrupar por deck).
2. Free vê as seções borradas com CTA do paywall (preview honesto do que existe, não mock).
3. Performance: tela abre < 1s com 1000 cards de progresso (cálculos memoizados; sem N+1 de rede — `getAllProgress` é 1 query).
4. Eventos: `meu_ingles_viewed` (isPremium), `meu_ingles_upgrade_tapped`.
5. Paywall (contexto "meu-ingles") destaca ESTA tela como benefício.

### Tasks
- [ ] Snapshot semanal de retenção (AsyncStorage)
- [ ] 5 seções premium + blur no free
- [ ] Gráficos leves (sem lib pesada — Views/SVG simples)
- [ ] Performance test com 1000 progressos

---

## Gate do épico

- [ ] Fundador aprovou §5.1 (patrimônio free) e §5.2 (streak sem punição) ANTES das stories E3.1/E3.2
- [ ] @qa: nenhuma regressão em streak/notificações/contagem; textos auditados contra linguagem de perda
- [ ] Widget: build EAS aprovado na App Store (item de maior risco — começar cedo)
- [ ] Métricas de baseline capturadas ANTES do release (D7/D30 atuais) para medir o efeito

— Orion, orquestrando o sistema 🎯
