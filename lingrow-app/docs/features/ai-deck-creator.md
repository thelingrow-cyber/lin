# Feature: Criar Cards com IA — Documento de Conceito

| Campo | Valor |
|-------|-------|
| Feature ID | `ai-deck-creator` |
| Fase | Idealização concluída (Spec Pipeline Fase 1 — Gather) |
| Autor | @pm (Morgan) + Fundador |
| Data | 2026-06-11 |
| Versão alvo | v2 — Premium |
| Status | Conceito + UX definidos — pronto para viabilidade técnica (@architect) |

---

## 1. Visão

Permitir que o usuário gere flashcards automaticamente a partir de um tema descrito em linguagem natural ("inglês para entrevista de emprego", "vocabulário de viagem"). A IA devolve cards prontos no padrão do app (frente em inglês, verso em português, nota de contexto), que o usuário **revisa e aprova** antes de salvar.

É a feature âncora do modelo premium (PRD §7, v2): resolve a dor central da persona — *"não quero criar nada do zero"* — sem abrir mão da qualidade do estudo nem da simplicidade da marca.

---

## 2. A sacada arquitetural: um motor, dois caminhos

Os dois fluxos abaixo **NÃO são features separadas**. São o mesmo motor (`tema + quantidade → Card[]`) exposto em dois pontos de entrada. O app já tem `saveCards()` (gravação em lote) no store `mobile-new/store/lingrow.ts`, então o segundo caminho custa pouco depois do primeiro.

| Caminho | Entrada | Por baixo | Momento de valor |
|---------|---------|-----------|------------------|
| **A — Criar deck com IA** | Home, ao lado de "Novo Deck" | `saveDeck()` + `saveCards()` | "Uau" — justifica o premium |
| **B — Gerar mais cards** | Dentro de um deck existente | `saveCards()` no deck atual | Fideliza — resolve o "criei 5, travei" |

**Ordem de construção:** Motor + Caminho A primeiro (é o que vende). Caminho B vem quase de graça na sequência.

---

## 3. Princípio de UX: simplicidade fiel à marca

A marca é *"o poder do flashcard sem o sofrimento"* — o oposto do Anki. A tela de entrada deve ser **mínima**: um campo, atalhos, um botão. Nada de formulário com muitos campos visíveis. Toda complexidade (nível, quantidade) ou é absorvida pelo texto livre, ou aparece **depois**, na revisão.

### Tela de entrada (Caminho A)

```
┌─────────────────────────────────────────┐
│  Criar deck com IA                  ✨    │
│  Digite um tema e a IA monta seu deck     │
│                                           │
│  ┌─────────────────────────────────┐      │
│  │ Ex.: inglês para viagem         │  [Gerar] │  ← campo + botão
│  └─────────────────────────────────┘      │
│                                           │
│  ( ✈️ Viagem ) ( 💼 Reunião de negócios )  │  ← chips = atalhos
│  ( 🍽️ Restaurante ) ( 💬 Entrevista )      │     que preenchem o campo
│                                           │
│  ✨ 18 gerações restantes este mês        │  ← quota como benefício
└─────────────────────────────────────────┘
```

**Regras desta tela:**
- O **campo de texto e os chips são a mesma entrada**. O usuário pode (a) digitar um tema personalizado, (b) **ditar por voz** (microfone nativo do teclado — zero desenvolvimento), ou (c) tocar num chip que preenche o campo. Os três terminam no mesmo "Gerar".
- **Sem seletor de nível e sem seletor de quantidade na entrada.** Mantém a tela limpa. (Ver §4 — onde o nível aparece.)
- Cor da marca: **roxo `#7C3AED`** (o mockup original veio verde — corrigir).
- A linha de quota é discreta e enquadrada como benefício, não como restrição.

### Tela de entrada (Caminho B)

Igual à de cima, mas: aberta de dentro de um deck existente, com o **chip principal pré-preenchido com o tema do deck** ("Gerar mais cards de *Viagem*"). Salva direto no deck atual.

---

## 4. Onde o nível de dificuldade aparece

O nível (básico / intermediário / avançado) melhora muito a qualidade do que a IA gera — mas **não fica na tela de entrada** para não pesá-la. Duas formas, ambas mais leves:

