# Avaliação Técnica Completa — Lingrow (Julho 2026)

| Campo | Valor |
|-------|-------|
| Auditor | @architect (Aria) · Fable 5 |
| Data | 2026-07-05 |
| Escopo | `mobile-new/` (app v1.0.4), `supabase/` (migrations 001-005 + edge function `generate-cards`), prontidão para o paywall (Fase 5) |
| Método | Leitura integral do código-fonte, migrations e edge function; cruzamento com a auditoria QA de 2026-06-12; typecheck executado |
| Fora do escopo | `mobile/` e `mobile2/` (cópias antigas — só avaliadas como risco), banco de produção (sem acesso direto nesta sessão) |

---

## 1. Sumário Executivo (em linguagem simples)

O Lingrow está em **boa saúde para o estágio em que está**. O código é limpo, organizado e bem comentado, e a parte mais sensível — o motor de IA que gasta dinheiro a cada geração — é a mais bem protegida do sistema: ninguém consegue burlar a cota, a chave da IA fica só no servidor, e há um "botão de emergência" remoto para desligar a feature sem novo build.

Porém, a auditoria encontrou **2 problemas críticos** que precisam de decisão antes do paywall. O primeiro é de produto: o app promete "1000 Frases Essenciais", mas **só existem 400 frases escritas** — nem no app, nem no banco existem as outras 600. Um aluno no ritmo recomendado esgota todo o conteúdo em ~80 dias e fica sem nada para estudar, com a barra de progresso travada em 40%. O segundo é de conformidade: o botão "Excluir minha conta" apaga os dados mas **não apaga a conta em si**, deixa restos para trás e ignora erros no meio do caminho — isso pode causar rejeição da Apple justamente na revisão da versão com pagamento (que é mais rigorosa) e fere a LGPD.

Além disso, há um padrão perigoso espalhado pelo código: **quando a internet falha, o app finge que deu tudo certo** — e em dois cenários isso pode apagar o streak do usuário ou zerar o progresso de um card silenciosamente. Para um app cuja promessa é "inglês que não some", perder progresso do usuário é o pior bug possível. Nada disso é difícil de corrigir; está tudo mapeado abaixo com correções pontuais.

**Recomendação em uma frase:** corrija os 5 itens da Fase A (seção 7) antes de iniciar a Fase 5 do paywall — nenhum deles é grande, e todos protegem exatamente o usuário que vai virar pagante.

---

## 2. Achados CRÍTICOS (bloqueiam paywall/lançamento)

### C1 — O produto promete 1000 frases; só existem 400 (em qualquer lugar)

**Evidência:**
- `mobile-new/data/sentences.ts:1` — o comentário do próprio arquivo já diz "primeiras 50 frases", e a contagem real é **400 frases** (positions 1–400, verificado por regex; maior position = 400).
- `mobile-new/app/(tabs)/index.tsx:231-235` — a home exibe `{learnedCount} / 1000 frases aprendidas` e calcula a barra com `learnedCount / 1000` **fixos no código**.
- `mobile-new/store/lingrow.ts:376-415` — `getStudySession` só serve cards do bundle; após a frase 400, retorna apenas revisões, nunca material novo.
- A auditoria QA de 2026-06-12 (A1) **assumiu** que "as frases 401-1000 existem só no código do app" — está errado: elas não existem em lugar nenhum. A migração 005 corrigiu a FK (o crash na frase 401 não acontece mais), mas o conteúdo continua faltando.

**Consequência:** no ritmo recomendado (5/dia), o usuário esgota o programa em ~80 dias. A barra para em 40%, a tela diz "Volte amanhã para novos cards" para sempre, e a promessa central do app quebra — exatamente no perfil de usuário mais engajado (o candidato natural a premium). Segundo a auditoria de junho, o usuário mais avançado estava na frase 41 em 12/06; no ritmo máximo (10/dia), o primeiro usuário pode bater no teto ainda em 2026.

