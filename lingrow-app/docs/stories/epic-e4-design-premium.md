# Épico E4 — Percepção Premium: Acabamento Sensorial + Marca Aplicada

| Campo | Valor |
|-------|-------|
| Release | **1.2 "Percepção"** |
| Origem | `prd-v2.md` Bloco D (FR-D1..D6) · `ceo-review-2026-07.md` §6 · complementa a auditoria `ux-audit-2026-07.md` (achados H2/M3 ainda abertos) |
| Por quê | O app compete em percepção com Falou/ELSA (vozes neurais, acabamento). Micro-interações custam 10-15% de tempo extra e multiplicam satisfação. TTS robótico é o maior denunciante de "app barato" |
| Dependências | E1 (o texto final das 1000 frases é pré-requisito do áudio da E4.2). Demais stories independentes |
| Princípio | NADA decorativo. Cada animação/vibração comunica significado. Dark mode segue adiado |
| Estimativa | 5 stories · ~2 semanas |

## Contexto para quem implementa

- Design system: `theme/index.ts` (tokens: colors, fonts Plus Jakarta Sans, radius, shadow, spacing) — TODA nova constante entra ali, nunca inline.
- `react-native-reanimated` ~4.1 JÁ instalado. `expo-haptics` precisa ser adicionado (Expo SDK 54 — verificar versão compatível).
- Monograma: asset existe (`assets/images/icon.png` — "L + folha" gradiente). Precisará de variantes transparentes/tamanhos (pedir ao fundador o arquivo fonte, ou derivar do PNG 1024).
- Respeitar `reduce motion` do sistema em TODA animação (NFR7).

---

## Story E4.1 — Haptics semânticos (FR-D1)

**Como** usuário, **quero** sentir o app responder ao que importa **para que** cada acerto tenha peso físico.

### Mapa háptico (fechado — não expandir sem @po)

| Momento | Haptic (expo-haptics) |
|---------|----------------------|
| Resposta SRS good/easy | `impactAsync(Light)` |
| Resposta SRS again/hard | `impactAsync(Rigid)` (distinto, não punitivo) |
| 5 acertos seguidos | `impactAsync(Medium)` |
| Fim de sessão | `notificationAsync(Success)` |
| Capítulo/marco completo | `notificationAsync(Success)` + segundo pulso 150ms |
| Compra/trial confirmado | `notificationAsync(Success)` |
| Erro de rede/ação falhou | `notificationAsync(Warning)` |
| Navegação comum, toques de UI | **NADA** (regra: silêncio é o que dá significado ao resto) |

### Critérios de aceite
1. `lib/haptics.ts` centraliza tudo (`haptic.srsGood()`, `haptic.milestone()`, …) — nenhuma chamada direta a expo-haptics fora dele.
2. Toggle "Vibrações" em Configurações (default ON), persistido em settings locais; `lib/haptics.ts` respeita.
3. Todos os pontos do mapa implementados; nenhum ponto fora do mapa.
4. Android: degradação graciosa (Vibration API onde haptics finos não existem).

### Tasks
- [ ] expo-haptics + lib/haptics.ts + toggle
- [ ] Instrumentar os 8 pontos
- [ ] QA físico em iPhone e Android reais

---

## Story E4.2 — Áudio neural das 1000 frases (FR-D3) 💎 maior ROI de percepção

**Como** usuário, **quero** ouvir vozes humanas de verdade **para que** o app soe profissional e a pronúncia aprendida seja real.

### Abordagem técnica (decidida)
- Pipeline `scripts/content/generate-audio.ts`: para cada frase aprovada do bundle, gerar MP3/AAC mono com voz neural EN-US (provider a cotar na execução: OpenAI TTS `tts-1`/`gpt-4o-mini-tts`, ElevenLabs, ou Google WaveNet — critério: custo total < US$30 e qualidade nativa; estimativa CEO review: < US$20).
- 2 vozes (feminina + masculina) alternadas por frase (variedade auditiva; a MESMA frase sempre tem a mesma voz — determinístico por position par/ímpar).
- Upload para Supabase Storage bucket público `sentence-audio/` (`{position}.mp3`), servido com cache. Naming por position (imutável).
- App: `lib/audio.ts` — toca do cache local (expo-av/expo-audio); download lazy por capítulo (ao entrar no capítulo, baixa as 25); fallback = TTS nativo atual (sem rede, cards custom, ou arquivo ausente).

### Critérios de aceite
1. Pipeline gera+valida (duração > 0,5s, tamanho ≤ 60KB — NFR4) + faz upload; idempotente (re-rodar não regenera existentes).
2. Botão de áudio nas telas de estudo usa neural quando disponível, TTS como fallback transparente (usuário não vê erro).
3. Pré-download do capítulo ativo em wifi; indicador discreto se tocar antes de baixado (toca TTS e agenda download).
4. Cards custom/IA continuam 100% TTS (sem regressão).
5. Custo real documentado em `content/curation-log.md`.
6. Toggle em Config: "Voz: Natural (recomendado) / Sistema" (escape hatch se algo der errado em produção).

### Tasks
- [ ] Cotar provider + gerar piloto de 25 frases (1 capítulo) para aprovação do fundador
- [ ] Pipeline completo + upload Storage
- [ ] lib/audio.ts com cache/fallback/download por capítulo
- [ ] Rollout: capítulos A1 primeiro, resto em lotes

