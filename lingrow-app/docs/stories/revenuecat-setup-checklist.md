# RevenueCat + App Store Connect — Checklist do Fundador

---

## 🔖 ESTADO REAL DO SETUP (atualizado 2026-07-13, fim da sessão)

### ✅ Feito na Apple
- Contrato de Licença do Programa Apple Developer: **aceito**
- Grupo de assinaturas **`Lingrow Premium`** criado (ID do grupo: `22229160`)
- **2 assinaturas criadas, no MESMO grupo**, com preço, disponibilidade, idioma (PT-BR) e oferta introdutória (grátis, 2 semanas, sem data de término):

| Nível | Nome de referência | **ID do produto (string EXATA)** | Duração | Preço |
|---|---|---|---|---|
| 1 | Lingrow Premium Ano | `com.lingrow.flashcardss.premium.annual` ⚠️ | 1 ano | R$ 179,90 |
| 2 | Lingrow Premium Mensal | `com.lingrow.flashcards.premium.monthly` | 1 mês | R$ 24,90 |

> ⚠️ **O ID do anual tem "flashcard**ss**" com dois S.** NÃO é erro a corrigir — IDs da Apple são permanentes e o ID "correto" já foi queimado numa tentativa anterior. O ID é interno (cliente nunca vê) e funciona normalmente. **Use essa string exata no RevenueCat.**

### 🔴 BLOQUEIO ATIVO — o contrato de apps pagos
Status do "Acordo de apps pagos": **Novo** (não assinado). Sem ele, **nenhuma compra funciona — nem em sandbox**.

A Apple não deixa nem solicitar o contrato antes de resolver 2 avisos na página **Negócios**:
1. 🔵 *"Você deve atualizar as informações da sua pessoa jurídica antes de assinar o contrato de apps pagos"* → link **"Editar pessoa jurídica"** (entidade: MATEUS ALEXANDRO SOUZA SILVA, pessoa física, Manaus/AM)
2. 🔴 *DSA / União Europeia* — declarar se é comerciante (trader) → link **"Complete os requisitos de conformidade"**. Como vamos cobrar, a resposta é **sim, comerciante** (exige dados de contato públicos na App Store da UE). **Alternativa:** não distribuir na UE por ora — decisão do fundador.

Depois disso: assinar o contrato + **dados bancários** (titular tem que bater com a conta Apple) + **formulários fiscais** (W-8BEN dos EUA — sem ele a Apple retém 30%). Validação da Apple leva de horas a ~2 dias.

### 🟡 Em andamento no RevenueCat
- Projeto **`Lingrow`** criado. ⚠️ E-mail da conta ainda **não confirmado** (clicar no link do e-mail).
- Parou em: **New App Store app** — falta preencher Bundle ID `com.lingrow.flashcards` e subir o arquivo **`.p8`** (Chave de Compra no App).
- **Chaves da Apple ainda pendentes de gerar:**
  - `.p8` — App Store Connect → Usuários e Acesso → aba **Integrações** → **Compra no app** → `+` → baixar (**só baixa 1 vez**)
  - **Segredo compartilhado específico do app** — página do app → Geral → Informações do app → final da página

### ▶️ PRÓXIMO PASSO EXATO
1. Gerar as 2 chaves da Apple (acima)
2. Terminar o "New App Store app" no RevenueCat
3. Seguir as Partes 2.2 a 2.6 deste checklist (produtos → entitlement `premium` → offering `default` com pacotes **Monthly/Annual padrão** → Public SDK Key `appl_...` → webhook)
4. Mandar ao Claude: a **Public SDK Key** + o **segredo do webhook** inventado
5. Em paralelo: destravar o contrato de apps pagos (é o que segura o lançamento)

### ⏳ Pendências do lado do código (Claude faz quando receber as chaves)
- `EXPO_PUBLIC_RC_API_KEY` no EAS · `supabase secrets set REVENUECAT_WEBHOOK_SECRET` · deploy da function `revenuecat-webhook` · `app_config.paywall_enabled = 'true'` · build EAS · teste sandbox
- **Captura de tela da assinatura** (exigida pela Apple para revisão): tirar do paywall quando o build existir e subir no App Store Connect

---


| Campo | Valor |
|-------|-------|
| Data | 2026-07-12 |
| Para | Fundador (execução manual — nenhum agente pode fazer isto por você) |
| Fonte dos valores | `monetization-strategy-2026-07.md` v2.0 (preços verificados) + código real (`lib/premium.ts`, `app/paywall.tsx`) |
| Por que importa | Sem isto, o botão de compra falha e a Apple **rejeita automaticamente** a 1.0.5 |

> ⚠️ **Os nomes abaixo não são sugestões — são o que o código já espera.** Um caractere diferente e o paywall não encontra os planos.

## Dados fixos do app

| Item | Valor |
|------|-------|
| Bundle ID (iOS) / Package (Android) | `com.lingrow.flashcards` |
| Projeto Supabase | `ireppvpjhtapnekmucam` |

---

## PARTE 1 — App Store Connect (faça PRIMEIRO)

