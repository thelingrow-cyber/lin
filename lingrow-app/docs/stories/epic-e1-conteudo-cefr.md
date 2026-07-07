# Épico E1 — 1000 Frases de Verdade: Trilha CEFR com Capítulos Temáticos

| Campo | Valor |
|-------|-------|
| Release | **1.1 "Retenção"** |
| Origem | `prd-v2.md` Bloco B (FR-B1..B6) · resolve o C1 da auditoria técnica (só existem 400 frases) · `ceo-review-2026-07.md` §5.3 |
| Por quê | O conteúdo É o produto. 400 frases A1 uniformes desalinham a promessa ("1000 frases") e a persona (profissional que quer inglês de carreira) |
| Dependências | E2 lançado (o placement test da story E1.4 pluga no onboarding existente) |
| Estimativa | 5 stories · ~2-3 semanas (produção de conteúdo é o gargalo, paralelizável com E3) |

## Contexto para quem implementa

- Conteúdo atual: `mobile-new/data/sentences.ts` — 400 frases, interface `SentenceData { position, front, back, keyword, keywordPt }`. Cards built-in são VIRTUAIS (não existem no banco; progresso referencia `card-builtin-{position}` — FK já removida na migration 005).
- Isso significa: **adicionar/reorganizar frases NÃO exige migração de banco** — só bundle. Mas MUDAR positions de frases existentes QUEBRA o progresso de usuários reais (o id do progresso é a position). REGRA ABSOLUTA: positions 1-400 são imutáveis; frases novas ocupam 401-1000.
- Distribuição CEFR alvo (FR-B1): A1 ×200 · A2 ×250 · B1 ×300 · B2 ×250. Como 1-400 já são majoritariamente A1/A2 fáceis, o mapeamento de capítulos (E1.2) fará a reclassificação SEM mover positions.
- Home mostra `SENTENCES.length` (pós-Fase 0) — a barra de progresso se ajusta sozinha a cada lote.

---

## Story E1.1 — Pipeline de produção de conteúdo (FR-B6)

**Como** time, **quero** um pipeline reprodutível de geração+curadoria+validação **para que** as 600 frases novas tenham qualidade uniforme e o processo sirva para futuros idiomas/expansões.

### Critérios de aceite
1. Script `scripts/content/generate-sentences.ts` (Node, roda local): recebe `--chapter "Reuniões sem travar" --level B1 --count 25 --positions 401-425`, chama a API Anthropic (mesmo padrão de tool-use/schema da edge function `generate-cards`) e emite `output/chapter-{slug}.json` com frases candidatas.
2. Prompt de geração encapsula as regras editoriais: inglês AMERICANO contemporâneo e natural (como um nativo falaria, não tradução literal), PT-BR brasileiro real, keyword = a palavra de maior valor de aprendizado da frase, tamanho 4-12 palavras, zero sobreposição com frases existentes (lista de keywords já usadas vai no prompt).
3. Validador `scripts/content/validate-sentences.ts`: schema, duplicatas exatas e near-duplicates (keyword+estrutura), distribuição CEFR do lote, positions dentro do range reservado. Falha = lote não entra.
4. **Curadoria humana obrigatória**: o JSON gerado tem campo `approved: false` por frase; o fundador (ou curador) revisa e aprova; só frases aprovadas entram no bundle. O script `scripts/content/bundle-sentences.ts` monta o `sentences.ts` final APENAS com aprovadas.
5. Registro de curadoria versionado: `content/curation-log.md` (lote, data, quem aprovou, taxa de rejeição).
6. Custo por lote de 25 frases documentado no log (estimativa: centavos com claude-haiku; conferir na 1ª execução).

### Tasks
- [ ] Script de geração com tool-use schema
- [ ] Validador (schema/dupes/distribuição)
- [ ] Script de bundle (JSON aprovado → sentences.ts)
- [ ] Gerar lote-piloto de 25, medir custo e taxa de aprovação
- [ ] Documentar o fluxo em `content/README.md`

---

## Story E1.2 — Estrutura de capítulos e níveis no app (FR-B2, FR-B3)

**Como** usuário, **quero** ver as 1000 frases organizadas em capítulos com nome e propósito **para que** meu progresso tenha forma e significado, não só um número.

### Especificação da estrutura de dados

```ts
// data/chapters.ts (novo)
export interface Chapter {
  id: string;            // 'reunioes-sem-travar'
  title: string;         // 'Reuniões sem travar'
  emoji: string;         // '💼'
  level: 'A1'|'A2'|'B1'|'B2';
  order: number;         // ordem pedagógica global
  positionStart: number; // frases position N..M pertencem ao capítulo
  positionEnd: number;
}
// SentenceData ganha: level: 'A1'|'A2'|'B1'|'B2'; contextNote?: string
```

- Capítulos mapeiam RANGES de positions (frases 1-400 são reclassificadas em capítulos SEM mudar position — o range resolve).
- Plano de capítulos (títulos finais, ~40 capítulos): definido em `content/chapter-plan.md` gerado nesta story e aprovado pelo fundador ANTES da produção em massa. Exemplos por objetivo da persona: A1 "Primeiras palavras que importam", "Sobrevivência no dia a dia"; A2 "Pedindo e resolvendo", "Viagem: aeroporto e hotel"; B1 "Trabalho: reuniões", "E-mails que funcionam", "Small talk de corredor"; B2 "Negociação", "Entrevista de emprego", "Opinião e debate".

