# Lingrow — Playbook de Lançamento & Crescimento Composto

| Campo | Valor |
|-------|-------|
| Autor | @aiox-master (Orion) · Fable 5 |
| Data | 2026-07-19 |
| Objetivo | Sair do zero de tráfego para crescimento composto — em ordem de aplicação |
| Complementa | `growth-plan-organico-2026-07.md` (o motor de conteúdo contínuo) e `competitor-content-formats-2026-07.md` (o teardown) |
| Regra-mãe | **Balde que não vaza × motor que compõe.** Não despejar aquisição antes do produto reter e da porta abrir |

---

## Mapa geral — as 4 fases (a ordem importa)

```
FASE 0 — Destravar a porta        (você, manual — bloqueios duros)
   │
FASE 1 — Pré-lançamento           (4-6 semanas ANTES de abrir a loja)
   │     build-in-public + waitlist + começar a semear
   │
FASE 2 — Semana de lançamento     (a onda: Product Hunt + comunidades + criadores)
   │
FASE 3 — Pós-lançamento           (content-market fit → escalar o que funciona)
```

**Por que essa ordem:** a maioria dos apps morre porque abre a loja para o silêncio. A Fase 1 existe pra que, no dia do lançamento, já exista uma plateia esperando. Você constrói audiência **antes** de ter o que vender — e é isso que transforma o lançamento num evento em vez de um anúncio para ninguém.

---

## FASE 0 — Destravar a porta (pré-condições inegociáveis)

Nada da Fase 2+ funciona sem isto. Ordem:

| # | Item | Dono | Bloqueia |
|---|------|------|----------|
| 0.1 | Aplicar migration **008** (segurança do webhook) no SQL Editor | Você (Dashboard) | Configurar RevenueCat com segurança |
| 0.2 | Destravar **contrato de apps pagos Apple** + chaves RevenueCat | Você (manual) | Qualquer cobrança — nem sandbox funciona |
| 0.3 | Decidir o **gap de conteúdo (E1)**: completar 600 frases OU limitar a projeção do onboarding | Você + @dev | O balde: sem isso o melhor usuário some em ~7 dias |
| 0.4 | **ASO** — ficha da loja + 6 screenshots + palavras-chave (E6.5) | Você + @ux | O maior canal grátis; gate de submissão |

> A Fase 1 (abaixo) pode rodar **em paralelo** à Fase 0 — build-in-public e waitlist não dependem do app estar na loja. Só a Fase 2 exige a Fase 0 fechada.

---

## FASE 1 — Pré-lançamento (4-6 semanas antes)

Objetivo: chegar no dia do lançamento com **audiência + fila + comunidades aquecidas**.

### 1A. Build-in-public — a alavanca de maior retorno que você não usa

A ideia: documentar publicamente a jornada de construir e lançar o Lingrow. O público de produto/startup/inglês no Brasil acompanha jornada. Isso constrói audiência **antes** de você ter o que vender.

**Como fazer, na prática:**
- **Canal:** um perfil (pode ser o @lingrow ou um perfil pessoal do fundador ligado à marca) no TikTok + Instagram + um thread contínuo no X/Twitter e/ou LinkedIn (o público de "founder journey" BR vive lá).
- **Cadência:** 3-4 posts/semana de bastidor. Não precisa de produção — celular, honesto, cru.
- **O que postar (banco de 12 ganchos):**
  1. "Cansei de aprender inglês e esquecer tudo. Então construí um app. Semana 1:"
  2. "O problema do Duolingo que me fez largar tudo e construir isto"
  3. "Como decidi o preço do meu app (e por que copiei o Duolingo de propósito)"
  4. "A tela que refiz 6 vezes até parar de mentir pro usuário" (o caso do '1000 frases')
  5. "Achei uma falha de segurança no meu próprio app ontem. Consertei assim:"
  6. "Quanto custa lançar um app de inglês sozinho — números reais"
  7. "O e-mail da Apple que travou meu lançamento por 2 semanas"
  8. "Meu app tem 400 frases e prometia 1000. Escolha honesta que tive que fazer."
  9. "Testei o onboarding com 5 pessoas. O que 4 delas fizeram me assustou."
  10. "Por que não vou gastar 1 real em anúncio antes de X"
  11. "A métrica que decidi obsessar (e não é download)"
  12. "Faltam 14 dias pro lançamento. Aqui está tudo que ainda está quebrado."
