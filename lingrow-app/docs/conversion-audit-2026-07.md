# Lingrow — Auditoria de Conversão de Ponta a Ponta (Julho 2026)

| Campo | Valor |
|-------|-------|
| Autor | Orion (@aiox-master) |
| Data | 2026-07-12 |
| Escopo | TODO o funil de conversão: página da loja → download → onboarding → Day-0 → trial (14 dias) → pagante → retenção → winback. Cada etapa avaliada contra o que existe no código e o que os épicos E1-E5 já cobrem |
| Insumos | Código real (`mobile-new/app/onboarding.tsx`, `paywall.tsx`, `ai-create.tsx`, `meu-ingles.tsx`), `prd-v2.md`, `ceo-review-2026-07.md`, `monetization-strategy-2026-07.md`, `ux-audit-2026-07.md`, `app-store-metadata.md`, `marketing/brand-positioning.md`, épicos E1-E5 |
| Gatilho | Pedido do fundador (12/07): app de alta conversão e completamente profissional, incluindo o padrão "análise → perguntas → plano" (referência: Prequel) e os materiais visuais dentro e fora do app |
| Documentos-filho | `prd-v2.md` (Bloco F, adicionado nesta data) · `stories/epic-e6-maquina-conversao.md` |

---

## 1. Sumário executivo

O plano existente (E1-E5) já resolve **o coração do funil**: onboarding com quiz (E2), paywall Day-0 (E2.4), narrativa de transformação no paywall (E4.5), retenção por patrimônio (E3) e conteúdo à altura (E1). O que esta auditoria encontrou são **6 buracos nas bordas do funil** — antes do download, entre o quiz e a primeira sessão, durante os 14 dias de trial, e depois que o trial expira. Nenhum deles exige reconstruir nada; todos são aditivos e a maioria é barata.

**Nota por etapa do funil (0-10, estado HOJE no código / estado APÓS E1-E5 como planejado):**

| # | Etapa do funil | Hoje | Pós E1-E5 | Gap restante |
|---|----------------|------|-----------|--------------|
| 1 | Página da loja (1º paywall real) | 3 | 3 | **GAP 5** — nada nos épicos toca a loja: descrição off-brand, screenshots pendentes, sem feature graphic |
| 2 | Onboarding: perguntas | 2 | 9 | — (E2.2 resolve) |
| 3 | Onboarding: "montando seu plano" (reveal) | 0 | 0 | **GAP 1** — E2 pula do quiz direto para a sessão; falta o momento de síntese |
| 4 | Primeira sessão + aha | 3 | 9 | — (E2.3 resolve) |
| 5 | Paywall Day-0 | 0 | 8 | — (E2.4 + E4.5 resolvem) |
| 6 | Superfícies de conversão no app | 3 | 4 | **GAP 2** — só 3 portas para o paywall; sem card na home, sem entrada em Config, sem regra de frequência |
| 7 | Jornada do trial (D0→D14) | 0 | 0 | **GAP 3** — nada acontece durante o trial: sem status visível, sem recap de valor, sem aviso de fim |
| 8 | Prova social / avaliações na loja | 0 | 0 | **GAP 4** — zero pedidos de avaliação (`expo-store-review` nem instalado); E4.5 esconde social proof "até existir" mas nada o produz |
| 9 | Retenção → reconversão | 2 | 9 | — (E3 resolve) |
| 10 | Winback (trial expirado / churn) | 0 | 0 | **GAP 6** — usuário que não converteu no trial nunca mais vê uma oferta contextualizada |

---

## 2. O funil completo, mapeado contra o que existe

```
LOJA                ONBOARDING                    DAY-0            TRIAL D0-D14        PAGANTE          AUSENTE/CHURN
├─ descrição   ┌─ Promessa (E2.2)          ┌─ tela-semente   ┌─ ???            ┌─ Meu Inglês     ┌─ volta sem culpa
├─ screenshots ├─ Objetivo (E2.2)          ├─ permissão      │  (GAP 3:        │  profundo       │  (E3.2) ✓
├─ avaliações  ├─ Nível (E2.2)             │  notif (E2.3)   │  vazio hoje)    │  (E3.6) ✓       ├─ winback
│  (GAP 4/5)   ├─ Meta (E2.2)              ├─ paywall 1×     ├─ D7 recap?      ├─ widget         │  (GAP 6: vazio)
│              ├─ [GAP 1: plano reveal]    │  (E2.4) ✓       ├─ aviso D12?     │  (E3.4) ✓       └─ share card
│              ├─ placement (E1.4, 1.1)    └─ home           └─ fim do trial   └─ notif conteúdo    reaquisição
│              └─ 1ª sessão (E2.3) ✓                            → ???             (E3.5) ✓          (E3.3) ✓
```