1. **No texto livre:** o usuário escreve "inglês **básico** pra viagem" — a IA entende naturalmente.
2. **Na tela de revisão (preferido):** depois de gerar, botões *"deixar mais difícil ↑ / mais fácil ↓"* que regeneram. O usuário decide **vendo o resultado**, não adivinhando antes.

> Nota conceitual: este "nível" guia apenas **o vocabulário que a IA escolhe**. NÃO altera o SRS (que se adapta sozinho pela resposta Difícil/Bom/Fácil do usuário). São coisas separadas — manter assim.

---

## 5. Fluxo completo (happy path)

```
1. Usuário toca em "Criar deck com IA" (home) ou "Gerar mais cards" (dentro do deck)
2. Digita / dita / toca num chip  →  define o tema
3. Toca em "Gerar"  →  loading
4. IA devolve a lista de cards (frente EN + verso PT + nota)
5. TELA DE REVISÃO:
   - vê todos os cards (toque para virar e conferir tradução)
   - apaga os ruins, edita o que quiser
   - ajusta nível: "mais fácil / mais difícil" → regenera (opcional)
   - aprova
6. Toca em "Salvar"
   - Caminho A: cria o deck novo com os cards aprovados
   - Caminho B: adiciona os cards aprovados ao deck atual
7. Confirmação  →  pronto para estudar (entra no SRS normalmente)
```

---

## 6. Requisitos Funcionais

- **FR1 (P0):** Gerar um deck novo a partir de um tema em texto livre (Caminho A).
- **FR2 (P0):** Gerar cards adicionais com IA dentro de um deck existente (Caminho B).
- **FR3 (P0):** A IA gera no formato do app: frente (inglês), verso (português), nota curta de contexto.
- **FR4 (P0):** Tela de revisão antes de salvar — apagar, editar, aprovar.
- **FR5 (P0):** Chips de tema que preenchem o campo (atalhos), além da entrada por texto/voz.
- **FR6 (P1):** Ajuste de nível na revisão ("mais fácil / mais difícil") que regenera.
- **FR7 (P1):** Cards salvos entram no SRS idênticos a cards feitos à mão.
- **FR8 (P1):** Feedback de loading claro durante a geração.

## 7. Requisitos Não-Funcionais

- **NFR1 (segurança):** Chamada de IA via Supabase Edge Function — a chave da API nunca vai ao cliente (alinha com PRD NFR4).
- **NFR2 (custo):** Limite por geração (~20 cards) **e** limite mensal por usuário (~20 gerações/mês). Números calibráveis; limites obrigatórios desde o dia 1.
- **NFR3 (premium):** Acesso restrito a usuários premium (depende do épico de Paywall).
- **NFR4 (qualidade):** Inglês natural e tradução correta; a tela de revisão é a salvaguarda.
- **NFR5 (marca):** UI em roxo `#7C3AED`, mínima, fiel ao princípio anti-Anki.

## 8. Limites e Controle de Custo (modelo freemium em camadas)

A IA existe nos dois níveis — **restrita no grátis** (isca de conversão), **generosa no premium**. Como há muito mais usuários grátis que premium, o limite do grátis deve ser apertado de propósito para proteger o caixa.

| Limite (calibrável) | 🆓 Grátis | 💎 Premium | 🎁 Trial (7 dias) |
|---------------------|-----------|------------|-------------------|
| Gerações por mês | 2-3 (amostra) | 20 | acesso premium completo |
| Cards por geração | até 5 | até 20 | até 20 |
| Ajuste de nível na revisão | fixo | ajustável | ajustável |
| Tamanho do tema | ~100 chars | ~100 chars | ~100 chars |

**Racional:** o grátis dá o "gosto" real da IA e dispara a oferta de premium quando o usuário bate no limite. O premium é o banquete. O trial de 7 dias deixa o usuário sentir o premium completo antes de pagar (7 dias porque o valor do app de hábito só aparece no D7+).

> **Atenção de custo:** cada geração — inclusive as gratuitas — chama a API e custa dinheiro. O limite apertado do grátis é a principal proteção contra sangria de caixa em escala.

## 9. Edge Cases

