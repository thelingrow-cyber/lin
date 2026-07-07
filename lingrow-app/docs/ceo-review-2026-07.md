# Lingrow — CEO Review: Análise Estratégica Completa & Rota para App de Milhões

| Campo | Valor |
|-------|-------|
| Autor | Orion (@aiox-master) atuando como CEO/analista de startups |
| Data | 2026-07-07 |
| Tipo | Análise estratégica + diagnóstico competitivo + rota de execução |
| Insumos | Código-fonte real (`mobile-new/`), 4 auditorias internas (técnica, UX, QA, monetização), pesquisa web de mercado verificada em 07/07/2026 |
| Documentos-filho | `prd-v2.md` (requisitos), `stories/epic-e1..e5-*.md` (execução) |
| Público | Fundador (leigo em tech) + agentes/modelos que implementarão |

---

## 1. Veredicto executivo — a resposta honesta em 5 parágrafos

O Lingrow tem algo raro para o estágio em que está: **um posicionamento de marca genuinamente diferenciado** ("inglês que não some", o anti-Duolingo que não lucra com culpa), **infraestrutura de IA server-side de qualidade profissional** (validada em 3 auditorias) e **um preço bem ancorado** (paridade exata com o Duolingo Super anual, entregando IA que o Super não tem). A tese dos 3 movimentos (`vision-top1-flashcard-idiomas.md`) é a visão de categoria certa. Isso é o copo meio cheio — e ele é real.

O copo meio vazio: **hoje existe um abismo entre a promessa da marca e o que o usuário vive nos primeiros 5 minutos.** A marca fala com o Mateus — profissional de 26-38 anos, frustrado, que precisa de inglês para reunião, e-mail e carreira. O app o recebe com 3 slides genéricos que não perguntam nada sobre ele, e a primeira frase que ele estuda é *"She has a dog"* — conteúdo de cartilha infantil, nível A1, igual para todo mundo. **O produto trata a persona como criança e o marketing a trata como conquistador.** Nenhum design bonito conserta essa contradição. Este é o problema nº 1, acima de qualquer feature.