**Portas de entrada do paywall hoje (verificado no código):** exatamente 3 — (1) alerta de limite de quota em `ai-create.tsx:541`, (2) link "ver planos" em `ai-create.tsx:564`, (3) tela de bloqueio em `meu-ingles.tsx:91`. O E2.4 adiciona a 4ª (pós-onboarding, 1×). Não há NENHUMA outra superfície: a home não menciona premium, Configurações não tem entrada de assinatura, fim de sessão não tem. Para um app freemium, isso é um funil com 4 portas num prédio de 15 salas.

---

## 3. Os 6 gaps em detalhe

### GAP 1 — Falta o "montando seu plano" (o momento Prequel/Noom) 🎯 maior alavanca por real investido

**Evidência:** E2.2 termina no passo 3 (meta) e E2.3 diz "ao completar o passo 3, navegar DIRETO para `study/[deckId]`". Não existe tela de síntese entre as respostas e a ação.

**Por que importa:** o padrão consagrado dos apps de assinatura de alta conversão (Prequel, Noom, Simple, Flo) insere, entre o quiz e o produto, uma tela de "analisando suas respostas → seu plano está pronto". Ela cumpre 3 funções psicológicas: (a) **prova que as respostas foram usadas** (sem ela, o quiz parece burocracia), (b) **cria o efeito de posse do plano** ("MEU plano" → abandonar o app = abandonar algo seu), (c) **arma o paywall** — quando o paywall chega (E2.4), ele vende a aceleração de um plano que o usuário já aceitou como dele.

**Correção:** 1 tela nova entre E2.2 e E2.3 (story E6.1) — análise animada curta (2-3s, honesta: os passos mostrados são reais) + resumo do plano personalizado (objetivo, nível de entrada, meta, projeção aritmética honesta). Zero backend.

### GAP 2 — Superfícies de conversão: 4 portas, nenhuma proativa, nenhuma regra

**Evidência:** grep em `mobile-new/app/` — `router.push('/paywall')` só nos 3 pontos citados. Nenhum componente de banner/card premium existe. Configurações não tem linha de assinatura (o assinante nem consegue VER o status do que paga).

**Por que importa:** ~50% das conversões acontecem no Day 0 (RevenueCat 2026, já citado no CEO review) — mas os outros 50% acontecem DEPOIS, e precisam de portas. A regra de ouro é densidade com respeito: superfícies contextuais (baseadas no patrimônio real do usuário), com teto de frequência, nunca bloqueando o free.

**Correção:** story E6.2 — mapa fechado de superfícies (card na home, linha em Config, momento pós-marco) + regra global de frequência + `source` instrumentado em TODO acesso ao paywall (hoje não dá para saber DE ONDE veio quem converte).

### GAP 3 — O trial de 14 dias é uma caixa-preta

**Evidência:** nenhum arquivo do app ou story dos épicos trata o período do trial. O usuário inicia o trial no Day-0 (E2.4) e... nada mais acontece de específico até a cobrança.

**Por que importa:** o argumento do trial de 14 dias (monetização §2) é "a promessa precisa de tempo para se provar: o loop do SRS leva dias até a primeira revisão chegar na hora certa". Ora — se a mágica acontece no D3-D7, alguém precisa **apontar para ela quando acontece**. E o fim do trial sem aviso é a maior fonte de cancelamento raivoso + pedido de reembolso + review de 1 estrela da categoria.

**Correção:** story E6.3 — status do trial visível, recap de valor no D7 ("na 1ª semana: N frases suas, X% retidas"), aviso transparente 2 dias antes da cobrança (transparência é literalmente o posicionamento da marca — o anti-indústria-que-lucra-com-descuido), e re-apresentação única do paywall pós-expiração.

### GAP 4 — Zero produção de prova social (e a loja converte por avaliação)

**Evidência:** `expo-store-review` não está no projeto (grep vazio). Nenhuma story pede avaliação. E4.5 corretamente esconde depoimentos "até existirem reais" — mas nenhum mecanismo os produz.

**Por que importa:** nota e volume de avaliações são o 2º maior fator de conversão da página da loja (depois dos screenshots). O app tem momentos genuinamente felizes planejados (fim de capítulo E1.5, marcos E3.3, recuperação E3.2) — pedir avaliação NESSES momentos é padrão da categoria e custa 1 dia de dev.

**Correção:** story E6.4 — `expo-store-review` com gating rígido (só momentos positivos, máx 1 pedido/60 dias, respeitando o teto de 3×/ano da Apple).

### GAP 5 — A loja é o primeiro paywall e está desalinhada da marca