---

## Story E4.3 — Motion funcional (FR-D2)

**Como** usuário, **quero** que as transições me EXPLIQUEM o que aconteceu **para que** o app pareça vivo e caro sem me distrair.

### Especificação (fechada)
1. **Flip do card**: física de spring (reanimated `withSpring`, damping ~15) em vez do timing atual — o flip "assenta".
2. **Resposta SRS**: card desliza para fora na direção da resposta (esquerda again/hard, direita good/easy — direções já existem no swipeAnim atual) e o próximo entra por baixo com spring sutil. Duração total ≤ 350ms (velocidade de estudo intocada).
3. **Contador de patrimônio** (fim de sessão): número sobe animado (ex.: 82→87) com haptic leve por incremento de marco.
4. **Barra de progresso da sessão**: preenchimento animado contínuo (não em saltos).
5. **Transições de tela**: padrão único no design system — fade+slide 220ms, curva `Easing.out(cubic)` (token `motion` novo em theme).

### Critérios de aceite
1. Token `motion` no theme; TODAS as durações/curvas de lá.
2. `reduce motion` do sistema → todas as animações caem para fade 100ms.
3. FPS ≥ 55 em device médio durante sessão (medir com perf monitor).
4. Zero regressão na velocidade percebida do estudo (respostas em sequência rápida não enfileiram animação — interruptíveis).

### Tasks
- [ ] Token motion + refactor flip/swipe com spring
- [ ] Contador animado de patrimônio
- [ ] Transições padronizadas + reduce-motion
- [ ] Teste de performance em device real

---

## Story E4.4 — Marca aplicada + ilustrações (FR-D4, FR-D5)

**Como** marca, **quero** que o monograma e ilustrações próprias substituam ícones genéricos **para que** o Lingrow seja reconhecível dentro do próprio app (resolve H2 e M3 da auditoria UX).

### Critérios de aceite
1. Monograma real: login (substitui círculo+Ionicons leaf) e header da home (substitui "Lingrow 🌱" — o wordmark pode manter "Lingrow" texto + monograma pequeno). Asset em 3 tamanhos @1x/2x/3x, fundo transparente.
2. 5 ilustrações próprias, estilo flat, paleta da marca (roxo #6D28D9 + acentos do theme), direção de arte consistente entre elas: (a-c) 3 slides/passos do onboarding, (d) estado vazio "tudo em dia", (e) tela de celebração de capítulo. Produção: geração por IA (ideogram/midjourney) com direção + curadoria do fundador, OU designer freelancer — decidir por custo/prazo; specs de prompt/estilo documentadas em `content/illustration-style.md` para consistência futura.
3. PNGs otimizados (≤ 150KB cada, @2x suficiente).
4. Nenhum Ionicons removido de AÇÕES funcionais (voltar, config etc. continuam biblioteca — regra da auditoria UX §7.5).
5. Screenshot comparativo antes/depois das 4 telas para o fundador aprovar.

### Tasks
- [ ] Variantes do monograma (transparente, tamanhos)
- [ ] `content/illustration-style.md` + gerar/contratar as 5
- [ ] Aplicar nas 5 posições + aprovação visual
- [ ] Otimização de assets

---

## Story E4.5 — Paywall com narrativa de transformação (FR-D6)

**Como** usuário no paywall, **quero** ver o que o premium faz POR MIM (não uma lista de features) **para que** a decisão seja emocional e óbvia.

### Especificação de conteúdo (estrutura final)
1. **Topo personalizado**: patrimônio real do usuário — "Suas {owned} frases estão seguras. Imagine 1000." (usuário com 0: "1000 frases que não somem. A partir de hoje.")
2. **3 benefícios como resultado** (não feature): "IA monta seus decks — do SEU mundo" · "Veja seu inglês crescer (e provar que não some)" · "20× mais gerações de IA por mês".
3. Preços com âncora anual em destaque (R$179,90/ano ≈ R$15/mês, "mesmo preço do plano do Duolingo que NÃO tem IA"), mensal secundário, trial 14 dias explícito, compliance Apple intocado (EULA/termos/renovação — já resolvido).
4. Social proof: placeholder condicional (esconder até existirem depoimentos reais — NUNCA inventar).

### Critérios de aceite
1. Layout novo do `paywall.tsx` preservando TODA a lógica RevenueCat/compliance existente.
2. Header personalizado com dados de `lib/patrimony.ts`.
3. A/B ready: `paywall_variant` em analytics (baseline "v2_transformation").
4. Eventos existentes mantidos + `paywall_scroll_depth`.
5. Screenshot para aprovação do fundador antes do merge.

### Tasks
- [ ] Redesign do paywall (lógica intacta)
- [ ] Header patrimônio + textos finais
- [ ] Analytics de variante
- [ ] Aprovação visual + QA sandbox (compra segue funcionando)

---

## Gate do épico

- [ ] Piloto de áudio (25 frases) aprovado pelo fundador ANTES da geração em massa
- [ ] Ilustrações aprovadas pelo fundador
- [ ] @qa: velocidade de estudo não regrediu (motion interruptível), compra sandbox ok, FPS ok
- [ ] Toggle de haptics e voz funcionando (escape hatches)

— Orion, orquestrando o sistema 🎯