O problema nº 2 é estrutural de retenção: **o app renega o streak no discurso, mas o streak é a única mecânica de retenção que ele tem.** A pesquisa de mercado é inequívoca — streak de 7+ dias retém 2,4× mais ([Deconstructor of Fun](https://duolingo.deconstructoroffun.com/mechanics/streaks)), widget de streak aumentou comprometimento em 60% ([Duolingo Blog](https://blog.duolingo.com/widget-feature/)), share cards de marcos geraram 5-10× mais compartilhamento orgânico. O Lingrow não tem widget, não tem share, não tem marcos celebrados, e a métrica substituta do streak (o "patrimônio de conhecimento" do Movimento 2) foi colocada… **atrás do paywall** (`meu-ingles.tsx` é premium-only). A prova pública da promessa central da marca não pode ser paga — isso inverte o funil.

O problema nº 3 é percepção de valor: **o app é limpo, mas lê como template.** Ícones genéricos de biblioteca em círculos coloridos, o monograma da marca nunca aparece dentro do app, zero ilustração própria, zero micro-interação memorável, áudio TTS robótico como única voz. Um app que quer cobrar R$179,90/ano compete em percepção com Falou (R$299,90/ano) e ELSA — apps com vozes neurais, personalização no cadastro e acabamento sensorial (haptics, animações funcionais). A pesquisa de design 2026 é clara: micro-interações custam 10-15% a mais de tempo de dev e multiplicam a satisfação percebida ([8ration](https://www.8ration.com/blogs/mobile-app-design-trends/), [uxpilot](https://uxpilot.ai/blogs/mobile-app-design-trends)).

**A boa notícia final:** nada disso exige reconstrução. O alicerce técnico acabou de ser consertado (Fase 0), o paywall está pronto em código, e cada um dos gaps acima tem correção mapeada, dimensionada e transformada em stories executáveis nos documentos-filho. A rota completa está na seção 7.

---

## 2. Mapa competitivo real (verificado jul/2026)

### 2.1 Os clusters de mercado

| Cluster | Players | Preço | O que vendem | Ameaça ao Lingrow |
|---------|---------|-------|--------------|-------------------|
| **Gamificação de massa** | Duolingo Free/Super | R$0–14,99/mês | Hábito + entretenimento | Alta em aquisição (é o default), baixa em retenção real de conteúdo |
| **Conversação com IA** | Falou (R$299,90/ano), ELSA, Cake Plus (~US$13,99/mês) | R$25–90/mês | Fala + pronúncia + personalização | **Média-alta: Falou personaliza por objetivo no cadastro — exatamente o que falta ao Lingrow** |
| **IA premium / curso** | Duolingo Max (R$89,90/mês), BeConfident (R$1.990/ano) | R$90–166/mês | Transformação, tutor IA | Baixa hoje; é o teto que valida o futuro tier "Max" do Lingrow |
| **SRS puro** | Anki/AnkiMobile (US$24,99 one-time), Space, Mochi | one-time/US$5-8 mês | Retenção para power users | Baixa em UX, alta em credibilidade de método — **e o mercado SRS já migrou para FSRS; o Lingrow ainda usa SM-2** |
| **Flashcard IA moderno** | Knowt (4M usuários), RemNote, KaChiKa | freemium | Criação de card sem fricção via IA | **Direta: "IA cria seus cards" está deixando de ser diferencial e virando expectativa** ([Deckbase](https://www.deckbase.co/anki-alternatives), [Mindoma](https://www.mindomax.com/best-spaced-repetition-apps-2026-anki-alternatives)) |

### 2.2 Onde o Lingrow ganha (defensável hoje)

1. **Único com tese anti-recomeço para brasileiro adulto** — nenhum player nomeia o inimigo "indústria que lucra com recomeços". Isso é ouro de marca.
2. **Gap de preço R$15–90 vazio** — "IA de verdade pelo preço de app comum" (análise de monetização v2.0, confirmada).
3. **Conteúdo EN↔PT curado para brasileiro** — Anki não tem, Duolingo dilui em gamificação, apps de conversação não fazem retenção de longo prazo.
4. **Infra de custo de IA controlado** — quota atômica server-side já validada em produção (nenhum indie brasileiro do nicho tem isso).

### 2.3 Onde o Lingrow perde HOJE (e a correção)

| Fraqueza vs mercado | Quem faz melhor | Correção (épico) |
|---------------------|------------------|------------------|
| Onboarding não pergunta nível nem objetivo | Falou (pergunta idioma, nível, objetivo no cadastro) | E2 |
| Conteúdo único A1 para todos | Lingvist (adaptativo), Duolingo (placement test) | E1 |
| Sem widget de streak/progresso | Duolingo (+60% commitment) | E3 |
| Sem compartilhamento de marcos | Duolingo (5-10× organic sharing) | E3 |
| Sem haptics/micro-interações | ELSA, Falou, todo app premium 2026 | E4 |
| Voz TTS robótica | ELSA/Falou (vozes neurais) | E4 |
| SM-2 (algoritmo 1987) | Todo SRS moderno usa FSRS | E5 |
| Marca invisível dentro do app | — (autoauditoria UX) | E4 |

---

## 3. Números que devem guiar as decisões (benchmarks verificados)

| Métrica | Benchmark | Fonte | Implicação para o Lingrow |
|---------|-----------|-------|---------------------------|
| D1 / D7 / D30 top quartile | 30% / 15% / 8% | [core-mba](https://www.core-mba.pro/tool-hub/mobile-app-retention), [MWM](https://mwm.ai/glossary/retention) | Metas do PRD v2 |
| D30 típico de educação | < 3% | [Plotline](https://www.plotline.so/blog/retention-rates-mobile-apps-by-industry) | O jogo é ser exceção via mecânica de patrimônio |
| Trial→paid freemium (D35) | **2,1%** mediana | [RevenueCat State of Subscription Apps 2026](https://www.revenuecat.com/state-of-subscription-apps/) | Com 2,1% e pouco tráfego, a receita será ~zero. Conversão vem de VALOR DENSO no trial, não do paywall em si |
| Conversões pagas que acontecem no Day 0 | **~50%** | [RevenueCat 2026](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026/) | **O onboarding É o funil de receita.** Quem não vê valor no 1º dia não volta para ver depois |
| Streak 7+ dias | 2,4× retenção | [Deconstructor of Fun](https://duolingo.deconstructoroffun.com/mechanics/streaks) | Manter streak SIM — mas sem punição (ver §5.2) |
| Widget de streak | +60% commitment; 50% dos usuários com widget têm streak 6+ meses | [Duolingo Blog](https://blog.duolingo.com/widget-feature/), [duoplanet](https://duoplanet.com/duolingo-widget/) | A feature isolada de maior ROI de retenção disponível |
| Share cards de marcos | 5-10× organic sharing | [Trophy](https://trophy.so/blog/duolingo-gamification-case-study) | Distribuição é o gargalo nº 1 do Lingrow — isso é aquisição grátis |
| Streak freeze | -21% churn em usuários em risco | [Trophy](https://trophy.so/blog/duolingo-gamification-case-study) | Versão Lingrow: "proteção de patrimônio", não "freeze" (§5.2) |
| Churn anual de assinantes | ~72% cancelam no ano 1 | [RevenueCat 2026](https://www.revenuecat.com/state-of-subscription-apps/) | O gancho de permanência (Meu Inglês profundo) não é opcional — é a defesa da receita |

---

## 4. Diagnóstico interno — o que o app é hoje, tela por tela

*(Base: leitura integral do código em 07/07/2026, pós-correções da Fase 0.)*

| Área | Estado | Nota (0-10) | Gap principal |
|------|--------|-------------|---------------|
| **Onboarding** | 3 slides estáticos genéricos, sem coleta de dados, sem personalização, sem prova | 3 | Não vende, não segmenta, não cria investimento do usuário. Falou coleta objetivo+nível aqui |
| **Conteúdo (1000 frases)** | 400 frases A1 uniformes, sem níveis, sem temas, sem progressão CEFR, sem contexto de uso | 2 | **O maior gap do produto.** Desalinhado da persona; 600 frases nem existem (C1 da auditoria) |
| **Home** | Hero do programa + stats + decks; pós-Fase 0 está coesa | 6 | Streak como métrica central contradiz a marca; patrimônio deveria ser o hero |
| **Sessão de estudo** | Flip + 4 botões SRS + TTS + keyword highlight; agora com guard de duplo-toque | 6 | Sem haptics, animação básica, TTS robótico, autoavaliação desonesta (tese Mov. 1, futuro) |
| **Revisar** | Lista funcional por deck | 6 | Sem estados de erro de rede visíveis (M2 da auditoria) |
| **Criar com IA** | Fluxo 3 fases maduro, 6 estados de erro, quota visível | 8 | Melhor tela do app. Falta apenas entrada por contexto real (Mov. 3) |
| **Meu Inglês (premium)** | 4 números (retenção %, frases, streak, em risco) | 4 | Raso para ser gancho de permanência; e a versão zero deveria ser free (§5.1) |
| **Paywall** | Compliance Apple ok, preços certos | 7 | Falta narrativa de valor (mostra features, não transformação) |
| **Design system** | Tokens centralizados, Plus Jakarta Sans, paleta roxa coesa | 7 | Fundação boa; faltam haptics, motion, ilustração, marca aplicada |
| **Infra/segurança** | RLS + quota atômica + kill switches + CI + testes | 9 | Sólido pós-Fase 0. FSRS pendente (E5) |

---

## 5. As 4 decisões estratégicas que precisam do fundador

### 5.1 O patrimônio de conhecimento vai para o FREE (recomendo: SIM)

A estratégia de monetização v2.0 colocou o painel "Meu Inglês" inteiro no premium. Como CEO, discordo parcialmente: **a promessa central da marca não pode ser invisível para 98% dos usuários.** Proposta:

- **FREE:** o hero da home passa a mostrar o patrimônio — "347 frases suas · 91% retidas hoje". A volta após ausência mostra "Seu inglês não foi embora: 87% intacto" (Movimento 2 como mecânica core, não feature paga).
- **PREMIUM (Meu Inglês profundo):** curva de retenção histórica, heatmap de estudo, projeção ("no seu ritmo, 1000 frases em março"), lista nomeada das frases em risco, análise por tema/nível.

Free vê O NÚMERO (prova a promessa, cria hábito). Premium vê O MAPA (entende, planeja, controla). Isso preserva o gancho de permanência e conserta o funil.

### 5.2 Streak morre? NÃO — streak vira "constância" sem punição

Os dados não deixam dúvida de que streak retém (2,4×). A marca não é anti-streak — é anti-**punição**. Síntese recomendada:

- Streak continua existindo e visível (secundário, não hero).
- **Quebrou o streak? A mensagem muda:** em vez de "você perdeu 30 dias 😢", mostra "30 dias construídos. Seu patrimônio: 91% intacto. Recomece a contagem — o inglês ficou." — a perda do contador nunca significa perda do conteúdo.
- **"Proteção de patrimônio"** (análogo ao streak freeze, -21% churn): 1 dia de ausência por semana não zera a contagem. Nomeada na linguagem da marca, não como "freeze" de jogo.

### 5.3 As 1000 frases: completar COM ESTRUTURA, não só completar

C1 da auditoria pede 600 frases. A oportunidade é maior: reorganizar as 1000 em **trilha CEFR com capítulos temáticos nomeados para a persona** (§6 do PRD v2). "Reuniões de trabalho", "E-mails que funcionam", "Viagem a trabalho", "Entrevista de emprego", "Small talk com gringo". Cada capítulo = marco celebrável = share card = prova de progresso. Frases A1 continuam existindo (Clara precisa delas), mas o **placement test** (2 min, no onboarding) posiciona o Mateus direto no nível dele.

### 5.4 Sequência de lançamento: 1.0.5 SEM esperar tudo

O paywall está pronto em código. A tentação é segurar o lançamento até os épicos E1-E4 ficarem prontos. Recomendação: **não segurar.** 1.0.5 = paywall + quick wins de conversão (E2 mínimo). Receita começa a girar e financia o resto. Detalhe na rota (§7).

---

## 6. Design: de "template" a "app de milhões" — a fórmula concreta

O que separa a percepção "indie" da percepção "premium" não é redesign — é **acabamento sensorial + marca aplicada + conteúdo denso**. Lista fechada do que fazer (detalhes no épico E4):

1. **Haptics em TODO momento de significado** (expo-haptics): acerto no SRS = pulso leve; capítulo completo = pulso duplo; compra = sucesso háptico. Custo: dias. Percepção: transformadora ([tendências 2026](https://www.8ration.com/blogs/mobile-app-design-trends/)).
2. **Motion com propósito**: flip do card com física de mola (react-native-reanimated já instalado); transição de acerto que "arquiva" o card na pilha; contador de patrimônio que sobe animado ao fim da sessão. Nada decorativo — só feedback funcional.
3. **Monograma nos pontos de identidade**: login, header da home, splash já corrigida. Trocar `Ionicons leaf` + "Lingrow 🌱" pelo asset real da marca.
4. **Áudio neural pré-gerado para as 1000 frases**: TTS robótico é o maior denunciante de "app barato". Gerar uma vez com voz neural (ElevenLabs/OpenAI TTS/Google), servir do Supabase Storage. Custo one-time estimado: < US$20 para 1000 frases. TTS nativo vira fallback para cards custom. **Maior upgrade de percepção por real investido em todo este documento.**
5. **Ilustrações próprias em 4 pontos**: 3 slides do onboarding + estado vazio "tudo em dia". Estilo flat com a paleta da marca. Pode ser gerado por IA + curadoria (Midjourney/ideogram) com direção de arte consistente.
6. **Celebração de marcos com share card**: fim de capítulo → tela de celebração (confete sutil + haptic) → card 9:16 e 1:1 desenhado para Instagram Stories com a marca. É retenção E aquisição na mesma feature.
7. **Dark mode: continuar adiado** (decisão da auditoria UX mantida — fazer pela metade é pior que não ter).

---

## 7. A ROTA — 4 releases, ordem de dependência e por quê

```
1.0.5 "Receita"        1.1 "Retenção"           1.2 "Percepção"         2.0 "Categoria"
Semana 0-2             Semanas 2-6              Semanas 6-10            Q4 2026
├─ Paywall ON          ├─ E1: 1000 frases       ├─ E4: design premium   ├─ Mov. 1: review
├─ E2: onboarding      │   CEFR + capítulos     │   (haptics, motion,   │   por produção
│   que converte       │   + placement test     │   áudio neural,       │   (tier Max
│   (objetivo+nível)   ├─ E3: patrimônio no     │   ilustração, marca)  │   R$39-49/mês)
├─ Patrimônio v0       │   free + widget +      ├─ E5: FSRS +           ├─ Turmas B2B2C
│   no hero da home    │   share cards +        │   Mov. 3 (deck da     └─ Institucional
└─ Setup RevenueCat/   │   notificação com      │   vida real)
    App Store Connect  │   conteúdo             └─ Meu Inglês profundo
                       └─ streak sem punição
```

**Por que nesta ordem:**
1. **1.0.5 primeiro** porque 50% das conversões acontecem no Day 0 e o onboarding atual desperdiça todo download que chega — cada semana sem E2 é tráfego queimado. Paywall pronto + onboarding mínimo viável = receita girando em 2 semanas.
2. **E1+E3 em seguida** porque retenção compõe: cada coorte que entra depois das mecânicas de patrimônio vale mais. Conteúdo (E1) é pré-requisito da promessa; widget+share (E3) são as 2 features de maior ROI comprovado do mercado.
3. **E4+E5 depois** porque percepção premium amplifica um funil que já converte — poli-lo antes seria polir um funil furado.
4. **2.0 por último** porque o Movimento 1 (review por produção) é o maior moat mas também o maior risco técnico-financeiro — precisa de receita estável e dados de uso reais para calibrar custo de IA por review.

### Metas por release (para saber se funcionou)

| Release | Métrica-guia | Meta |
|---------|--------------|------|
| 1.0.5 | Onboarding completion + trial start Day 0 | >70% completam onboarding; >8% iniciam trial no D0 |
| 1.1 | D7 / D30 | D7 ≥ 15%, D30 ≥ 8% (top quartile) |
| 1.2 | Trial→paid + share rate | ≥8% trial→paid (D35); ≥3% das sessões de marco geram share |
| 2.0 | LTV/churn | Churn mensal premium < 8%; ARPU crescendo |

---

## 8. Riscos honestos desta análise

1. **Distribuição continua sendo o gargalo nº 1.** Nada aqui substitui a máquina de conteúdo orgânico (content-engine já planejado em `marketing/`). Produto retém; não adquire sozinho.
2. **Benchmarks são de mercados maduros** — números do Duolingo (widget +60%) vêm de bases de milhões; o efeito no Lingrow será direcional, não idêntico.
3. **Elasticidade de preço segue sem dado próprio** — manter o checkpoint de 60 dias da estratégia de monetização.
4. **Áudio neural para 1000 frases** depende de custo verificado na data de execução (estimativa < US$20 baseada em preços públicos jul/2026; conferir antes).
5. **Capacidade de execução**: 4 épicos em ~10 semanas é ritmo agressivo para founder + agentes. A ordem foi desenhada para que cortar E4 ou E5 do cronograma NÃO quebre a tese — 1.0.5 + E1 + E3 já mudam o jogo.

---

## 9. Fontes externas (verificadas 07/07/2026)

- RevenueCat State of Subscription Apps 2026: [relatório](https://www.revenuecat.com/state-of-subscription-apps/) · [resumo](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026/)
- Duolingo mechanics: [streaks/Deconstructor of Fun](https://duolingo.deconstructoroffun.com/mechanics/streaks) · [gamification case study/Trophy](https://trophy.so/blog/duolingo-gamification-case-study) · [widget/Duolingo Blog](https://blog.duolingo.com/widget-feature/) · [duoplanet](https://duoplanet.com/duolingo-widget/)
- Benchmarks de retenção: [core-mba](https://www.core-mba.pro/tool-hub/mobile-app-retention) · [MWM](https://mwm.ai/glossary/retention) · [Plotline](https://www.plotline.so/blog/retention-rates-mobile-apps-by-industry)
- Apps BR 2026: [TechTudo IA](https://www.techtudo.com.br/listas/2026/06/11-melhores-apps-para-aprender-ingles-e-outros-idiomas-usando-ia-edapps.ghtml) · [Papora](https://www.papora.com/learn-english/apps/) · [Falou pricing](https://falou.com/academy/pt/apps/aplicativo-para-aprender-ingles)
- SRS moderno/FSRS: [Mindoma](https://www.mindomax.com/best-spaced-repetition-apps-2026-anki-alternatives) · [Deckbase](https://www.deckbase.co/anki-alternatives) · [StudyGlen FSRS vs SM-2](https://studyglen.com/guides/best-spaced-repetition-apps)
- Design premium 2026: [8ration](https://www.8ration.com/blogs/mobile-app-design-trends/) · [uxpilot](https://uxpilot.ai/blogs/mobile-app-design-trends)
- Preços concorrentes (herdados da análise v2.0, re-verificados): ver `monetization-strategy-2026-07.md` §fontes

---

*Próximo documento: `prd-v2.md` — requisitos formais derivados desta análise. Execução: `stories/epic-e1-conteudo-cefr.md`, `epic-e2-onboarding-conversao.md`, `epic-e3-patrimonio-retencao.md`, `epic-e4-design-premium.md`, `epic-e5-fsrs-vida-real.md`.*

— Orion, orquestrando o sistema 🎯
