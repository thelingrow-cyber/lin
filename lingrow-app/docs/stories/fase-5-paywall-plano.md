# Fase 5 — Paywall RevenueCat (Plano de Execução Detalhado)
## Lingrow v1.0.5

| Campo | Valor |
|-------|-------|
| Epic | `ia-monetizacao` (Fase 5) |
| Versão alvo | 1.0.5 |
| Pré-requisito | 1.0.4 em revisão Apple |
| Complexidade | CRITICAL (pagamento + regras Apple + regressão freemium) |
| Documento pai | `docs/stories/epic-ia-monetizacao.md` |

---

## Contexto — o que JÁ existe (migração 004)

A migração `004_ai_quota_premium.sql` já criou e está em produção:
- ✅ `user_settings.is_premium` (booleano, default `false`)
- ✅ `user_settings.premium_expires_at` (timestamp)
- ✅ `ai_usage` com quota mensal por usuário
- ✅ `consume_ai_generation()` race-safe + `refund_ai_generation()`
- ✅ `app_config` (feature flags)

**A Fase 5 NÃO recria nada — apenas ativa o que já existe e conecta ao RevenueCat.**

---

## Setup manual (fundador)

> ⚠️ **DESATUALIZADO — não siga os valores desta seção.** Os preços e o trial foram
> revisados pela `monetization-strategy-2026-07.md` v2.0 (R$24,90/mês · R$179,90/ano ·
> trial de **14** dias, não 7). O checklist correto, com os nomes exatos que o código
> espera, vive em **`docs/stories/revenuecat-setup-checklist.md`**.

---

## Encadeamento de agentes

```
Fase 5.0   @architect + @data-engineer  [Fundação — Fable 5]
              │ gate: arquitetura validada + migração 006 pronta
Fase 5.1   @sm → @po → @dev → @qa       [SDK + Webhook]
              │ gate: compra sandbox atualiza is_premium via webhook
Fase 5.2   @sm → @po → @dev → @qa       [Tela de Paywall]
              │ gate: tela renderiza, botão abre IAP, compra ativa premium
Fase 5.3   @sm → @po → @dev → @qa       [Trial + Restore + Expiração]
              │ gate: trial 7 dias + restore + zero regressão freemium
@devops    build EAS + submit 1.0.5
```

---

## Documentos a criar

| Documento | Agente | Caminho |
|-----------|--------|---------|
| Arquitetura do paywall | @architect | `docs/architecture/paywall-architecture.md` |
| Migração 006 | @data-engineer | `supabase/migrations/006_revenuecat_entitlements.sql` |
| Rollback 006 | @data-engineer | `supabase/rollbacks/006_revenuecat_entitlements_rollback.sql` |
| Story IA-5.1 | @sm → @po | `docs/stories/ia-5.1.revenuecat-sdk.story.md` |
| Story IA-5.2 | @sm → @po | `docs/stories/ia-5.2.paywall-ui.story.md` |
| Story IA-5.3 | @sm → @po | `docs/stories/ia-5.3.trial-restore.story.md` |

---

## Fase 5.0 — Fundação (Fable 5 — @architect + @data-engineer)

### @architect entrega (`docs/architecture/paywall-architecture.md`)
- Versão do SDK: `react-native-purchases` v8+ (compatível Expo SDK 54)
- Mapa de integração: onde `usePremium()` vive; como a tela de paywall é invocada; como o `isPremiumUser()` atual em `lib/ai.ts` é substituído pela entitlement RevenueCat
- Feature flag: `paywall_enabled` em `app_config` nasce `false` (seguro em produção)
- Mapa do que NÃO tocar: 1000 frases, SRS, auth, contagem, decks existentes
- Webhook: Edge Function `revenuecat-webhook` recebe eventos compra/cancelamento/expiração e atualiza `user_settings`

### @data-engineer entrega — migração 006 (100% aditiva)
```sql
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS revenuecat_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free'
    CHECK (subscription_status IN ('free','trial','active','expired','cancelled'));

INSERT INTO app_config (key, value)
  VALUES ('revenuecat_webhook_secret', '') ON CONFLICT DO NOTHING;
INSERT INTO app_config (key, value)
  VALUES ('paywall_enabled', 'false') ON CONFLICT DO NOTHING;
```

---

## Fase 5.1 — SDK + Webhook (Story IA-5.1)
- Instalar `react-native-purchases` via `npx expo install`
- Inicializar no boot com SDK Key (`EXPO_PUBLIC_RC_API_KEY`)
- Edge Function `revenuecat-webhook`: valida HMAC, atualiza `is_premium` + `subscription_status`
- Hook `usePremium()` em `lib/premium.ts`: consulta entitlements em tempo real
- `supabase secrets set REVENUECAT_WEBHOOK_SECRET=...`

**Gate IA-5.1:** compra sandbox no TestFlight ativa `is_premium = true`. Webhook logado.

---

## Fase 5.2 — Tela de Paywall (Story IA-5.2)
- `app/paywall.tsx`: proposta de valor + 2 planos (anual destacado) + "Experimentar 7 dias grátis" + "Restaurar compra" + link Termos/Privacidade
- Invocado pelo CTA de upgrade (IA restrita, seletor 10/15/20 cards)
- Fechar sem comprar volta sem forçar compra
- Design system: `#6D28D9`, Plus Jakarta Sans

**Gate IA-5.2:** tela renderiza, botão abre sheet Apple, compra reflete sem reiniciar.

---

## Fase 5.3 — Trial + Restore + Expiração (Story IA-5.3)
- Trial 7 dias: RevenueCat gerencia; validar `subscription_status = 'trial'` = premium ativo
- Restore: `Purchases.restorePurchases()` reativa premium
- Expiração: webhook `EXPIRATION` → `is_premium = false`, `subscription_status = 'expired'`
- Cancelamento: webhook `CANCELLATION` → mantém premium até fim do período, depois expira
- Regressão: TODAS as features grátis continuam sem assinatura

**Gate IA-5.3 (mais crítico):**
- ✅ Trial ativa premium 7 dias
- ✅ Expiração forçada (sandbox) desativa premium
- ✅ Restore funciona em reinstalação
- ✅ 1000 frases / SRS / notificações funcionam sem premium
- ✅ Compra sandbox registrada no RevenueCat dashboard

---

## @devops — Build e Submit 1.0.5
```
eas build --platform ios --profile production
eas submit --platform ios --latest
```
- Bump `1.0.4 → 1.0.5` em `app.json`
- Novidades: "Plano Premium disponível — experimente 7 dias grátis. IA generosa, decks ilimitados."

---

## Regras anti-quebra (todas as stories)
1. `paywall_enabled` nasce `false` — paywall invisível até validado
2. Nenhuma feature gratuita existente é alterada
3. Regressão obrigatória a cada gate: 1000 frases, SRS, auth, quota IA free
4. Migração 006 100% aditiva
5. Webhook com HMAC — nunca aceitar POST sem validação
6. `EXPO_PUBLIC_RC_API_KEY` nunca no código — variável de ambiente EAS

---

## Modelo por fase
| Fase | Modelo | Razão |
|------|--------|-------|
| 5.0 Arquitetura | Fable 5 | Decisões críticas de pagamento |
| 5.1–5.3 Implementação | Sonnet | Execução estruturada |
| Gates QA | Fable 5 | Auditoria segurança + regressão |
| @devops | Sonnet | Execução de comandos |

---

## Comando para iniciar (após setup manual)
> "@architect, leia `docs/stories/fase-5-paywall-plano.md`. Entregue `docs/architecture/paywall-architecture.md`. Após aprovado, passe para @data-engineer criar a migração 006."