**Correção recomendada:** decisão de produto com duas rotas — (a) **completar as 600 frases** (pipeline: geração via IA com o mesmo formato `SentenceData`, curadoria humana das frases, append em `sentences.ts` — nenhuma mudança de schema é necessária, pois os cards built-in são virtuais por design); ou (b) reposicionar o programa para o número real. Recomendo (a): o custo é baixo e a promessa "1000 frases" já está no marketing e na App Store. Em paralelo, trocar o `1000` fixo da home por `SENTENCES.length` para o denominador nunca mais mentir.

### C2 — "Excluir minha conta" não exclui a conta, deixa dados para trás e ignora erros

**Evidência:** `mobile-new/app/(tabs)/config.tsx:31-66`:
1. As deleções de `cards`, `card_progress`, `decks` e `user_settings` são feitas com `await supabase.from(...).delete()` **sem verificar `error`** (linhas 50-54) — o supabase-js não lança exceção; se qualquer deleção falhar, o app mostra "Conta excluída, seus dados foram apagados com sucesso" mesmo com dados remanescentes.
2. `study_sessions` **não é apagada** (tabela existe desde a migration 001; não aparece no fluxo de exclusão).
3. `ai_usage` **não pode ser apagada pelo cliente**: a migration 004 (linhas 74-78) só dá policy de SELECT — o DELETE do cliente é silenciosamente bloqueado pela RLS.
4. A conta em `auth.users` **nunca é apagada** — o e-mail do usuário permanece no sistema para sempre.

**Consequência:** violação da App Store Guideline 5.1.1(v) (exclusão de conta deve remover a conta, não só dados) — risco real de rejeição na revisão da 1.0.5, que será mais rigorosa por introduzir compras; exposição LGPD (dados pessoais retidos após pedido de exclusão); e inconsistência de dados em falhas parciais.

**Correção recomendada:** criar Edge Function `delete-account` (service role): valida o JWT do usuário, apaga todas as tabelas em ordem (incluindo `study_sessions`, `ai_usage`) e finaliza com `auth.admin.deleteUser(userId)`. O app chama a função e só então faz signOut. É o mesmo padrão já dominado no projeto com `generate-cards`.

---

## 3. Achados ALTOS

### H1 — Falha de rede pode ZERAR streak e configurações do usuário

**Evidência:** `mobile-new/store/lingrow.ts:82-124` — `getSettings()` tem `catch { return DEFAULT_SETTINGS }` (streak 0, onboardingDone false). `saveSettings()` faz `getSettings()` → merge → upsert de **todas** as colunas. Se a leitura falhar (rede/timeout) e a escrita funcionar, o upsert grava os defaults por cima dos dados reais: streak vira 0, onboarding volta a false.
Agravante: `mobile-new/app/_layout.tsx:37-44` — o RootNavigator usa o mesmo `getSettings()`; qualquer falha de rede na abertura joga um usuário veterano de volta ao onboarding, e o `finish()` do onboarding (`onboarding.tsx:61-69`) chama `saveSettings({onboardingDone: true})`, consumando a perda do streak.

**Correção:** (1) `getSettings` deve distinguir "linha não existe" (retorna defaults) de "falha de rede" (lança erro); (2) `saveSettings` deve fazer upsert **apenas das colunas presentes no patch**, nunca do merge completo. Duas mudanças pequenas que eliminam a classe inteira do problema.

### H2 — Crash na tela de estudo com keywords geradas por IA

**Evidência:** `mobile-new/app/study/[deckId].tsx:33` — `new RegExp(`(${keyword})`, 'gi')` monta regex com a keyword **sem escapar caracteres especiais**. Keywords vêm da IA (`generate-cards`) sem restrição de charset; uma keyword com `(`, `)`, `?`, `+`, `*` ou `[` (ex.: "(informal)", "give up?") lança `SyntaxError: Invalid RegExp` e derruba a tela de estudo para **todos os estudos daquele card**, sem recuperação.

**Correção (3 linhas):** escapar a keyword antes: `keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`.

### H3 — Schema no banco diverge das migrations (drift) — coluna `position`