### Critérios de aceite
1. `data/chapters.ts` + `SentenceData` estendido; typecheck limpo; positions 1-400 INTOCADAS.
2. Tela do deck 1000 (`app/deck/[deckId].tsx`) mostra a lista de capítulos com progresso por capítulo (X/25) e cadeado visual nos capítulos à frente do ponto atual (desbloqueio linear por nível; dentro do nível, livre).
3. Sessão de estudo respeita a ordem: frases novas vêm do capítulo ativo do usuário.
4. `getStudySession` mantém contrato atual (regressão: `store/lingrow.test.ts` passa; teste novo cobre seleção por capítulo).
5. Usuário existente (progresso nas positions antigas): capítulo ativo = o do primeiro card não-visto; nada re-trava o que ele já estudou.

### Tasks
- [ ] `content/chapter-plan.md` (40 títulos + ranges) → aprovação do fundador
- [ ] `data/chapters.ts` + tipos
- [ ] UI de capítulos na tela do deck
- [ ] Seleção de sessão por capítulo + testes

---

## Story E1.3 — Produção dos lotes 401-1000 (FR-B1)

**Como** produto, **quero** as 600 frases restantes produzidas, curadas e embarcadas em lotes **para que** a promessa "1000 frases" seja verdadeira.

### Critérios de aceite
1. Lotes por capítulo (25 frases), na ordem do `chapter-plan.md`, priorizando os capítulos B1 de trabalho (maior densidade de valor para a persona).
2. Cada lote passa pelo pipeline E1.1 completo (gerar → validar → curadoria → bundle).
3. Marcos de entrega: +200 frases (600 total) libera release 1.1; +400 (800) e +200 (1000) podem entrar em patch releases 1.1.x — **a 1.1 NÃO espera as 1000**.
4. A cada lote embarcado: contagem no app, barra e capítulos se ajustam automaticamente (verificação manual por lote).
5. Zero frase reprovada no ar: `bundle-sentences.ts` é a única porta de entrada.

### Tasks
- [ ] 8 lotes B1-trabalho + A2 (chegar a 600) — gate da 1.1
- [ ] 8 lotes seguintes (800) — 1.1.1
- [ ] 8 lotes finais (1000) — 1.1.2
- [ ] Log de curadoria completo por lote

---

## Story E1.4 — Placement test no onboarding (FR-B4)

**Como** Mateus (que não é iniciante), **quero** provar em 2 minutos onde estou **para que** eu não perca semanas em "She has a dog".

### Critérios de aceite
1. Novo passo no onboarding (após o passo de nível do E2 — o autorrelato define o PONTO DE PARTIDA do teste, o teste refina): 12 frases em dificuldade crescente (2×A1, 3×A2, 4×B1, 3×B2, selecionadas de posições fixas dos capítulos), UI de 1 toque: "Sei falar essa" / "Essa não".
2. Regra de posicionamento (simples e transparente, sem IA): primeiro nível com <60% de "sei" = nível de entrada; usuário inicia no primeiro capítulo desse nível.
3. Frases anteriores ao ponto de entrada são marcadas como "puladas" (estado local, NÃO grava progresso SRS falso) — contam na barra como "puladas" (ex.: "142 puladas · 37 suas"), e um botão "revisar do início" permite recuperá-las.
4. Usuário `zero` no autorrelato PULA o teste (começa do capítulo 1 — não fazer iniciante absoluto passar por 12 frases que não sabe).
5. Todo o fluxo emite analytics (placement_started, placement_answer, placement_result).
6. Tempo mediano < 2 min (verificar com 5 testadores).

### Tasks
- [ ] Tela do placement test (integrada ao stepper do E2)
- [ ] Lógica de posicionamento + estado "puladas"
- [ ] Ajuste da barra de progresso (puladas ≠ aprendidas)
- [ ] Analytics + teste com pessoas reais

---

## Story E1.5 — Celebração de fim de capítulo (FR-B5, ponte com E3)

**Como** usuário, **quero** que completar um capítulo SEJA um acontecimento **para que** meu progresso tenha marcos memoráveis (e compartilháveis).

### Critérios de aceite
1. Ao responder a última frase nova de um capítulo: tela de celebração (`app/chapter-done.tsx`): nome do capítulo vencido, nº de frases do patrimônio total, próximo capítulo revelado. Confete SUTIL (1,5s, respeitando reduce-motion) + haptic de sucesso.
2. Texto no tom da marca (sem "Parabéns!!! 🎉🎉"): "Capítulo seu. As 25 frases de 'Reuniões sem travar' agora fazem parte do seu inglês — e o Lingrow não deixa elas irem embora."
3. Botão "Compartilhar marco" presente mas a geração do share card em si é da story E3.3 (aqui: placeholder que abre share sheet com texto, upgrade para imagem quando E3.3 chegar).
4. Evento `chapter_completed` (chapterId, level, totalOwned).
5. Regressão: fim de sessão normal (sem fim de capítulo) intacto.

### Tasks
- [ ] Tela de celebração + detecção de fim de capítulo
- [ ] Haptic + confete com reduce-motion
- [ ] Share placeholder + analytics

---

## Gate do épico

- [ ] 600+ frases aprovadas no ar (para 1.1); plano claro para 1000
- [ ] @qa: usuário antigo não perde nada (positions imutáveis verificadas), placement não grava progresso falso
- [ ] Fundador aprovou `chapter-plan.md` e amostra de 50 frases da curadoria
- [ ] Métricas: onboarding→primeira sessão não regrediu vs E2

— Orion, orquestrando o sistema 🎯
