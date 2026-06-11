# Arquitetura: Criar Cards com IA — Fase 0 (Fundação Técnica)

| Campo | Valor |
|-------|-------|
| Autor | @architect (Aria) |
| Data | 2026-06-11 |
| Epic | `ia-monetizacao` (`docs/stories/epic-ia-monetizacao.md`) |
| Conceito | `docs/features/ai-deck-creator.md` |
| Status | Fase 0 — aguardando schema detalhado (@data-engineer) |

---

## 1. Decisão central: geração stateless, gravação pelo caminho existente

**A Edge Function NUNCA escreve nas tabelas do app (`decks`, `cards`).** Ela só gera conteúdo e devolve. Quem salva é o cliente, **pelo mesmo caminho que já existe** (`saveDeck()` + `saveCards()`), passando pelas mesmas políticas RLS de hoje.

```
┌─────────────┐  1. tema+qtd+nível   ┌──────────────────────┐
│   App (RN)  │ ───────────────────► │  Edge Function        │
│             │                      │  generate-cards       │
│             │ ◄─────────────────── │  · valida JWT         │
│  2. lista   │   Card[] (JSON)      │  · checa quota        │
│  de drafts  │                      │  · chama Claude API   │
│             │                      │  · registra uso       │
│ 3. TELA DE  │                      │  · NÃO grava deck/card│
│  REVISÃO    │                      └──────────────────────┘
│             │
│ 4. usuário  │      saveDeck() + saveCards()
│  aprova ───────────► Supabase (RLS existente, caminho existente)
└─────────────┘
```

**Por que isso é a decisão mais importante:**
- **Zero caminhos de escrita novos** nas tabelas core → impossível a IA corromper decks/cards de um jeito que o app manual não corromperia.
- A tela de revisão acontece **entre** gerar e salvar, naturalmente.
- Cancelar = nada foi escrito. Rollback trivial.
- O deck criado por IA é um **deck custom comum** — entra em `getDecks()`, na contagem da aba Revisar e na home **sem nenhuma mudança** na lógica recém-consertada (`dd33f6a`).

---

## 2. Contrato do motor (API da Edge Function)

**Endpoint:** `POST /functions/v1/generate-cards` (JWT obrigatório)

```typescript
// Request
{
  theme: string,        // máx 100 chars — validado no servidor
  count: number,        // 1..20 — clampado no servidor pelo tier
  level?: 'basic' | 'intermediate' | 'advanced',  // default 'intermediate'
  deckContext?: { name: string, sampleFronts: string[] }  // Caminho B: até 5 exemplos do deck
}

// Response 200
{
  cards: Array<{
    front: string,      // inglês
    back: string,       // português
    keyword: string,    // palavra-chave EN (paridade com deck 1000)
    keywordPt: string,
    notes?: string      // dica de contexto curta
  }>,
  usage: { used: number, limit: number, month: string }  // p/ exibir "✨ X restantes"
}

// Erros
401 não autenticado · 403 feature desligada (flag) · 422 input inválido
429 quota excedida → { error: 'quota_exceeded', usage } · 502 IA falhou (não conta quota)
```

**IDs (gerados no cliente, ao salvar):** seguem o padrão TEXT existente, com sufixo de índice para evitar colisão de `Date.now()` em lote:
- Deck: `deck-ai-{timestamp}` · Cards: `card-ai-{timestamp}-{índice}`

## 3. Escolha do modelo de IA

| Decisão | Valor | Racional |
|---------|-------|----------|
| Modelo | **`claude-haiku-4-5`** | Gerar pares EN/PT estruturados é tarefa simples — Haiku entrega qualidade suficiente, com a menor latência e o menor custo da família. |
| Configuração | Model ID em **variável de ambiente** da função | Trocar para Sonnet (se o QA reprovar qualidade) = mudar config, zero deploy de app. |
| Formato de saída | **Tool use / JSON schema forçado** | A IA é obrigada a devolver JSON válido no schema dos cards — elimina parsing frágil. |
| Validação dupla | Servidor valida o JSON contra o schema antes de devolver | Resposta malformada nunca chega ao app (edge case EC do conceito). |

> Custo por geração fica para a calibração (decisão do fundador). A arquitetura já deixa o modelo trocável por config justamente para essa conversa.

## 4. Quota e premium (desenho de alto nível — DDL com @data-engineer)

**Princípio de segurança: o cliente NUNCA decide quota.** O app apenas exibe; quem aplica é o servidor.

