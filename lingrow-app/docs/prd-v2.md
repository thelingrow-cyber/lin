# Lingrow — PRD v2.0: De Beta a App de Milhões

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2026-07-07 | 2.0 | Derivado do `ceo-review-2026-07.md`. Substitui o roadmap v2/v3 do `prd.md` v1.1 (que permanece válido como histórico da v1) | Orion (@aiox-master) |

> **Regra de leitura:** cada requisito referencia o épico que o executa (E1-E5). As stories detalhadas com critérios de aceite vivem em `docs/stories/epic-e*.md`. Decisões estratégicas e evidências de mercado vivem no `ceo-review-2026-07.md` — este PRD não repete argumentos, só define O QUE construir.

---

## 1. Goals

1. **Receita real girando em 2 semanas** — paywall ativo com onboarding orientado a conversão Day-0 (E2).
2. **Retenção top-quartile** — D7 ≥ 15%, D30 ≥ 8%, via mecânica de patrimônio + widget + share (E3).
3. **Conteúdo à altura da promessa** — 1000 frases reais, organizadas por nível CEFR e capítulos temáticos da persona (E1).
4. **Percepção premium** — acabamento sensorial e marca aplicada que sustentem R$179,90/ano sem objeção (E4).
5. **Fundação da categoria nova** — FSRS + geração por contexto real, preparando o Movimento 1 (E5 → 2.0).

## 2. Não-goals desta versão

- Movimento 1 (review por produção com IA) — tese 2.0, requer receita estável antes (ver CEO review §7).
- Turmas colaborativas / B2B — pós-2.0.
- Dark mode — adiado de propósito (auditoria UX §6).
- Outros idiomas além de inglês.
- Marketplace de decks.

---

## 3. Requisitos Funcionais

### Bloco A — Conversão Day-0 (épico E2, release 1.0.5)

- **FR-A1**: O onboarding deve coletar, em no máximo 4 passos com 1 toque cada: (a) objetivo principal (Trabalho/Carreira · Viagem · Estudos/Prova · Morar fora · Por mim), (b) autoavaliação de nível (Começando do zero · Entendo mas travo · Já me viro, quero fluência), (c) meta diária (5/10/15 frases — o modal de meta atual é absorvido aqui).
- **FR-A2**: Ao final do onboarding, o app deve montar a **primeira sessão personalizada** usando objetivo+nível: o usuário estuda 5 frases do capítulo correspondente ao seu perfil **antes de qualquer outra tela** ("aha em 60 segundos").
- **FR-A3**: Ao completar a primeira sessão, exibir a tela-semente do patrimônio: "5 frases suas. O Lingrow garante que elas não somem." + agendamento transparente da primeira revisão ("amanhã eu te lembro dessas 5").
- **FR-A4**: O paywall deve ser apresentado 1 vez ao final do primeiro dia de uso (após a tela-semente), com narrativa de transformação (não lista de features), trial 14 dias, e nunca bloquear o caminho free.
- **FR-A5**: Todos os passos do onboarding devem emitir eventos de analytics (funil completo mensurável passo a passo).

### Bloco B — Conteúdo CEFR (épico E1, release 1.1)

- **FR-B1**: O programa "1000 Frases Essenciais" deve conter 1000 frases reais distribuídas por nível CEFR: A1 ×200, A2 ×250, B1 ×300, B2 ×250.
- **FR-B2**: As frases devem ser organizadas em **capítulos temáticos nomeados** (~25 frases cada, ~40 capítulos), com títulos na linguagem da persona (ex.: "Sobrevivência no aeroporto", "Reuniões sem travar", "E-mails que funcionam", "Entrevista de emprego", "Small talk"). Cada frase pertence a exatamente 1 capítulo; capítulos têm ordem pedagógica dentro do nível.
- **FR-B3**: Cada frase deve ter: front EN, back PT, keyword EN/PT (formato atual) + `level` (A1|A2|B1|B2) + `chapterId` + nota de contexto de uso opcional (ex.: "informal — colegas próximos").
- **FR-B4**: **Placement test** de ~2 minutos no onboarding (integra FR-A1): 12 frases de dificuldade crescente, usuário responde "Sei falar essa / Não sei"; o resultado posiciona o início na trilha (frases anteriores marcadas como "puladas", recuperáveis).
- **FR-B5**: Completar um capítulo dispara a **celebração de marco** (tela + haptic + share card — FR-C4).
- **FR-B6**: O pipeline de produção de conteúdo deve ser reprodutível: geração assistida por IA + curadoria humana registrada + validação automática (schema, duplicatas, distribuição CEFR) antes de entrar no bundle.

