# Epic: Lingrow v2 — IA + Monetização (Plano de Execução)

| Campo | Valor |
|-------|-------|
| Epic ID | `ia-monetizacao` |
| Autor | @pm (Morgan) |
| Data | 2026-06-11 |
| Status | Plano aprovado — pronto para Fase 0 |
| Complexidade | COMPLEX (IA + pagamento + freemium em produção) |
| Conceito da feature | `docs/features/ai-deck-creator.md` |

---

## Objetivo

Implementar a feature "Criar Cards com IA" e a monetização freemium (paywall + trial) **sem quebrar nada** do app que já está em produção, de forma **aditiva** e validada fase a fase.

---

## Princípios anti-quebra (valem em TODAS as fases)

1. **Tudo aditivo.** Nenhuma fase altera o comportamento existente (SRS, decks, auth, contagem). Só acrescenta.
2. **QA gate entre fases.** Uma fase só começa quando a anterior passou no @qa. Sem pular.
3. **Teste de regressão obrigatório** a cada fase em 2 pontos sensíveis: a **contagem de cards / DECK_1000** (recém-consertada no commit `dd33f6a`) e a **auth**.
4. **Feature flag.** A IA entra atrás de uma flag que permite ligar/desligar sem novo build, e protege o lançamento.
5. **Migrações reversíveis.** Todo schema novo (quota, premium) é aditivo e tem rollback.
6. **Motor isolado primeiro.** A lógica de IA é construída e testada sozinha antes de ganhar tela.

---

## Encadeamento de Agentes (visão geral)

```
FASE 0  @architect → @data-engineer        [Fundação técnica]
            │  (gate: design aditivo validado)
FASE 1  @sm → @po → @dev → @qa             [Motor de IA isolado]
            │  (gate: gera cards válidos standalone)
FASE 2  @sm → @po → @dev → @qa             [Caminho A: criar deck com IA + revisão]
            │  (gate: não afeta contagem/DECK_1000)
FASE 3  @sm → @po → @dev → @qa             [Caminho B: gerar dentro do deck]
            │  (gate: reuso do motor, sem regressão)
FASE 4  @sm → @po → @dev → @qa             [Quota / freemium gating]
            │  (gate: free limita, premium libera)
FASE 5  @architect → @dev → @qa            [Paywall RevenueCat + trial 7 dias]
            │  (gate: features grátis seguem grátis; compra sandbox OK)
FASE 6  @devops                            [Build EAS + Submit Apple/Google 1.0.4]
```

---

## Fase 0 — Fundação Técnica (NÃO codar feature ainda)

**Objetivo:** desenhar a arquitetura antes de qualquer linha de feature.

| Agente | Entrega |
|--------|---------|
| **@architect (Aria)** | Documento de arquitetura: estrutura da Edge Function de geração; contrato do motor (`tema + nível + qtd → Card[]`); escolha de modelo de IA (qualidade vs custo); estratégia de premium-gating; **mapa de risco do que NÃO tocar** (DECK_1000, contagem, auth, SRS) |
| **@data-engineer (Dara)** | Schema aditivo: tabela de uso/quota (gerações por usuário/mês), campo `is_premium` no perfil, RLS. Migração reversível. |

**Gate 0 (@architect):** confirma que o design é 100% aditivo, sem breaking change. Só então abre a Fase 1.

> Nota: o **custo da IA** fica para depois (decisão do fundador). A @architect desenha a arquitetura agora; o número de custo entra quando formos calibrar limites e preço.

---

## Fase 1 — Motor de IA (isolado e testável)

**Objetivo:** a lógica de geração funciona sozinha, sem UI.

- **@sm:** story "Edge Function de geração de cards + cliente `generateCards()`"
- **@po:** valida a story (escopo, AC, dependências)
- **@dev:** implementa a Edge Function (chave da API no servidor) + função cliente que retorna `Card[]` no formato do app
- **@qa:** testa — gera cards válidos, trata rede/erro/resposta malformada, respeita o formato (frente EN + verso PT + nota)

**Gate 1:** motor gera cards corretos de forma isolada. Sem isso, não há UI.

---

## Fase 2 — Caminho A: Criar deck com IA + Tela de revisão

**Objetivo:** o fluxo principal de ponta a ponta.

- **@dev:** tela de entrada (campo + chips-atalho + Gerar) → chama o motor → **tela de revisão** (apagar/editar/aprovar) → `saveDeck()` + `saveCards()`
- **@qa:** valida o fluxo + **regressão da contagem/DECK_1000** (crítico)

**Gate 2:** cria deck novo sem afetar a contagem nem o DECK_1000.

---

## Fase 3 — Caminho B: Gerar dentro de um deck existente

**Objetivo:** o segundo ponto de entrada (custo baixo, reusa tudo).

- **@dev:** botão "Gerar mais cards" dentro do deck → reusa motor + tela de revisão → `saveCards()` no deck atual (chip pré-preenchido com o tema do deck)
- **@qa:** valida reuso + regressão

**Gate 3:** funciona sem duplicar lógica e sem regressão.

---

## Fase 4 — Quota / Freemium Gating

**Objetivo:** aplicar os limites em camadas (grátis restrito, premium generoso).

- **@dev:** contagem de gerações por usuário/mês; limites free (2-3 ger., 5 cards) vs premium (20/20); mensagens de limite + linha de quota ("✨ X restantes"); CTA de upgrade
- **@qa:** valida que o grátis limita corretamente e o premium libera

**Gate 4:** os limites funcionam nos dois níveis sem furo.

---

## Fase 5 — Paywall (RevenueCat / In-App Purchase)

**Objetivo:** cobrar do jeito que a Apple exige.

- **@architect:** valida integração RevenueCat + produtos IAP + lógica de trial 7 dias
- **@dev:** integra RevenueCat (iOS IAP + Google Play), tela de paywall, ativação premium, trial de 7 dias
- **@qa:** testa compra em **sandbox**, ativação/expiração do trial, e **regressão: tudo que era grátis continua grátis**

**Gate 5:** compra funciona em sandbox; zero regressão nas features gratuitas.

> ⚠️ Regra crítica: conteúdo digital no iOS **deve** usar IAP da Apple via RevenueCat — nunca Stripe/Pix/link externo, sob pena de rejeição.

---

## Fase 6 — Release

- **@devops (Gage):** `eas build` + `eas submit` (versão 1.0.4), criação da versão no App Store Connect + Play Console, submissão para revisão.

> O 1.0.3 que estava "na agulha" é absorvido por esta versão maior (decisão de lançar completo).

---

## Modelo recomendado por fase

| Fase | Modelo sugerido | Razão |
|------|-----------------|-------|
| 0 — Arquitetura | **Fable / Opus** | Decisões de design pesadas |
| 1-4 — Implementação | Sonnet | Trabalho estruturado, mais rápido |
| 5 — Paywall | **Fable / Opus** | Integração crítica, regras da Apple |
| 6 — Release | Sonnet | Execução de comandos |

---

## Próximo passo imediato

**Fase 0 com @architect (Aria).** Trocar para Fable antes de iniciar. Aria desenha a arquitetura aditiva e o mapa de risco; @data-engineer prepara o schema de quota.

— Morgan, planejando o futuro 📊