**Evidência:**
- `supabase/migrations/001_initial_schema.sql:32` — `position INTEGER` (int4, máx. 2.147.483.647). Nenhuma migration posterior altera o tipo.
- `mobile-new/app/(tabs)/criar.tsx:65` e `mobile-new/app/ai-create.tsx:247,281` — o app grava `position: Date.now()` (~1.782.000.000.000 em jul/2026), **830× acima do limite de int4**.
- Cards manuais são criados em produção há meses sem erro relatado — logo, **o banco real não segue as migrations** (a coluna deve ser `bigint`/`numeric` lá), ou a criação de cards está falhando silenciosamente para todos.

**Consequência:** as migrations não são fonte confiável do schema real. Isso é uma armadilha armada para a migração 006 (paywall): qualquer ambiente novo criado a partir das migrations (staging, restore, novo dev) quebra a criação de cards.

**Correção:** (1) verificar o tipo real em produção (`SELECT data_type FROM information_schema.columns WHERE table_name='cards' AND column_name='position'`); (2) escrever migração de alinhamento (`ALTER TABLE cards ALTER COLUMN position TYPE BIGINT`) para que migrations e produção convirjam; (3) regenerar o snapshot (`supabase/snapshots/post-004-schema.sql` está **vazio** — 1 linha). Obs.: o CLI do Supabase não está instalado nesta máquina Windows, o que impediu a verificação nesta sessão.

### H4 — Progresso de card pode ser resetado silenciosamente em falha de rede

**Evidência:** `mobile-new/store/lingrow.ts:248-284` — `getProgress()` tem catch que devolve progresso **zerado** (repetitions 0, ease 2.5) para qualquer falha, inclusive rede. Em `study/[deckId].tsx:112-115`, responder um card faz `getProgress → computeNextReview → saveProgress`. Numa falha intermitente (leitura falha, escrita funciona), o progresso real do card no servidor é **sobrescrito com o estado de card novo** — meses de agendamento SRS perdidos, sem nenhum aviso.

**Correção:** distinguir "não existe linha" (card novo — default correto) de "falha de rede" (lançar erro e mostrar alerta, sem gravar). Mesmo padrão do H1.

### H5 — Rotação de credenciais pendente de confirmação (herdado da auditoria de junho)

**Evidência:** achado A9 da auditoria 2026-06-12: token `sbp_` e `ANTHROPIC_API_KEY` transitaram por chat; recomendada rotação de ambos + remoção do usuário QA `qa.ia.test.lingrow@gmail.com`. **Não encontrei evidência no repositório de que foi executado.** Não é verificável por código — precisa de confirmação do fundador/@devops. Se ainda pendente, é a ação de segurança nº 1 (a chave Anthropic gera custo direto se vazar).

---

## 4. Achados MÉDIOS

### M1 — Duplo-toque nos botões SRS grava resposta em dobro
`mobile-new/app/study/[deckId].tsx:92-139` — `answer()` é async (animação de ~270ms + 2 round-trips) e os botões não são desabilitados durante a execução. Dois toques rápidos disparam o fluxo duas vezes: dupla gravação de progresso (a segunda com dados da primeira) e pulo de card. **Correção:** flag `answering` que desabilita os botões até concluir.

### M2 — Falha de rede é exibida como "tudo vazio/tudo em dia"
`mobile-new/store/lingrow.ts` — `getDecks()` (144), `getCards()` (182), `getAllProgress()` (243) retornam `[]` em qualquer erro. Sem internet, a home mostra 0 decks/0 cards e a aba Revisar mostra "Tudo em dia!" — o usuário conclui que perdeu seus dados. **Correção:** estado de erro visível ("Sem conexão — puxe para tentar de novo") nas 3 telas de leitura.

### M3 — Decks do usuário não têm limite diário de cards novos
`mobile-new/store/lingrow.ts:409-412` — o `slice(0, remainingToday)` só se aplica ao deck built-in; para decks custom o slice é `undefined` (sem limite). Um deck de IA com 20 cards entra inteiro na primeira sessão, e a aba Revisar já anuncia "+20" de uma vez (registrado como A7/INFO em junho — mas com a IA ativa em produção deixou de ser teórico). Infla a curva de revisões dos dias seguintes e quebra o ritmo pedagógico. **Correção:** aplicar o mesmo `remainingToday` global a todos os decks.