O RevenueCat lê os produtos da Apple. Se eles não existirem lá, não há o que conectar.

### 1.1 Pré-requisito que trava tudo (confira antes)
- [ ] **Contrato de Apps Pagos assinado** e dados bancários + fiscais preenchidos (Business → Agreements). Sem isso, os produtos ficam "Aguardando" para sempre e a compra **nunca** funciona, mesmo no sandbox.

### 1.2 Grupo de assinaturas
- [ ] Meus Apps → Lingrow → **Assinaturas** → criar grupo: **`Lingrow Premium`**

### 1.3 Os dois produtos (IDs exatos)

| Product ID | Duração | Preço |
|---|---|---|
| `com.lingrow.flashcards.premium.monthly` | 1 mês | **R$ 24,90** |
| `com.lingrow.flashcards.premium.annual` | 1 ano | **R$ 179,90** |

> Os preços mudaram em relação ao plano antigo (era R$14,90/R$99). Os valores acima são os da estratégia v2.0: o anual é **paridade exata com o Duolingo Super**, que é o nosso argumento de venda.

### 1.4 Trial de 14 dias
- [ ] Em **cada** um dos dois produtos: **Oferta introdutória** → **Teste gratuito** → **2 semanas**
- Na Apple, "2 semanas" = os 14 dias. Não use 1 semana (o Duolingo dá 14; 7 parece mesquinho na comparação direta).

### 1.5 Duas chaves que o RevenueCat vai pedir
- [ ] **Chave de API de Compra no App** (arquivo `.p8`): Usuários e Acesso → Integrações → Compra no app → gerar. **Baixe — só dá para baixar uma vez.**
- [ ] **Segredo compartilhado específico do app**: Meus Apps → Lingrow → Informações do app → Segredo compartilhado específico do app → gerar e copiar.

---

## PARTE 2 — RevenueCat

### 2.1 Projeto e app
- [ ] Criar conta (gratuita até US$2,5k/mês de receita) → novo projeto: **`Lingrow`**
- [ ] Adicionar app **iOS** → Bundle ID: `com.lingrow.flashcards`
- [ ] Subir o arquivo `.p8` (1.5) + colar o segredo compartilhado (1.5)

### 2.2 Produtos
- [ ] Products → importar/adicionar os dois IDs da tabela 1.3 (têm que bater **exatamente**)

### 2.3 Entitlement — o nome importa
- [ ] Entitlements → criar: identificador **`premium`** (minúsculo, exatamente assim)
- [ ] Anexar **os dois** produtos a ele

> O código faz `info.entitlements.active['premium']`. Se o identificador for outro, o app nunca reconhece quem pagou.

### 2.4 Offering — os nomes dos pacotes importam MUITO
- [ ] Offerings → criar/usar a offering **`default`** e marcá-la como **Current**
- [ ] Dentro dela, adicionar **2 pacotes usando os tipos padrão**:

| Pacote (tipo padrão) | Produto |
|---|---|
| **Monthly** (`$rc_monthly`) | `com.lingrow.flashcards.premium.monthly` |
| **Annual** (`$rc_annual`) | `com.lingrow.flashcards.premium.annual` |

> ⚠️ **Use os tipos padrão "Monthly" e "Annual"** — não crie identificadores personalizados. O código lê `offering.monthly` e `offering.annual`, que só existem se os pacotes forem dos tipos padrão.

### 2.5 A chave pública (é o que eu preciso de você)
- [ ] API Keys → copiar a **Public SDK Key do iOS** — começa com **`appl_`**
- [ ] **Me mande essa chave** (ela é pública, pode ir por aqui — não é segredo)

### 2.6 Webhook
- [ ] Integrations → Webhooks → adicionar:
  - **URL:** `https://ireppvpjhtapnekmucam.supabase.co/functions/v1/revenuecat-webhook`
  - **Authorization header:** invente uma senha forte e **me mande** (vira o `REVENUECAT_WEBHOOK_SECRET` no Supabase; o webhook rejeita qualquer POST sem ela)

---

## PARTE 3 — O que EU faço quando você me mandar as 2 coisas

Preciso de: **(a)** a Public SDK Key (`appl_...`) e **(b)** o segredo do webhook que você inventou.

- [ ] `EXPO_PUBLIC_RC_API_KEY` no ambiente do EAS
- [ ] `supabase secrets set REVENUECAT_WEBHOOK_SECRET=...`
- [ ] Deploy da edge function `revenuecat-webhook` (já escrita)
- [ ] Ligar o kill switch: `app_config.paywall_enabled = 'true'`
- [ ] Build EAS + teste de compra no sandbox de ponta a ponta

---

## Gate final (só depois disso a 1.0.5 vai para a Apple)

- [ ] Compra sandbox conclui e o app vira premium **sem reiniciar**
- [ ] Webhook aparece no log do RevenueCat e `is_premium` vira `true` no banco
- [ ] "Restaurar compra" funciona após reinstalar
- [ ] Tudo que é grátis continua grátis (regressão: 400 frases, SRS, notificações)

— Orion, orquestrando o sistema 🎯
