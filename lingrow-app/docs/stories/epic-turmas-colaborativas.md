# Epic: Turmas Colaborativas — Lingrow v2

**Status:** Draft  
**Criado por:** @pm (Morgan)  
**Data:** 2026-04-26  
**Complexidade:** STANDARD (Score 15/25 — avaliado por @architect Aria)  
**Prioridade:** Backlog (pós-lançamento v1)

---

## Epic Goal

Transformar o Lingrow de um app de estudo individual em uma plataforma de aprendizado colaborativo, permitindo que professores e usuários criem turmas, compartilhem decks e estudem inglês em grupo — com controle granular de permissões.

---

## Contexto Estratégico

**Origem:** Ideia proposta por colaborador do projeto.

**Problema que resolve:** O estudo de idiomas é isolado por natureza nos apps atuais. O Lingrow v1 é individual. A v2 cria a camada social que transforma o app em plataforma.

**Posicionamento de mercado:**
- Concorrente mais próximo: Quizlet (mas americano, pesado, sem foco no público BR)
- Gap real: nenhum app de flashcard para brasileiro aprendendo inglês tem colaboração genuína
- Abre mercado B2B (escolas, professores, cursinhos) além do B2C atual

**Por que agora:** O stack atual (Expo + Supabase) suporta completamente a feature sem mudança de infraestrutura. A decisão foi validada tecnicamente pela @architect.

---

## Descrição da Feature

### Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| Criar turma | Usuário/professor cria uma turma com nome e configurações |
| Visibilidade | Turma pode ser pública (qualquer um entra) ou privada (convite/código) |
| Entrar na turma | Via link de convite ou código de acesso |
| Permissão de conteúdo | Admin define se só ele ou todos os membros podem adicionar cards |
| Decks compartilhados | Decks da turma visíveis para todos os membros |
| Progresso individual | Cada membro mantém seu progresso de estudo independente |

### Roles

| Role | Permissões |
|---|---|
| `admin` | Criar turma, gerenciar membros, configurar permissões, adicionar cards sempre |
| `member` | Entrar na turma, estudar decks, adicionar cards (se admin permitir) |

---

## Avaliação de Complexidade (@architect)

| Dimensão | Score | Motivo |
|---|---|---|
| Escopo | 4/5 | Novas telas, novo domínio (teams, membros, permissões) |
| Integração | 3/5 | Tudo no Supabase, sem APIs externas, mas RLS complexo |
| Infraestrutura | 2/5 | Supabase já existe, sem mudança de infra |
| Conhecimento | 3/5 | RLS com roles é novo em relação ao que existe hoje |
| Risco | 3/5 | Permissões erradas = usuário vê dados de outra turma |
| **Total** | **15/25** | **Classe STANDARD** |

**Ponto crítico identificado:** O RLS (Row Level Security) do Supabase é o coração da feature — precisa ser desenhado antes de codar para garantir isolamento de dados entre turmas.

---

## Stories Previstas

### Story 1 — Schema e RLS de Turmas
- **Executor:** `@data-engineer`
- **Quality Gate:** `@dev`
- **Descrição:** Criar tabelas `teams`, `team_members`, `team_decks` com RLS policies garantindo que membros só acessem dados de suas próprias turmas
- **Quality Gates:**
  - Pre-Commit: validação de schema, service filters, RLS policies
  - Pre-PR: revisão de migração SQL, segurança de acesso

### Story 2 — Criar e Entrar em Turmas (Mobile)
- **Executor:** `@dev`
- **Quality Gate:** `@architect`
- **Descrição:** Telas de criar turma, entrar via código/link, listagem de turmas do usuário
- **Quality Gates:**
  - Pre-Commit: security scan, validação de fluxo de convite
  - Pre-PR: validação de contrato de API, compatibilidade com auth existente

### Story 3 — Gestão de Decks e Permissões na Turma
- **Executor:** `@dev`
- **Quality Gate:** `@architect`
- **Descrição:** Tela da turma com decks compartilhados, controle de permissão de adição de cards, progresso individual por membro
- **Quality Gates:**
  - Pre-Commit: validação de permissões, testes de acesso
  - Pre-PR: revisão de UX e fluxo de permissão

---

## Requisitos de Compatibilidade

- [ ] Auth existente (email + Apple) permanece inalterada
- [ ] Decks individuais não são afetados
- [ ] Schema novo é aditivo (sem breaking changes)
- [ ] Performance de estudo individual não é impactada

---

## Risco Principal e Mitigação

**Risco:** Permissões mal configuradas expõem dados de uma turma para membros de outra.

**Mitigação:** @data-engineer desenha e valida RLS antes de qualquer código de feature. Testes de isolamento obrigatórios na Story 1.

**Rollback:** Migrations são reversíveis. Feature pode ser desabilitada sem afetar funcionalidade existente.

---

## Definition of Done

- [ ] Usuário consegue criar turma pública e privada
- [ ] Usuário consegue entrar via código ou link
- [ ] Admin consegue configurar quem adiciona cards
- [ ] Decks da turma aparecem para todos os membros
- [ ] Progresso individual é mantido separado
- [ ] Isolamento de dados entre turmas validado
- [ ] Funcionalidade existente (decks individuais, estudo, login) sem regressão

---

## Próximos Passos

1. **@data-engineer** — Desenhar schema detalhado (`teams`, `team_members`, `team_decks`)
2. **@sm** — Detalhar as 3 stories com critérios de aceitação completos
3. **@po** — Validar stories antes de iniciar desenvolvimento
4. **Timing:** Após lançamento e validação de retenção da v1

---

## Handoff para @sm

> "Desenvolva as 3 stories detalhadas deste epic. Stack: Expo (React Native) + Supabase.
> Padrões existentes: auth via Supabase, RLS já em uso, telas em `app/(tabs)/`.
> Requisito crítico: cada story deve incluir verificação de que funcionalidade existente permanece intacta.
> A Story 1 é pré-requisito para as Stories 2 e 3."

— Morgan, planejando o futuro 📊