- **Regra:** honestidade radical vende. Mostrar o tropeço (a falha de segurança, o gap de conteúdo) gera mais confiança que mostrar só vitória. O Mateus desconfia de perfeição.
- **CTA de todo post nesta fase:** "Entra na lista de espera — link na bio" (alimenta 1B).

### 1B. Waitlist com escassez — represar demanda

**Ferramenta:** uma landing simples (o `lingrow-privacy/` já mostra que você monta HTML; um `getwaitlist.com`, `tally.so` ou landing própria serve). Capture **só e-mail** (fricção mínima).

**As mecânicas de escassez que funcionam (em ordem de força):**
1. **Fila com posição visível:** "Você é o #347 da fila." Número concreto = prova social + antecipação.
2. **Referral que sobe na fila (o truque do Robinhood/Harry's):** "Convide 3 amigos e pule 50 posições / ganhe acesso antecipado." Cada inscrito vira recrutador — **isto é o loop viral do pré-lançamento.** Ferramentas como getwaitlist.com fazem isso nativo.
3. **Recompensa de fundador:** os primeiros N da fila ganham premium grátis por 3 meses / badge de "fundador". Cria urgência real pra entrar cedo e converte a fila em primeiros pagantes/evangelistas.

**Como alimentar a fila:**
- Todo conteúdo de build-in-public aponta pra ela.
- Sua rede pessoal/WhatsApp/Status primeiro (os primeiros 50-100 saem daí).
- As comunidades (1C) apontam pra ela.
- Meta realista de pré-lançamento: **300-1000 e-mails**. Com referral ativo, 100 sementes viram 300-500.

**No dia do lançamento:** e-mail para a lista inteira, em ondas (não todos de uma vez — ondas concentram reviews e mantêm o ranking subindo na loja ao longo do dia).

### 1C. Começar a semear nas comunidades — PASSO A PASSO

⚠️ **O erro que queima tudo:** entrar numa comunidade e postar "baixa meu app". Você é banido, marcado como spam, e a marca nasce queimada. Semear é **construir reputação primeiro, mencionar o produto por último.** É trabalho de semanas, por isso começa na Fase 1.

#### Passo 1 — Mapear as comunidades certas (semana 1)
Monte uma planilha com 15-20 comunidades, colunas: nome, plataforma, tamanho, regras de autopromoção, link, status.

| Plataforma | Onde o Mateus está |
|---|---|
| **Reddit** | r/EstudeIngles, r/ingles, r/Brasil (regras duras), r/conversas, subs de intercâmbio |
| **Facebook Grupos** | "Inglês para Brasileiros", grupos de intercâmbio, "Aprendendo Inglês", grupos de concurso/vestibular |
| **Discord** | servidores de estudo de inglês, "study with me" BR, comunidades de idiomas |
| **Telegram/WhatsApp** | grupos de dicas de inglês, canais de professores |
| **Outros** | comentários no TikTok/IG dos criadores grandes (Elza, Carina) — onde o público já está reunido |

#### Passo 2 — Ler as regras de cada uma (semana 1)
- **Reddit:** a maioria dos subs segue a regra **9:1** (90% do que você posta tem que ser não-promocional). Muitos **banem autopromoção** — nesses, você nunca posta o app direto; você **ajuda genuinamente** e deixa o link no perfil/bio pra quem procurar. Alguns têm **exigência de karma/idade de conta** — por isso criar a conta e participar já na Fase 1.
- **Facebook:** quase todo grupo exige **aprovação de admin** pra post promocional. O caminho é falar com o admin OU postar no formato "construí isto, procuro gente pra testar de graça" (convite, não venda).
- **Discord:** tem canal específico de "self-promo" na maioria; postar fora dele = ban.

#### Passo 3 — Construir reputação ANTES de mencionar o app (semanas 1-3)
- Entre com a conta e, por 2-3 semanas, **só ajude**: responda dúvidas de inglês, comente, seja útil. Sem link, sem menção.
- Meta: virar um rosto conhecido e confiável naquela comunidade. Isso é o que compra o direito de, depois, mencionar o produto sem ser spam.

#### Passo 4 — Introduzir o app como solução de um problema real (semana 3+)
Duas formas legítimas:
- **Reativa (a melhor):** alguém pergunta "como paro de esquecer o que aprendo?" / "Duolingo funciona?" → você responde com valor de verdade sobre repetição espaçada **e** menciona "inclusive construí um app que faz exatamente isso, tá em lista de espera se quiser — mas o conceito você aplica em qualquer lugar". Ajuda primeiro, produto como P.S.
- **Proativa (só onde as regras permitem):** post no formato build-in-public — "Sou BR, cansei de esquecer inglês e construí um app de repetição espaçada. Procuro 20 pessoas pra testar de graça e me dizer se presta." Isso é convite honesto, não anúncio — e converte muito melhor.

#### Passo 5 — Calendário de semeadura (repetível)
| Semana | Ação |
|---|---|
| 1 | Mapear 15-20 comunidades + ler regras + criar contas |
| 1-3 | Participar só ajudando (0 menção ao app) em 5-8 comunidades prioritárias |
| 3-4 | Primeiras menções reativas + 2-3 posts "procuro testers" onde permitido → alimenta a waitlist |
| Lançamento | Post de "está no ar" nas comunidades onde você já é conhecido (aí sim, direto) |
| Contínuo | Voltar semanalmente; nunca sumir depois de pegar o que queria |

> **Métrica de semeadura:** não é "quantos posts". É **quantos cliques/inscrições na waitlist vieram de cada comunidade** (use um link UTM por comunidade). Corta as mortas, dobra nas vivas.

---

## FASE 2 — Semana de lançamento (a onda)

Tudo concentrado para criar a sensação de "todo mundo está falando disso ao mesmo tempo".

### 2A. Product Hunt (pico + credibilidade)
- **Prepare com 1-2 semanas de antecedência:**
  - Ativos: galeria (GIF/vídeo do app em uso), tagline afiada ("Inglês que não some — repetição espaçada sem a complicação do Anki"), descrição, e um **first comment** do fundador contando a história (o build-in-public resumido).
  - Avise sua waitlist e comunidades **na véspera** que você lança amanhã lá — peça "apoio e feedback" (⚠️ nunca peça "upvote" explicitamente; é contra as regras e derruba o post).
- **Dia:** lance **terça a quinta, 00:01 PT** (madrugada BR). Responda TODO comentário nas primeiras horas — engajamento cedo define o ranking do dia.
- **Meta realista:** top 5 do dia já traz tráfego qualificado + selo de credibilidade pra usar depois ("#3 Product of the Day").

### 2B. Pitch de featuring pra Apple (aposta de alto retorno)
- A Apple tem um **formulário de "nominação de featuring"** (via App Store Connect / site de marketing da Apple). Submeta **3+ semanas antes** do lançamento.
- Eles favorecem: design excelente, uso de tecnologia recente, app localizado (você é 100% PT-BR — vantagem), e uma boa história. Escreva o pitch com o ângulo "app brasileiro, inglês para adultos que já desistiram, ciência da memória".
- Custo: 1 hora escrevendo. Retorno se pegar: featuring da Apple é o maior pico orgânico que existe pra um app. Vale a aposta mesmo com baixa probabilidade.

### 2C. Onda coordenada de criadores + comunidades
- Os 5 micro-criadores do `growth-plan-organico` publicam **no mesmo dia** (efeito de onda).
- Post de "está no ar" nas comunidades onde você já construiu reputação (Fase 1C).
- E-mail para a waitlist em ondas ao longo do dia.

---

## FASE 3 — Pós-lançamento: content-market fit → escalar

O erro clássico: gastar tudo tentando escalar antes de saber o que funciona. Faça o contrário.

### 3A. Achar o content-market fit (primeiras 2-4 semanas)
- Rode a grade do `growth-plan-organico` (volume: 1-2/dia, 2 plataformas).
- **Meça a métrica certa, não view:** taxa de **save + comentário + clique na bio + completion rate** (o fator nº1 do algoritmo, do teardown). View é vaidade.
- Toda semana (domingo): identifique os **2-3 vídeos** que puxaram save/clique acima da média. Esse é o sinal de content-market fit.
- **Regra de decisão:** o que bateu, você **refaz em 3-5 variações** na semana seguinte (mesmo tema, hooks diferentes). O que morreu, abandona. **Não democratize atenção entre formatos — concentre no que provou.**

### 3B. Ligar o loop de share card (o motor composto)
- Assim que o E3 (patrimônio/share card) estiver no ar: gatilhe o compartilhamento nos **momentos de pico emocional** — ao completar a primeira semana, ao bater um marco de frases, ao proteger o streak.
- O card tem que ser **on-brand e orgulhoso de mostrar** ("450 frases que não somem" > "eu uso o app X"). Benchmark: 5-10× de alcance orgânico por card compartilhado.
- **Amplifique:** reposte os cards dos usuários no seu perfil (prova social + incentiva mais gente a compartilhar). Vira Formato F (Prova Social) sem você produzir nada.
- **Desafio dos usuários:** transforme a Série "Desafio" do fundador num desafio que **os usuários entram** ("30 dias, poste seu progresso com #inglêsquenãosome"). Cada participante vira mídia.
- **Métrica do loop:** % de novos usuários que compartilham algo nos primeiros 7 dias. Se for baixo, o card não está bom ou o "aha" está tarde demais.

### 3C. Só então, escalar
- Com content-market fit achado + loop de share funcionando + retenção provada (balde não vaza) → aí sim vale intensificar criadores (subir tiers), testar um pouco de tráfego pago no formato campeão, e buscar as parcerias B2B2C (turmas/professores, roadmap 2.0).

---

## O que "crescimento histórico" realmente exige (a verdade)

Crescimento histórico de um app pequeno vem de **um** destes três, quase nunca de "mais posts":
1. **Um momento viral** — você não força, mas maximiza a superfície: volume de conteúdo × a narrativa de fundador × honestidade radical. Quanto mais tentativas, mais chance de uma quebrar.
2. **Um motor de retenção tão bom que o boca-a-boca compõe** — share loops + o produto de fato entregando "isso fica". Por isso o gap de conteúdo (0.3) é estratégico, não cosmético.
3. **Pegar carona numa onda maior** — o sentimento anti-Duolingo no Brasil é uma onda real e surfável. "Streak não é aprendizado" é uma bandeira que as pessoas compartilham.

A jogada do Lingrow é **fazer os três ao mesmo tempo**: superfície máxima de tentativas virais (build-in-public + Desafio), motor de retenção que não vaza (E1 + share loop), surfando a onda anti-Duolingo.

---

## Sequência mestra — o que fazer, em ordem

1. **Hoje:** migration 008 + retomar contrato Apple/RevenueCat (Fase 0.1-0.2).
2. **Esta semana:** decidir o gap de conteúdo (0.3); montar a landing de waitlist com referral (1B); **começar o build-in-public** (1A) — não espere nada.
3. **Semanas 1-2:** mapear e entrar nas comunidades, só ajudando (1C passos 1-3); ASO da loja (0.4).
4. **Semanas 3-4:** menções reativas + "procuro testers" nas comunidades (1C passo 4); submeter pitch de featuring Apple (2B); alinhar os 5 criadores.
5. **Semana de lançamento:** Product Hunt + onda de criadores + post nas comunidades + e-mail à waitlist em ondas (Fase 2).
6. **Pós:** content-market fit → ligar share loop → escalar só o que provou (Fase 3).

---

## Métricas por fase (o que olhar em cada momento)
| Fase | Métrica que importa | Ignore |
|---|---|---|
| Pré-lançamento | Inscrições na waitlist + taxa de referral | Views |
| Lançamento | Downloads D0 + ranking na loja + reviews | Vaidade de PH |
| Pós | Save/completion/clique-bio → onboarding completo → trial→pago (8%) | View isolado |
| Composto | % que compartilha nos 7 primeiros dias + downloads por share | — |

---

*Playbook sequenciado. Complementa o motor de conteúdo (`growth-plan-organico-2026-07.md`) e o teardown (`competitor-content-formats-2026-07.md`).*
*— Orion, orquestrando o sistema 🎯*