### M4 — Typecheck quebrado, zero testes, zero CI
- `npx tsc --noEmit` falha com 2 erros (já apontados como A8 em junho, ainda abertos): `components/external-link.tsx:2` (módulo `expo-web-browser` não instalado — o arquivo é template morto) e `context/auth.tsx:36` (`email: string | undefined` passado ao `posthog.identify`).
- Não existe **nenhum arquivo de teste** no projeto (glob `*.test.*`/`*.spec.*` vazio), nenhum workflow de CI (`.github/workflows` inexistente), e o `package.json` não tem script `typecheck` nem `test`.
- **Consequência:** nenhuma rede de segurança para a Fase 5 — que mexe com pagamento. **Correção mínima antes do paywall:** consertar os 2 erros TS, adicionar `"typecheck": "tsc --noEmit"`, criar workflow GitHub Actions com `lint + typecheck`, e testes unitários para as 2 funções mais críticas e puras do app: `computeNextReview` (SRS) e a lógica de sessão/limite diário.

### M5 — Código morto espalhado (inclusive causando o erro TS)
Inventário verificado:
- `mobile-new/lingrow-app/mobile-new/app/` — pasta aninhada acidental com 2 layouts antigos (nenhum import aponta para ela);
- `app/session-done.tsx` — registrado no Stack (`_layout.tsx:56`) mas **nenhuma navegação leva a ele** (a tela "done" vive inline em `study/[deckId].tsx:144-163`);
- `app/modal.tsx`, `app/(tabs)/explore.tsx` (escondido com `href: null`) — restos do template Expo;
- `components/`: `hello-wave`, `parallax-scroll-view`, `external-link` (fonte do erro TS), `haptic-tab`, `icon-symbol*`, `themed-text`, `themed-view`, `ui/collapsible` — cadeia inteira do template, sem uso nas telas reais;
- `constants/theme.ts` duplica o tema real (`theme/index.ts`) e só é usado pela cadeia morta acima;
- `store/lingrow.ts:365-372` — `getIntervalLabel()` nunca é chamado;
- `scripts/reset-project.js`, `dist/` (vazia).
**Correção:** uma varredura de deleção (resolve M4-erro-1 de graça e reduz superfície de manutenção).

### M6 — `mobile/` e `mobile2/` ao lado do app real
`lingrow-app/mobile/` e `lingrow-app/mobile2/` são cópias v1.0.0 paradas desde março. Risco real num projeto tocado por IA/agentes: editar a pasta errada (três `app/(tabs)/index.tsx` quase idênticos respondem a qualquer busca de código). **Correção:** remover do working tree (o histórico git preserva) ou mover para `_archive/` com um README de aviso.

### M7 — Restrição de `daily_goal` removida do banco
`supabase/migrations/003_fix_text_ids_and_onboarding.sql:57` derrubou o CHECK de `daily_goal` — hoje qualquer valor pode ser gravado; a validação vive só na UI. Combinado com IDs TEXT gerados no cliente (`deck-${Date.now()}`), o padrão geral é "o cliente dita os dados". Aceitável no beta; endurecer quando houver receita (server é autoridade).

---

## 5. Achados BAIXOS

