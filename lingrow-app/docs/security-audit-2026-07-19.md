# Auditoria de Segurança & Produto — Lingrow (2026-07-19)

| Campo | Valor |
|-------|-------|
| Auditor | @aiox-master (Orion) · Fable 5 |
| Escopo | `mobile-new/` (app), `supabase/` (migrations 001-007 + 3 edge functions), fluxos de onboarding/paywall/IA |
| Método | Leitura do código, migrations e edge functions; cruzamento com `technical-debt-assessment-2026-07.md` (2026-07-05) para reportar **só o que é novo** |
| Baseline | A auditoria de 05/07 é **anterior à migration 006 e ao épico E6** — os achados abaixo são posteriores a ela |

---

## 1. 🔴 CRÍTICO — Segredo do webhook do RevenueCat vaza para qualquer usuário logado

**ID:** S1 · **Status:** corrigido nesta sessão (migration 008, pendente de aplicação manual)

### O que é
O segredo que autentica o webhook do RevenueCat (`revenuecat_webhook_secret`) é guardado na tabela `app_config`. A policy de RLS dessa tabela (criada na migration 004) é:

```sql
CREATE POLICY "authenticated_read_app_config" ON app_config
  FOR SELECT TO authenticated USING (true);   -- lê TUDO
```

Quando a 004 criou essa regra, `app_config` só tinha `ai_enabled` (não sensível). A **migration 006 inseriu o segredo do webhook na mesma tabela** — e a regra aberta passou a expô-lo. Qualquer usuário autenticado, com a anon key (que está hardcoded no app, por design) + o próprio JWT, roda `supabase.from('app_config').select('*')` e recebe o segredo.

### Por que é grave (cadeia de exploração real)
1. Atacante loga normalmente e lê `revenuecat_webhook_secret`.
2. A autenticação do webhook é **comparação de string fixa** no header `Authorization` (`revenuecat-webhook/index.ts:106`) — não é HMAC sobre o corpo.
3. Atacante faz um `POST` na URL pública do webhook com esse header e um corpo forjado:
   ```json
   { "event": { "type": "INITIAL_PURCHASE", "app_user_id": "<qualquer-uuid>",
     "entitlement_ids": ["premium"], "expiration_at_ms": 9999999999999 } }
   ```
4. O webhook roda como **service role** (bypassa RLS e trigger) e grava `is_premium = true` para **qualquer** `user_id`.

**Impacto:** (a) qualquer um vira premium de graça, quebrando o paywall antes mesmo de existir; (b) fraude/griefing — promover ou bagunçar contas alheias; (c) elevar o próprio tier de quota de IA (3→20 gerações/mês), **gastando a `ANTHROPIC_API_KEY` do fundador** — dano financeiro direto.

> Observação: o entitlement da UI vem do RevenueCat (não do `is_premium` do banco), então a fraude não libera a UI premium hoje. **Mas** a `generate-cards` decide o tier de quota lendo `user_settings.is_premium` (`generate-cards/index.ts:265-272`) — esse vetor de abuso de custo é real e imediato.

### Correção (feita)
Migration **008** substitui a regra aberta por uma whitelist: o cliente só lê as duas flags que ele de fato usa (`ai_enabled`, `paywall_enabled`). O segredo fica invisível para clientes; o webhook continua lendo via service role. Qualquer segredo futuro em `app_config` fica protegido por padrão.

**Ação pendente do fundador:** aplicar `008_secure_app_config_secret.sql` no SQL Editor do Dashboard Supabase (o CLI aponta para o projeto errado — ver armadilha conhecida). É pré-requisito de segurança do gate 1.0.5. Fazer **antes** de configurar o segredo real do webhook.

---

## 2. 🟠 ALTO — Onboarding promete um volume de conteúdo que não existe

**ID:** P1 · **Status:** aberto (decisão de produto)

É uma manifestação **nova e mais aguda** do C1 já conhecido (400 frases de 1000). A tela `plan-reveal.tsx` (E6.1, criada depois da auditoria de 05/07) mostra uma projeção aritmética:

```
projection = daily * 30   // "No seu ritmo: ~N frases suas em 30 dias"
```

Cruzando com a lógica de ponto de partida (`FIRST_SESSION_START`, `store/lingrow.ts:417`):

| Nível declarado | Começa na frase | Frases restantes (de 400) | Meta 15/dia | Promessa exibida |
|---|---|---|---|---|
| zero | 1 | 399 | ~27 dias | ~450 em 30d |
| stuck | 150 | 250 | ~17 dias | ~450 em 30d |
| **fluency** | **300** | **100** | **~7 dias** | **~450 em 30d** |

O usuário de maior intenção (declara fluência, escolhe 15/dia — o candidato natural a premium) **esgota o conteúdo em ~7 dias**, enquanto a tela de onboarding acabou de prometer ~450 frases em 30 dias. A barra da home já usa `SENTENCES.length` (denominador honesto — quick win aplicado), mas o deck ainda se chama "1000 Frases Essenciais" e o plan-reveal projeta contra um total inexistente.

**Correção recomendada:** (a) prioridade real do épico E1 (completar as 600 frases) — sem isso, quanto melhor o onboarding converter, mais rápido o melhor usuário bate no vazio; (b) enquanto E1 não fecha, limitar a projeção ao conteúdo disponível a partir do ponto de partida (`min(daily*30, restantes)`) para o plan-reveal parar de prometer o que não há.

---

## 3. ✅ O que foi verificado e está SÓLIDO

Correções da auditoria de 05/07 confirmadas como aplicadas no código atual:
- **H1/H4** (falha de rede zerava streak/progresso): `getSettings`/`saveSettings` agora distinguem "linha inexistente" de "erro de rede" e o upsert é parcial.
- **H2** (crash de regex com keyword de IA): `escapeRegExp` aplicado em `study/[deckId].tsx:31`.
- **M1** (duplo-toque): flag `answering` presente.
- **C2** (exclusão de conta): edge function `delete-account` existe, valida JWT e faz `auth.admin.deleteUser` com cascade real.

Pontos fortes que se mantêm:
- `generate-cards`: JWT + kill switch + tier + quota atômica race-safe + refund + anti-burst, tudo no servidor; `ANTHROPIC_API_KEY` só no servidor.
- `user_settings`: trigger `protect_premium_columns` + policies impedem auto-promoção a premium via upsert do cliente (a fonte da verdade é o webhook via service role).
- Paywall: kill switch remoto (`paywall_enabled`) checado antes de exibir; preço vem do StoreProduct real; textos de renovação/trial em conformidade com a Apple.

---

## 4. Pendências herdadas ainda não verificáveis por código
- **H5** — rotação de `sbp_` + `ANTHROPIC_API_KEY` e remoção do usuário QA. Não confirmável no repo; se ainda aberta, é a ação de segurança nº 1 junto com S1.
- **H3** — drift da coluna `cards.position` (int4 vs `Date.now()`); depende de verificação em produção.

---

*Diagnóstico + 1 correção aplicada (migration 008). Nada foi aplicado no banco de produção nesta sessão.*
*— Orion, orquestrando o sistema 🎯*
