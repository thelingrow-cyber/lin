# Release 1.0.5 "Receita" — Plano de Execução e Encadeamento de Agentes

| Campo | Valor |
|-------|-------|
| Autor | Orion (@aiox-master) |
| Data | 2026-07-12 |
| Escopo | Onda 1.0.5 completa (E2.1-E2.4 + E6.1 + E6.5) com dono, encadeamento e paralelização; ondas 1.1/1.2 do E6 mapeadas em resumo |
| Workflow | Story Development Cycle (SDC) — as stories dos épicos E2/E6 já nascem draftadas com AC e textos finais (equivale à fase @sm concluída) |

---

## 1. Análise: o agente certo para cada story

### Onda 1.0.5 (executar já)

| Ordem | Story | Dono principal | Apoio | Por que este agente |
|-------|-------|----------------|-------|---------------------|
| 1 | **E2.1** Migration 007 (perfil de aprendizado) | **@data-engineer (Dara)** | @dev (código do store) | DDL, RLS e rollback são autoridade delegada de @architect→@data-engineer (matriz de autoridade). A extensão de `getSettings/saveSettings` é código de app → @dev |
| 2 | **E2.2** Onboarding 4 passos | **@dev (Dex)** | @po (guardião dos textos) | Implementação pura de UI/estado; textos já são FINAIS no épico — qualquer mudança passa por @po |
| 3 | **E6.1** Plan-reveal ("montando seu plano") | **@dev (Dex)** | @ux-design-expert (revisão visual) | 1 tela nova integrada ao stepper do E2.2 — mesmo contexto de código, mesmo dono. Uma revisa hierarquia visual antes do QA |
| 4 | **E2.3** Primeira sessão + tela-semente | **@dev (Dex)** | — | Parametrização de sessão + tela nova + mover pedido de notificação |
| 5 | **E2.4** Paywall Day-0 + funil | **@dev (Dex)** | **@qa (Quinn)** E2E sandbox | Prop `context` no paywall + eventos; o teste de compra sandbox de ponta a ponta é gate do @qa |
| 6 | **E6.5** Loja (ficha + screenshots + feature graphic) | **@ux-design-expert (Uma)** dirige assets · **@pm (Morgan)** escreve a ficha | @devops (upload) · fundador (aprovação) | Copy de loja é posicionamento de produto (@pm, sobre `brand-positioning.md`); screenshots/feature graphic são direção de arte (@ux). Upload em ASC/Play Console é EXCLUSIVO de @devops |
| 7 | **Gate de release** | **@qa (Quinn)** | — | Regressão (contagem/streak/auth), funil PostHog verificado, compra sandbox OK, onboarding completion > 70% com ≥ 5 testadores |
| 8 | **Push + PR + build EAS + submissão** | **@devops (Gage)** | — | Autoridade EXCLUSIVA de git push, PR e release |

### Ondas seguintes do E6 (resumo)

| Release | Story | Dono | Apoio |
|---------|-------|------|-------|
| 1.1 | E6.2 Superfícies de conversão | @dev | @po (textos), @qa (regra anti-spam é gate) |
| 1.1 | E6.3 Jornada do trial | @dev | @qa (ciclo sandbox trial acelerado) |
| 1.1 | E6.4 Review prompts | @dev | @qa (gating 60 dias) |
| 1.2 | E6.6 Winback v1 | @dev | @architect (spike win-back offers, timebox 1 dia) |

## 2. Encadeamento (a corrente de cada story)

```
[épico = stories draftadas ✓]
        │
        ▼
@po *validate ──► @dev implementa ──► @qa gate ──► próximo elo
   (10-point)      (código+testes)     (PASS/FAIL)
                                          │ FAIL → volta ao @dev (máx 2 iterações, depois QA Loop)
                                          ▼ PASS
                              acumula na branch da release
                                          │
                          [todas as stories da onda PASS]
                                          ▼
              @qa gate de RELEASE ──► @devops: push + PR + build EAS + submissão
                                          ▲
              fundador: aprovações (ficha, teste com 5 pessoas, setup ASC/RevenueCat)
```

**Sequência com paralelização da 1.0.5:**

```
E2.1 (Dara+Dex) ──► E2.2 (Dex) ──► E6.1 (Dex) ──► E2.3 (Dex) ──► E2.4 (Dex+Quinn)
                                                                        │
E6.5a ficha da loja (Morgan) ── pode começar HOJE (não depende de código) ─┤
E6.5b screenshots (Uma) ── SÓ depois de E2+E6.1 prontos (app novo na tela) ┤
                                                                        ▼
                                              gate @qa ──► @devops (build+submissão)
```

**Trilha do fundador (paralela, não bloqueia código, mas bloqueia a SUBMISSÃO):**
1. Setup App Store Connect (2 produtos IAP) + RevenueCat + webhook secret (checklist em `fase-5-paywall-plano.md`) — pendência externa nº 1.
2. Aprovar a ficha da loja (E6.5a) quando Morgan entregar.
3. Testar o onboarding novo com ≥ 5 pessoas reais (gate do E2).

## 3. Regras de execução desta onda

1. **Migration 007**: escrever + testar local primeiro; `supabase db push` em produção SÓ com confirmação explícita do fundador (snapshot antes) — mesma regra da 006.
2. **Textos**: os dos épicos são finais; @dev não improvisa copy (Artigo IV).
3. **Commits**: convencionais com referência de story (`feat: ... [E2.2]`); push SEMPRE via @devops.
4. **Cada story fecha com**: typecheck + lint + testes passando; checkboxes do épico atualizados.

## 4. Status de execução

| Story | Status |
|-------|--------|
| E2.1 | ✅ **completa** — migration 007 aplicada em produção (`ireppvpjhtapnekmucam`) em 2026-07-12 via SQL Editor; store estendido; testes verdes |
| E2.2 | ✅ código completo — onboarding 4 passos + analytics + modal de meta só para legados · ⏳ QA manual Expo Go |
| E6.1 | ✅ código completo — plan-reveal 2 fases, CTA entrega na primeira sessão · ⏳ QA manual |
| E2.3 | ✅ código completo — sessão parametrizada por nível, tela-semente, permissão de notificação no momento certo · ⏳ QA manual |
| E2.4 | ✅ código completo — paywall com contexto Day-0, flag `paywall_d0_shown`, funil instrumentado · ⏳ E2E sandbox (depende do setup RevenueCat/ASC) |
| E6.5a (ficha) | — pode iniciar em paralelo (@pm) |
| E6.5b (screenshots) | — depende de QA visual do fluxo acima |
| Gate release | — @qa após QA manual + setup externo |

**Fluxo Day-0 completo em código (2026-07-12):**
`login → onboarding (promessa → objetivo → nível → meta) → "montando seu plano" → 5 frases do seu nível → tela-semente (+ permissão de notificação) → paywall Day-0 → home`

**Bloqueios reais restantes para a 1.0.5:** (1) setup App Store Connect + RevenueCat (fundador), (2) QA manual do fluxo no Expo Go, (3) ficha + screenshots da loja (E6.5).

*(Atualizar esta tabela a cada story concluída.)*

— Orion, orquestrando o sistema 🎯
