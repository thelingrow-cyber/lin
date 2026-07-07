# Lingrow — Visão: De App de Flashcard a Top 1 de Idiomas

| Campo | Valor |
|-------|-------|
| Autor | @architect (Aria) · Fable 5 |
| Data | 2026-07-05 |
| Tipo | Documento de visão (não é PRD, não é arquitetura de execução — é a tese que orienta ambos) |
| Pré-requisito | Correções da Fase 0/A de `technical-debt-assessment-2026-07.md` — nenhum destes movimentos deve nascer sobre um alicerce que ainda perde progresso do usuário |

---

## 1. O problema, olhado de fora

Todo app de flashcard vende a mesma coisa: um agendador de memória. O algoritmo SRS decide *quando* revisar. Mas duas responsabilidades continuam nas costas do usuário, e é aí que a categoria inteira quebra:

1. **Ele precisa criar o material.** O Anki é o teto da categoria justamente porque exige que o usuário seja o próprio professor — curar frases, formatar cards, manter o baralho. 95% das pessoas não fazem isso por muito tempo.
2. **Ele precisa se julgar honestamente.** Virar o card e pensar "ah, era isso" é **reconhecimento**, não **produção**. Reconhecer uma frase em inglês não é saber falar inglês. É por isso que gente com milhares de reviews no Anki trava na hora de falar de verdade.

O Duolingo resolveu a adesão (gamificação, streak, notificação), mas **o modelo de negócio dele depende da punição do lapso** — perder o streak é o motor de re-engajamento. Isso cria exatamente o inimigo que o posicionamento de marca da Lingrow já nomeou: *a indústria que lucra com recomeços*.

**O gap real, no nível do sistema e não só do marketing:** ninguém no mercado tem alta adesão **e** alta retenção ao mesmo tempo. Duolingo tem adesão. Anki tem retenção (para quem sobrevive à curva de entrada). Essa tese é sobre fechar os dois lados sem copiar o mecanismo que causa o segundo problema.

---

## 2. Por que o Lingrow pode fazer o que os outros não podem

O Lingrow já tem em produção a peça que muda a categoria: **uma edge function de IA com custo controlado dentro do loop do produto** (`generate-cards` — quota atômica, kill switch, validação server-side). Isso não é feature de conveniência — é infraestrutura que o Anki estruturalmente não tem (sem servidor, sem IA) e que o Duolingo estruturalmente não quer usar dessa forma (currículo fixo e centralizado é o modelo de negócio dele).

Essa mesma infraestrutura, apontada para dentro do loop de revisão em vez de só para a criação de decks, resolve os dois problemas do parágrafo 1 ao mesmo tempo.

---

## 3. Os três movimentos (uma tese, não uma lista de features)

### Movimento 1 — O review passa a exigir produção, não reconhecimento

Hoje: mostra a frase em inglês → usuário vira o card → usuário se autoavalia (Again/Hard/Good/Easy).

Proposto: mostra a frase em **português** → usuário **fala ou escreve** a versão em inglês → a IA avalia a resposta e **ela mesma** decide a nota SRS.

O botão de autoavaliação — a parte estruturalmente desonesta de todo flashcard, porque ninguém se pune de propósito — desaparece. Isso transforma o Lingrow de "app de memorização passiva" em "treino de fluência mensurável". Nenhum concorrente relevante do mercado brasileiro faz isso hoje.

**Viabilidade:** é uma edge function irmã da `generate-cards`, reaproveitando o mesmo padrão de quota atômica, kill switch e validação server-side já validado em produção. O custo por review precisa ser modelado (é o item de maior risco técnico e financeiro da tese) — provavelmente como feature premium desde o início, não gratuita.

### Movimento 2 — O streak morre; nasce o patrimônio

Hoje: `user_settings.streak` conta dias consecutivos. Sumir 3 semanas zera o contador e gera culpa — o gatilho de abandono mais comum da categoria.

Proposto: a tela central deixa de mostrar "🔥 12 dias" e passa a mostrar o **patrimônio de conhecimento** — "347 frases suas, 91% retidas hoje" — usando dados que o app já guarda em `card_progress` (ease_factor, repetitions, next_review por card). Quando o usuário some e volta, em vez de streak zerado, ele vê: *"Seu inglês não foi embora. 87% intacto. 19 frases precisam de retoque — 12 minutos para recuperação total."*

**A volta vira o momento-herói do produto**, não o momento de punição. Isso faz "inglês que não some" deixar de ser slogan de marketing e virar mecânica de produto — e é uma mudança que o Duolingo não pode replicar sem canibalizar o próprio modelo de retenção via culpa.

**Viabilidade:** é majoritariamente uma mudança de leitura/apresentação sobre dados que já existem no schema atual. Baixo risco técnico, alto risco de decisão de produto (é uma mudança de identidade visual e de métrica de sucesso interna — precisa de alinhamento com o fundador antes de tocar no código).

### Movimento 3 — O material vem da vida do usuário, não de um currículo fixo

Hoje: "Criar deck com IA" já gera cards a partir de um tema em texto.

Proposto (extensão natural do que já está em produção): gerar deck a partir de uma vaga de emprego colada, uma letra de música, um print de conversa, uma transcrição de reunião. O material de estudo nasce do contexto real do usuário, não de um banco de frases genéricas — algo que o Anki não pode oferecer (sem servidor/IA) e que o Duolingo não quer oferecer (currículo centralizado é o produto dele).

**Viabilidade:** extensão direta da arquitetura já validada (`ai-deck-creator-architecture.md`); o esforço principal é de prompt engineering e UX de input, não de infraestrutura nova.

---

## 4. Por que isso não é "mais uma feature"

As três peças não competem por espaço no roadmap — são a mesma tese vista de três ângulos: **o produto para de terceirizar para o usuário o trabalho de curar conteúdo e de se autoavaliar, e passa a fazer isso por ele, usando a IA que já está em produção.** Isso é o que separa "um Anki mais bonito" de "categoria nova".

---

## 5. Ordem de execução recomendada

Esta tese **não deve começar** enquanto os itens críticos de `technical-debt-assessment-2026-07.md` estiverem abertos — em especial C1 (só existem 400 das 1000 frases prometidas) e H1/H4 (falha de rede pode zerar streak/progresso). Lançar o Movimento 2 ("seu inglês não some") sobre um sistema que ainda apaga progresso silenciosamente é o oposto exato da proposta.

**Sequência sugerida:**
1. Fase 0/A do relatório de dívida técnica (alicerce).
2. Fase 5 do paywall (RevenueCat) — já planejada, mantém o caixa girando.
3. Movimento 2 (patrimônio de conhecimento) — menor risco técnico, maior alinhamento de identidade; bom primeiro passo da tese.
4. Movimento 3 (material da vida real) — extensão de infraestrutura existente.
5. Movimento 1 (review por produção) — maior risco e maior diferenciação; requer modelagem de custo cuidadosa antes de comprometer prazo.

---

## 6. Próximo passo formal

Este documento é uma tese, não um plano de execução. O passo seguinte no processo AIOX é o **@pm (Morgan)** transformar os movimentos aprovados em epics com stories, critérios de aceite e estimativa de custo — em particular o Movimento 1, que tem o maior risco técnico-financeiro (custo de IA por review) e merece uma avaliação de complexidade (`@architect *assess-complexity`) antes de virar epic.

— Aria, arquitetando o futuro 🏗️