| Cenário | Tratamento | Severidade |
|---------|-----------|-----------|
| Rede falha durante a geração | Erro + tentar de novo, sem cobrar a geração | Alta |
| IA devolve resposta vazia/malformada | Erro amigável, não salva nada | Alta |
| Usuário atingiu o limite mensal | Avisar com clareza + (futuro) CTA de upgrade | Média |
| Tema vazio ou sem sentido | Validação antes de chamar a IA | Média |
| Usuário cancela na revisão | Descarta tudo (nada é salvo). A geração **conta na quota** — o custo de API já ocorreu; contar só ao salvar criaria abuso (gerar→copiar→cancelar→repetir grátis). Falha técnica (rede/IA fora) NÃO conta. Decisão @architect, ver arquitetura §4. | Baixa |

## 10. Terminologia

- **Card** — flashcard (frente/verso/nota). Termo já no código.
- **Deck** — coleção de cards. Termo já no código.
- **Geração** — uma chamada à IA que produz uma lista de cards. Unidade de cobrança/limite.
- **Chip** — atalho de tema que preenche o campo de texto.
- Evitar: "baralho" (usar "deck"), "carta" (usar "card").

---

## 11. Questões em Aberto (próximas fases)

| # | Questão | Responsável | Bloqueia? |
|---|---------|-------------|-----------|
| OQ1 | Qual modelo de IA e custo real por geração? | @architect | Sim — define viabilidade econômica |
| OQ2 | Edge Function: estrutura, rate limiting, contagem de quota por usuário | @architect | Sim |
| OQ3 | ~~Paywall antes, ou liberar IA no beta?~~ **RESOLVIDA** — ver §13 | — | — |
| OQ4 | Calibrar os números reais dos limites (20/20) com base no custo | @architect + @pm | Não |

---

## 12. Decisões Fechadas (2026-06-11, com o fundador)

- Os dois caminhos (A + B), mesmo motor.
- Tela de entrada **mínima**: campo + chips-atalho + Gerar. Sem seletores na entrada.
- Entrada por **voz via teclado nativo** (sem desenvolvimento).
- **Nível** vai para o texto livre e/ou para a tela de revisão (ajuste "mais fácil/difícil"), não para a entrada.
- **Tela de revisão obrigatória** antes de salvar.
- **Limites obrigatórios**: teto por geração + mensal.
- Formato igual ao deck 1000; sem áudio próprio (TTS nativo cobre).
- UI na cor da marca (roxo `#7C3AED`).

---

## 13. Estratégia de Go-to-Market (decidida 2026-06-11, fundador)

**Decisão de ordem:** construir a feature de IA **e** o paywall **antes** de submeter à Apple — deixar tudo "na agulha" para lançar completo (alinha com a preferência do fundador por setup completo).

**Modelo de monetização (atualizado 2026-06-11):** freemium em camadas — IA **restrita no grátis** (2-3 gerações/mês, 5 cards) como isca, **generosa no premium** (20/mês, 20 cards), com **trial de 7 dias** do premium completo. Ver tabela em §8. O preço fica para definição posterior (depende do custo da IA).

**Alertas registrados (a resolver antes de executar):**
1. **Apple In-App Purchase obrigatório.** Venda de conteúdo digital no iOS deve usar IAP da Apple (15-30%), não Stripe/Pix/link externo — sob pena de rejeição. Usar **RevenueCat** (cross-platform iOS + Google Play). É isso que se monta antes de submeter.
2. **Custo da IA antes do preço.** O preço de R$14,90 (PRD) foi estimado sem o custo real de geração. Confirmar margem com @architect antes de ligar a cobrança. Risco maior está no volume do grátis — limite apertado é a proteção.

**Sequência de build resultante:**
1. Custo da IA + viabilidade (@architect) — destrava pricing
2. Motor de IA + Caminho A (gerar deck) — @dev
3. Caminho B (gerar dentro do deck) + tela de revisão — @dev
4. Paywall via RevenueCat (IAP) — @dev/@architect
5. Lógica de trial (grátis 2-3 dias → cobra) — @dev
6. Submeter à Apple (1.0.4+) com tudo integrado

— Morgan, planejando o futuro 📊