| # | Achado | Evidência | Nota |
|---|--------|-----------|------|
| L1 | URL/anon key do Supabase e key do PostHog hardcoded no código | `lib/supabase.ts:4-5`, `lib/analytics.ts:3` | Anon key é pública **por design** (a RLS é quem protege) — não é vazamento; mas mover para env EAS facilita trocar de projeto/ambiente |
| L2 | Labels SRS imprecisos hardcoded ("Fácil → 4 dias", "Novamente → < 1 min" quando o real varia) | `study/[deckId].tsx:301-325` | `getIntervalLabel()` já existe e calcularia o valor certo — está sem uso |
| L3 | RLS policies usam `auth.uid()` direto e a policy de `cards` usa subquery `IN` | `migrations/001:155-174` | Em escala, o padrão `(select auth.uid())` evita reavaliação por linha; hoje é irrelevante |
| L4 | `posthog.identify` envia o e-mail do usuário como propriedade | `context/auth.tsx:36` | Revisar necessidade (LGPD/minimização); o user id já identifica |
| L5 | A5 e A6 da auditoria de junho continuam abertas | `criar.tsx:38-44` (deckId "gruda"); `migrations/004` trigger `updated_at` em refund | Backlog reconhecido |
| L6 | `deck/[deckId].tsx:48` retorna `null` se o deck não carrega — tela branca sem feedback | `deck/[deckId].tsx:48` | Adicionar loading/erro |
| L7 | Botão ↻ da tela de estudo reinicia a sessão sem confirmação | `study/[deckId].tsx:213` | Toque acidental refaz cards já respondidos |
| L8 | `package.json` version 1.0.0 vs `app.json` 1.0.4 | `package.json:4` | Cosmético |
| L9 | Tabelas `_legacy_backup_005_*` aguardando remoção (o próprio comentário pede pós-1.0.5) | `migrations/005:33-34` | Housekeeping agendado |
| L10 | Streak e limite diário usam data local do device; quota de IA usa UTC | `store/lingrow.ts:403,421-431` | Viagens/fuso podem criar pequenas inconsistências; decisão consciente aceitável |

---

## 6. 🔐 Riscos de Segurança (seção destacada)

**O que está SÓLIDO (validado nesta auditoria):**
- Edge Function `generate-cards` é o ponto alto do projeto: JWT validado no servidor, kill switch checado no servidor, tier premium decidido no servidor, quota **atômica e race-safe** reservada ANTES de gastar com a IA (`consume_ai_generation` com limite no mesmo statement), refund em falha técnica, anti-burst de 15s, inputs clampados (tema ≤100 chars, count limitado ao teto do tier no servidor), output da IA validado por schema, e mitigação de prompt injection (tema tratado como dado + saída restrita por tool schema).
- `ANTHROPIC_API_KEY` vive apenas em env do servidor (`generate-cards/index.ts:15`) — nunca no app.
- RLS habilitada em **todas** as tabelas; `ai_usage`/`app_config` são somente-leitura para clientes; funções de quota com `REVOKE EXECUTE` para `anon/authenticated` (defesa em profundidade real).
- `is_premium` não pode ser alterado pelo cliente na prática de negócio (fonte da verdade será o webhook RevenueCat via service role).

**Pontos de atenção:**
1. **H5 (rotação de credenciais)** — pendência herdada de junho, não confirmada. Prioridade máxima se ainda aberta.
2. **C2 (exclusão de conta)** — além de compliance, é o único fluxo destrutivo do app e roda sem verificação de erro.
3. **Nota sobre `is_premium` via upsert**: a RLS de `user_settings` (`FOR ALL USING auth.uid() = user_id`) permite ao dono atualizar a **própria linha inteira** — tecnicamente um usuário avançado pode setar `is_premium = true` via API com seu próprio JWT. Hoje o dano é limitado (o único benefício premium é a quota de IA, revalidada... pelo `user_settings` também — ou seja, a quota premium **é** obtível por auto-upsert). Antes da Fase 5, restringir: revogar UPDATE dessas colunas para o cliente (policy de UPDATE com `WITH CHECK` que impeça mudar `is_premium`/`premium_expires_at`, ou trigger que bloqueie) — a fonte da verdade deve ser exclusivamente o webhook.
4. **CORS `*`** na edge function (`generate-cards/index.ts:28`) — irrelevante para app nativo, revisar se surgir versão web.
5. Política de privacidade hospedada em página pública do Notion (`config.tsx:11`) — funcional, mas frágil (link pode quebrar; sem versionamento). O diretório `lingrow-privacy/` (untracked na raiz) contém um `index.html` que parece ser a solução em andamento — finalizar e publicar em domínio próprio.

---