### Bloco C — Retenção por patrimônio (épico E3, release 1.1)

- **FR-C1**: O hero da home passa a ser o **patrimônio**: "N frases suas · X% retidas hoje" (dados de `card_progress`, cálculo local). Streak vira métrica secundária visível.
- **FR-C2**: Retorno após ausência ≥ 3 dias mostra a **tela de boas-vindas de patrimônio**: "Seu inglês não foi embora. X% intacto. N frases precisam de retoque — ~M minutos para recuperação total." com CTA direto para a sessão de recuperação.
- **FR-C3**: Streak sem punição: (a) contador continua; (b) quebra de streak nunca usa linguagem de perda — mostra o patrimônio intacto; (c) **proteção de constância**: 1 dia de ausência por semana não zera o contador (auto-aplicada, comunicada com transparência).
- **FR-C4**: **Share card de marcos**: ao completar capítulo/nível/centena de frases, gerar imagem 9:16 e 1:1 com a marca (patrimônio + marco) e abrir o share sheet nativo. Meta: ≥3% das celebrações geram share.
- **FR-C5**: **Widget iOS** (home screen + lock screen): mostra patrimônio (nº de frases + % retido) e revisões pendentes hoje. Android: widget home screen equivalente (pode chegar depois do iOS).
- **FR-C6**: **Notificações com conteúdo**: a notificação diária deve citar uma frase real em risco ("'negotiate' está prestes a escapar. 2 min para segurar.") em vez de lembrete genérico. Frequência máxima 1/dia, horário aprendido do uso (hora média das sessões).
- **FR-C7**: "Meu Inglês" reorganizado: número-hero e % retido ficam FREE (na home); o painel premium ganha profundidade — curva de retenção histórica, heatmap de constância, projeção de conclusão da trilha, lista nomeada de frases em risco, retenção por capítulo/nível.

### Bloco D — Percepção premium (épico E4, release 1.2)

- **FR-D1**: **Haptics semânticos** (expo-haptics) nos momentos de significado: resposta SRS (leve), acerto em sequência (médio), capítulo completo (sucesso), compra confirmada (sucesso), erro (warning). Nunca em navegação comum.
- **FR-D2**: **Motion funcional** (reanimated, já instalado): flip do card com física de mola; card "arquivado" desliza para a pilha ao responder; contador de patrimônio anima ao final da sessão; transições de tela padronizadas (200-250ms, curva única no design system).
- **FR-D3**: **Áudio neural pré-gerado** para as 1000 frases built-in (voz neural feminina + masculina EN-US, arquivo por frase, servido de Supabase Storage com cache local). TTS nativo permanece como fallback e para cards custom.
- **FR-D4**: **Marca aplicada**: monograma real (asset) no login e header da home, substituindo Ionicons `leaf` e texto+emoji.
- **FR-D5**: **Ilustrações próprias** (estilo flat, paleta da marca): 3 slides de onboarding + estado vazio "tudo em dia" + tela de celebração de marco.
- **FR-D6**: Tela de paywall reescrita com narrativa de transformação: patrimônio do usuário no topo ("Suas 87 frases estão seguras. Imagine 1000."), benefícios como resultado (não lista técnica), prova social quando existir.

### Bloco E — Motor de aprendizado (épico E5, release 1.2)

- **FR-E1**: Migrar o agendador SRS de SM-2 adaptado para **FSRS** (pacote `ts-fsrs`, MIT): conversão dos estados existentes (repetitions/ease/interval → estado FSRS), flag de rollback, resultado idêntico ou melhor em retenção medida.
- **FR-E2**: **Geração por contexto real** (Movimento 3): a tela "Criar com IA" aceita colar texto longo (vaga de emprego, e-mail, letra de música) além do tema curto; a edge function extrai o vocabulário relevante e gera cards no formato padrão. Mesmo pipeline de quota/limites.
- **FR-E3**: Rótulos de tempo dos botões SRS passam a exibir o intervalo REAL calculado (ex.: "Fácil → 12 dias"), usando o cálculo do agendador vigente.