| Objeto | Desenho | Quem escreve |
|--------|---------|--------------|
| Tabela `ai_usage` | `user_id + month (YYYY-MM)` único; `generations_used`, `cards_generated` | **Só a Edge Function** (service role). Cliente tem RLS de leitura própria. |
| Premium flag | `user_settings.is_premium` + `premium_expires_at` (colunas aditivas) | Fase 5: webhook RevenueCat. Até lá, default `false`. |
| Feature flag | Tabela `app_config` (key/value) — chave `ai_enabled` | Só admin. Checada no app **e** na função (defesa em profundidade). |

**Limites por tier** (config da função, calibráveis sem deploy):

| | Free | Premium / Trial |
|--|------|-----------------|
| Gerações/mês | 3 | 20 |
| Cards/geração | 5 | 20 |
| Nível ajustável | não (fixo intermediate) | sim |

### ⚠️ Correção arquitetural ao conceito (§9 edge case "cancelar")

O conceito diz *"usuário cancela na revisão → geração não conta"*. **Isso cria um vetor de abuso:** gerar → copiar os cards → cancelar → repetir = IA infinita grátis, com custo real de API pago por nós a cada vez.

**Decisão:** a quota conta **no momento da geração** (quando o custo ocorre). O que **não** conta: falha técnica (rede, IA fora, resposta inválida — erros 5xx). Atualizar o conceito. Mitigação de UX: o usuário vê "X restantes" **antes** de gerar.

## 5. Segurança

1. **Chave da API só em Supabase Secrets** — nunca no cliente (NFR1 ✅).
2. **JWT verificado** na função; quota lida server-side com service role.
3. **Validação de input:** `theme ≤ 100 chars`, `count` clampado pelo tier, `level` enum.
4. **Prompt injection:** o tema entra como *dado* num prompt controlado por nós + saída forçada em JSON schema + `max_tokens` limitado. O pior caso vira cards ruins — que a tela de revisão filtra.
5. **Anti-burst:** além da quota mensal, intervalo mínimo entre gerações (ex.: 1 a cada 15s por usuário) para impedir rajadas.
6. **Flag global `ai_enabled`** = kill switch sem novo build (lançamento protegido).

## 6. Mapa de risco — O QUE NÃO TOCAR

| Zona proibida | Onde | Por quê |
|---------------|------|---------|
| `DECK_1000` / `data/sentences.ts` | client-side, nunca no DB | Special-cased em vários pontos; bug de contagem recém-consertado (`dd33f6a`) |
| Lógica de contagem da home e aba Revisar | `index.tsx`, `revisar.tsx` | Fases 2-3 só **adicionam pontos de entrada**; decks de IA são decks custom comuns e já entram na contagem naturalmente |
| `computeNextReview` / SRS | `store/lingrow.ts` | Coração do produto; nível da IA NÃO interage com SRS (decisão de conceito §4) |
| `getStudySession` | `store/lingrow.ts` | Caminho crítico de estudo |
| Auth / `lib/supabase.ts` | — | Funciona em produção; nada a mudar |
| Colunas existentes das tabelas | migrations | Só `ADD COLUMN`/`CREATE TABLE`. Nunca ALTER/DROP do que existe |

**Achados a endereçar (aditivos, nas fases certas):**
- 🔴 `saveCards()` **ignora erros do upsert** (loop sem checagem) — antes da Fase 2, adicionar verificação de erro por lote (mudança de ~3 linhas, coberta por story própria). Sem isso, um lote da IA pode falhar silenciosamente e o usuário "perde" cards que achou que salvou.
- 🟡 Anon key hardcoded em `lib/supabase.ts` — aceitável no modelo Supabase (RLS protege), mas diverge do NFR4 do PRD; mover para env var quando conveniente, sem urgência.

## 7. Stack da Edge Function

| Item | Escolha | Nota |
|------|---------|------|
| Runtime | Supabase Edge Functions (Deno/TS) | Já temos Supabase; zero infra nova (alinha com avaliação do epic Turmas: "tudo no Supabase") |
| SDK IA | `@anthropic-ai/sdk` (npm: via esm.sh no Deno) | Tool use p/ JSON schema |
| Secrets | `ANTHROPIC_API_KEY`, `AI_MODEL_ID`, limites por tier | `supabase secrets set` |
| Deploy | `supabase functions deploy generate-cards` | @devops na Fase 6; local via `supabase functions serve` |

## 8. Handoffs da Fase 0

1. **@data-engineer (Dara):** DDL detalhado de `ai_usage`, colunas premium em `user_settings`, `app_config` + RLS (leitura própria / escrita só service role) + migração reversível `004`.
2. **Depois → @sm (River):** story da Fase 1 (Edge Function + cliente `generateCards()`), com este documento como contexto técnico.

**Gate 0 (este documento):** design 100% aditivo confirmado — nenhuma alteração em tabela, coluna, política ou fluxo existente; apenas criações novas e 2 colunas `ADD COLUMN` em `user_settings`.

— Aria, arquitetando o futuro 🏗️