## 7. Top 5 Quick Wins (alto impacto, baixo esforço)

1. **Escapar a keyword no `HighlightedText`** (`study/[deckId].tsx:33`) — 1 linha, elimina crash em produção com cards de IA (H2).
2. **Guard de duplo-toque no `answer()`** (`study/[deckId].tsx:92`) — 1 state + `disabled`, elimina corrupção de resposta (M1).
3. **`saveSettings` parcial** (`store/lingrow.ts:107`) — upsert só do patch, elimina o cenário "streak zerado por falha de rede" (metade do H1).
4. **Deletar a cadeia de código morto do template** (M5) — conserta 1 dos 2 erros de typecheck sem escrever código, e destrava `tsc --noEmit` como gate.
5. **Trocar `/1000` fixo por `SENTENCES.length`** (`index.tsx:231-235`) — 2 linhas; a UI para de prometer números irreais enquanto a decisão de conteúdo do C1 não sai.

---

## 8. Roadmap de Correção Recomendado

### Fase 0 — Imediato (dias, antes de qualquer outro trabalho)
| Ordem | Item | Achado | Executor sugerido |
|-------|------|--------|-------------------|
| 1 | Confirmar/executar rotação de `sbp_` + `ANTHROPIC_API_KEY` + remover usuário QA | H5 | fundador + @devops |
| 2 | Quick wins 1-5 (seção 7) | H2, M1, H1½, M5, C1-paliativo | @dev |
| 3 | `typecheck` no package.json + consertar `auth.tsx:36` | M4 | @dev |

### Fase A — Antes do paywall (pré-requisitos da Fase 5)
| Ordem | Item | Achado | Executor sugerido |
|-------|------|--------|-------------------|
| 4 | Edge Function `delete-account` (apaga TUDO + `auth.admin.deleteUser`) e ligar no `config.tsx` | C2 | @dev + @data-engineer |
| 5 | `getSettings`/`getProgress`: distinguir "não existe" de "falha de rede" (lançar erro) | H1, H4 | @dev |
| 6 | Verificar tipo real de `cards.position` em produção; migração de alinhamento (BIGINT) + regenerar snapshot | H3 | @data-engineer |
| 7 | Travar escrita de `is_premium`/`premium_expires_at` pelo cliente (policy/trigger) | Seg. item 3 | @data-engineer |
| 8 | CI mínimo: GitHub Actions com lint + typecheck; testes unitários de `computeNextReview` e limite diário | M4 | @dev + @devops |
| 9 | **Decisão de produto C1**: completar as 600 frases (recomendado) ou reposicionar o programa | C1 | fundador + @pm |
| 10 | Arquivar `mobile/` e `mobile2/` | M6 | @devops |

### Fase B — Junto com o paywall (integrar às stories IA-5.x já planejadas)
- Limite diário de novos cards para decks custom (M3) — importante porque o premium vende decks de IA maiores.
- Estados de erro de rede visíveis nas telas de leitura (M2) — pagante não pode achar que perdeu os dados.
- O plano `fase-5-paywall-plano.md` está bem estruturado e já prevê o essencial (webhook com HMAC, flag `paywall_enabled` nascendo false, migração aditiva) — mantê-lo, acrescentando os itens 4-7 da Fase A como pré-requisitos formais do gate 5.0.

### Fase C — Depois do paywall (backlog)
- L1-L10, M7, remoção dos backups `_legacy_backup_005_*` (pós-1.0.5), política de privacidade em domínio próprio, revisão de PII no PostHog.

---

## 9. Nota de verificação (Artigo IV — No Invention)

Todos os achados citam arquivo:linha verificados nesta sessão. Dois itens dependem de acesso que esta sessão não tinha e ficam explicitamente como **verificação pendente**: (1) tipo real da coluna `cards.position` em produção (H3 — CLI do Supabase não instalado nesta máquina); (2) status da rotação de credenciais (H5 — não verificável por código). Nenhuma correção foi aplicada nesta auditoria — o relatório é somente diagnóstico.

— Aria, arquitetando o futuro 🏗️