## 4. Requisitos Não-Funcionais

- **NFR1**: Nenhuma feature nova pode degradar o funil existente — regressão automatizada de contagem/DECK_1000/auth continua obrigatória (regra do epic IA mantida).
- **NFR2**: Todo conteúdo novo (frases, áudios, ilustrações) entra por pipeline versionado e validável — nada "colado na mão" no bundle.
- **NFR3**: Widget e share card não podem exigir backend novo — dados locais/AsyncStorage + snapshot de view.
- **NFR4**: Áudio: tamanho médio ≤ 60KB/frase (AAC/MP3 mono), download lazy por capítulo, cache local, funcionamento offline após 1º download.
- **NFR5**: FSRS: migração de estado reversível; A/B ou flag remota (`app_config.srs_engine`) para rollback sem novo build.
- **NFR6**: Todos os textos de UI novos seguem o tom de voz da marca (`brand-positioning.md` §7): direto, sem gamificação infantil, sem celebração vazia.
- **NFR7**: Acessibilidade: todo botão novo nasce com `accessibilityLabel`; celebrações respeitam `reduce motion` do sistema.

## 5. Métricas de sucesso (por release)

| Release | Métrica | Meta | Instrumentação |
|---------|---------|------|----------------|
| 1.0.5 | Onboarding completion | > 70% | eventos FR-A5 |
| 1.0.5 | Trial start no Day 0 | > 8% dos signups | PostHog + RevenueCat |
| 1.1 | D7 / D30 | ≥ 15% / ≥ 8% | PostHog cohorts |
| 1.1 | Widget adoption | ≥ 15% dos iOS MAU | evento de instalação |
| 1.2 | Trial→paid D35 | ≥ 8% | RevenueCat |
| 1.2 | Share rate em marcos | ≥ 3% | evento share_completed |
| contínuo | Crash-free sessions | ≥ 99,5% | Sentry (instalar — pendência conhecida) |

## 6. Dependências e sequência

```
E2 (onboarding) ──────► 1.0.5  (não depende de nada; usa conteúdo atual)
E1 (conteúdo CEFR) ───► 1.1    (FR-B4 integra com E2 já lançado)
E3 (patrimônio) ──────► 1.1    (FR-C7 depende de E1 para "por capítulo")
E4 (design premium) ──► 1.2    (FR-D3 depende do texto final das 1000 frases de E1)
E5 (FSRS + Mov.3) ────► 1.2    (independente; FR-E3 depende de E5-FSRS)
```

Pré-requisitos externos (fora do código, donos: fundador + @devops):
1. Setup App Store Connect (2 produtos IAP) + RevenueCat + `EXPO_PUBLIC_RC_API_KEY` + webhook secret (checklist em `project_lingrow_beta_state` / fase-5-paywall-plano).
2. Migration 006 aplicada em produção + deploy das functions `delete-account` e `revenuecat-webhook`.
3. Build EAS novo (react-native-purchases é nativo).
4. H5: rotação de credenciais (pendência de segurança nº 1).
5. H3: verificação do tipo de `cards.position` em produção.

## 7. Riscos

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Produção de 600+ frases com qualidade | Média | Alto | Pipeline FR-B6 com curadoria humana obrigatória; capítulos entram em lotes (não precisa das 1000 no dia 1 da 1.1) |
| Widget iOS exige módulo nativo (fora do Expo managed) | Alta | Médio | Story E3.4 já especifica config plugin (`@bacons/apple-targets`) + dev client; widget Android adiável |
| Migração FSRS corromper agendamentos | Baixa | Alto | NFR5: conversão reversível + flag remota + testes de regressão sobre `store/lingrow.test.ts` |
| Custo de áudio neural acima do estimado | Baixa | Baixo | Verificar preço na execução; alternativa: gerar só capítulos A1-A2 primeiro |
| Excesso de escopo atrasar 1.0.5 | Média | Alto | 1.0.5 é APENAS E2 + paywall ON; qualquer outra coisa vai para 1.1 |

---

*Execução: stories detalhadas em `docs/stories/epic-e1-conteudo-cefr.md` · `epic-e2-onboarding-conversao.md` · `epic-e3-patrimonio-retencao.md` · `epic-e4-design-premium.md` · `epic-e5-fsrs-vida-real.md`.*

— Orion, orquestrando o sistema 🎯