**Evidência (`app-store-metadata.md`):** a descrição atual diz "Ideal para inglês, espanhol e outros idiomas" (contradiz o não-goal do PRD v2: só inglês) e "Estude 5 cards por dia" (vocabulário "cards" vs. "frases" da marca); não usa o hook "Inglês que não some" nem fala com quem já tentou (princípio nº 1 do tom de voz). Screenshots 6.7"/6.1" seguem "❌ Pendente". Não existe feature graphic do Play Store (o banner 1024×500 que o usuário vê antes de decidir baixar). O ícone Android publicado é o template do Expo (C1 da auditoria UX — corrige junto).

**Por que importa:** todo o investimento de E2-E4 amplifica o tráfego que CHEGA — e a página da loja decide quanto tráfego vira download. É também um gate prático: a submissão da 1.0.5 precisa de screenshots novos de qualquer forma (o app muda visualmente com E2).

**Correção:** story E6.5 — reescrita on-brand da ficha (App Store + Play Store), roteiro de 6 screenshots com headline cada, feature graphic, executados APÓS E2/E6.1 prontos (screenshots mostram o app novo, não o velho).

### GAP 6 — Quem não converteu no trial desaparece do funil para sempre

**Evidência:** nenhum tratamento para `trial expirado sem conversão` ou `assinante cancelado` em código ou stories. A tela de volta sem culpa (E3.2) trata ausência, não churn de pagamento.

**Por que importa:** ~72% dos assinantes cancelam no ano 1 (RevenueCat, citado no CEO review §3). Ex-trialists são o público mais barato de reconverter — já conheceram o produto.

**Correção:** story E6.6 (1.2, deliberadamente enxuta) — variante da tela de retorno para ex-trial/ex-assinante, paywall com contexto winback, pesquisa de 1 pergunta no cancelamento. Ofertas win-back nativas da App Store: investigar na execução, sem promessa.

---

## 4. O que NÃO precisa de nada novo (anti-duplicação — Artigo IV)

Para deixar explícito o que esta auditoria **não** vai duplicar, porque E1-E5 já cobrem:

| Já coberto | Onde |
|------------|------|
| Quiz de onboarding (objetivo/nível/meta) | E2.2 |
| Primeira sessão personalizada + aha 60s | E2.3 |
| Pedido de notificação no momento certo | E2.3 |
| Paywall Day-0 (1×, com contexto) | E2.4 |
| Funil instrumentado do onboarding | E2.4 |
| Placement test | E1.4 |
| Narrativa de transformação no paywall + A/B ready | E4.5 |
| Patrimônio no free (prova da promessa) | E3.1 |
| Volta sem culpa / streak sem punição | E3.2 |
| Share cards (aquisição orgânica) | E3.3 |
| Widget iOS | E3.4 |
| Notificação com conteúdo | E3.5 |
| Gancho de permanência premium | E3.6 |
| Preço, trial 14d, formato freemium | monetization-strategy v2.0 |
| Ícone Android/splash/marca nos pontos de identidade | UX audit C1-C3 + E4.4 |
| Ilustrações do onboarding | E4.4 (nota: cobre os passos do E2, incluir a tela E6.1) |

## 5. Métricas novas que o E6 precisa instrumentar

| Métrica | Baseline | Meta | Fonte |
|---------|----------|------|-------|
| Conversão da página da loja (impressão→download) | desconhecida (capturar) | melhorar vs baseline pós E6.5 | App Store Connect / Play Console |
| plan_reveal → primeira sessão | — | ≥ 90% | PostHog (E6.1) |
| paywall_viewed por `source` | não instrumentado | 100% dos acessos com source | PostHog (E6.2) |
| Trial→paid D35 | — | ≥ 8% (meta PRD existente, agora com jornada ativa) | RevenueCat |
| Avaliações na loja | ~0 | ≥ 20 avaliações até o fim do ciclo 1.1 | App Store Connect |
| Reconversão winback | — | capturar baseline (sem meta na v1) | RevenueCat + PostHog |

## 6. Riscos e limites desta análise

1. **Não inchar a 1.0.5** (risco nº 5 do PRD v2): só E6.1 e E6.5 entram na 1.0.5 — E6.1 porque é 1 tela que multiplica o E2, E6.5 porque a submissão exige screenshots de qualquer forma. Todo o resto é 1.1+.
2. **Frequência de superfícies**: o mesmo mecanismo que converte, irrita quando mal calibrado. As regras de teto do E6.2 são invioláveis (constituição da marca: anti-spam é posicionamento).
3. **Benchmarks direcionais**: os padrões Prequel/Noom vêm de apps com milhões de usuários e times de growth; o efeito no Lingrow será direcional. O funil instrumentado (E2.4 + E6.2) existe justamente para substituir analogia por dado.
4. **Textos**: todos os textos das stories E6 seguem `brand-positioning.md` §7 e são FINAIS — mesma regra dos épicos existentes (mudança só via @po).

---

*Execução: `stories/epic-e6-maquina-conversao.md`. Requisitos formais: `prd-v2.md` Bloco F.*

— Orion, orquestrando o sistema 🎯
