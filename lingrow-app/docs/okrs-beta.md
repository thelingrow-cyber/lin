# Lingrow — OKRs do Beta

**Período:** 20 dias (~19 Mai → 08 Jun 2026)
**Contexto:** Beta lançado via 3 influenciadores + divulgação orgânica. Tudo gratuito. Foco em validar retenção, product-market fit e estabilidade técnica antes de ativar monetização.

---

## Como ler este documento

**Objective** = o que queremos alcançar (qualitativo, inspirador)
**Key Result** = como medimos que chegamos lá (número, data, sim/não)

Ao final dos 20 dias, cada KR recebe uma nota de 0 a 1:
- **0.7 a 1.0** = sucesso
- **0.5 a 0.6** = parcial, aprender e ajustar
- **< 0.5** = não validado, rever antes de escalar

---

## O1 — Provar que o Lingrow cria hábito real de estudo

> O maior risco do produto: usuários baixam, usam uma vez e somem. Este objetivo valida se o SRS + notificações funcionam para construir consistência.

| # | Key Result | Meta | Como medir |
|---|------------|------|------------|
| KR1 | Retenção D7 | ≥ 20% dos usuários que fizeram a primeira sessão voltaram no dia 7 | PostHog: sessões por usuário |
| KR2 | Retenção D14 | ≥ 12% dos usuários ainda ativos no dia 14 | PostHog: sessões por usuário |
| KR3 | Streak médio | Usuários ativos com streak ≥ 3 dias | Supabase: média de streak |
| KR4 | Sessões por usuário ativo | Média ≥ 5 sessões nos 20 dias | PostHog: eventos review_session_completed |

**Por que essas metas:** D7 > 20% é o benchmark mínimo de apps de hábito. Duolingo tem ~25%. Se chegarmos em 20% num beta sem onboarding otimizado, o produto tem fundamento sólido.

---

## O2 — Validar product-market fit com os primeiros usuários

> Os primeiros 100 usuários são os mais valiosos. Este objetivo garante que estamos ouvindo e aprendendo com eles antes de escalar.

| # | Key Result | Meta | Como medir |
|---|------------|------|------------|
| KR1 | Feedbacks via WhatsApp | ≥ 15 mensagens recebidas | Contagem manual no WhatsApp |
| KR2 | Feedbacks positivos espontâneos | ≥ 5 usuários que disseram algo positivo sem ser perguntados | Contagem manual |
| KR3 | Pedidos de feature identificados | ≥ 3 pedidos recorrentes documentados | Análise dos feedbacks |
| KR4 | Indicação orgânica | ≥ 3 usuários que indicaram o app para alguém | Pergunta direta nos feedbacks |

**Por que isso importa:** Product-market fit não é número — é sentimento. Se 15+ pessoas mandaram mensagem sem você pedir, o produto está ressoando. Se ninguém mandou nada, o problema não é retenção — é indiferença.

---

## O3 — Lançar e manter o beta com estabilidade técnica

> Um crash crítico no dia 1 dos influenciadores pode destruir o lançamento. Este objetivo garante que o produto aguenta a pressão do beta.

| # | Key Result | Meta | Como medir |
|---|------------|------|------------|
| KR1 | Downloads mínimos | ≥ 100 installs nos primeiros 7 dias | App Store Connect + Play Console |
| KR2 | Crashes críticos | 0 crashes que impeçam uso do app | Relatos de usuários + PostHog errors |
| KR3 | Tempo de resposta a bugs | Bugs críticos corrigidos em < 24h | Data de reporte vs data de fix no git |
| KR4 | Aprovação Apple/Google | Zero rejeições por policy violation | App Store Connect status |

---

## O4 — Preparar decisão de monetização com dados reais

> O beta é gratuito, mas não é férias. Usamos os 20 dias para coletar inteligência que guia a decisão de quando e como cobrar.

| # | Key Result | Meta | Como medir |
|---|------------|------|------------|
| KR1 | Feature premium identificada | ≥ 1 feature que usuários pediram e que está no escopo do premium | Análise de feedbacks |
| KR2 | Perfil de usuário pagador | Identificar características dos usuários mais engajados (profissão, uso, frequência) | PostHog + perguntas diretas |
| KR3 | Decisão de pricing documentada | Pricing final (valor, modelo) definido até o dia 20 | Documento em docs/ |

---

## Dashboard de acompanhamento

Revisar semanalmente:

| Semana | O que verificar |
|--------|----------------|
| Semana 1 (dias 1-7) | Downloads, crashes, primeiros feedbacks, D1 retention |
| Semana 2 (dias 8-14) | D7 retention, volume de feedbacks, bugs recorrentes |
| Semana 3 (dias 15-20) | D14 retention, padrões de uso, decisão de monetização |

---

## Critério de decisão ao final do beta

| Resultado | Decisão |
|-----------|---------|
| D7 ≥ 20% + ≥ 10 feedbacks positivos | ✅ Escalar — abrir para mais usuários, ativar monetização |
| D7 10-19% + feedbacks mistos | ⚠️ Iterar — identificar o que está quebrando a retenção e corrigir |
| D7 < 10% | 🔴 Pivotar — o problema é no produto, não no canal. Rever persona ou proposta de valor |
