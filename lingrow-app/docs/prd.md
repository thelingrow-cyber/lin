# Lingrow — Product Requirements Document (PRD)

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2026-05-17 | 1.0 | Versão inicial — pré-lançamento beta | @pm (Morgan) + Fundador |
| 2026-06-11 | 1.1 | Detalhamento da feature de IA (Criar Cards com IA) na v2 | @pm (Morgan) + Fundador |

---

## 1. Goals e Contexto

### Goals

- Entregar um app de flashcards para inglês que brasileiros adultos realmente usem todo dia
- Provar retenção D7 > 20% no beta de 20 dias
- Validar que o modelo freemium (1000 frases grátis + premium pago) é viável
- Estabelecer base técnica estável para escalar para v2 (IA + Turmas Colaborativas)
- Coletar feedback qualitativo dos primeiros 100 usuários para guiar o roadmap

### Background Context

O mercado de aprendizado de inglês no Brasil é enorme — mais de 30 milhões de brasileiros estão ativamente tentando aprender inglês. As soluções existentes falham de formas previsíveis: o Anki é poderoso mas feio, complexo e exige que o usuário crie tudo do zero. O Duolingo é gamificado ao ponto de ser superficial — ninguém fica fluente jogando. O Quizlet é americano, pesado e não foi desenhado para o brasileiro.

O Lingrow preenche esse gap: um app de spaced repetition moderno, simples, com conteúdo pronto em português-inglês, feito para o brasileiro adulto que quer aprender inglês de verdade em 10 minutos por dia — sem precisar ser tech-savvy nem criar nada do zero.

---

## 2. Persona Principal

**Nome:** João (representativo)
**Perfil:** Brasileiro, 25-40 anos, trabalha em área que exige ou vai exigir inglês (TI, vendas, saúde, educação, negócios). Já tentou aprender inglês antes — curso, Duolingo, YouTube — mas não manteve consistência. Sabe que precisa, tem motivação real (promoção, cliente internacional, sonho de viajar), mas não tem tempo para estudar horas por dia.

**Dores:**
- Anki é complicado demais para configurar
- Duolingo parece brincadeira, não progresso real
- Cursos são caros e exigem horário fixo
- Falta de feedback sobre o que realmente aprendeu

**O que ele quer:**
- Estudar 10 minutos por dia e sentir que está evoluindo
- Não precisar criar nada — conteúdo pronto e relevante
- Saber quando revisar (não depender de memória)
- Ver progresso visual ao longo do tempo

---

## 3. Requisitos Funcionais (v1)

**FR1:** O app deve exibir flashcards com frente (inglês) e verso (português) com animação de flip.

**FR2:** O sistema SRS deve calcular o próximo intervalo de revisão com base na resposta do usuário (Again / Hard / Good / Easy) usando o algoritmo SM-2 adaptado.

**FR3:** O app deve incluir um deck built-in de 1000 frases essenciais em inglês com tradução em português, com keyword destacada.

**FR4:** O usuário deve poder criar decks personalizados com nome, descrição e cor.

**FR5:** O app deve reproduzir o áudio da frase em inglês americano (EN-US) durante a revisão.

**FR6:** O app deve agendar notificações locais para lembrar o usuário de revisar, cancelando e reagendando automaticamente conforme o comportamento de uso.

**FR7:** O app deve registrar e exibir o streak de dias consecutivos de estudo.

**FR8:** O app deve suportar autenticação via Sign In with Apple (iOS), Google OAuth e email/senha via Supabase Auth.

**FR9:** O app deve exibir progresso visível na home: frases aprendidas, barra de progresso, cards pendentes de revisão.

**FR10:** O app deve exibir um modal de boas-vindas ao primeiro acesso comunicando o caráter beta e convidando ao feedback.

**FR11:** O app deve oferecer canal direto de feedback via WhatsApp na tela de configurações.

**FR12:** O progresso do usuário deve ser sincronizado com Supabase para persistência entre dispositivos.

---

## 4. Requisitos Não-Funcionais (v1)

**NFR1:** O app deve funcionar em iOS 16+ e Android 10+.

**NFR2:** O tempo de carregamento da sessão de estudo deve ser inferior a 2 segundos em conexão 4G.

**NFR3:** O app deve funcionar offline para sessões de revisão (cards já carregados), sincronizando ao reconectar.

**NFR4:** A chave de API do Supabase deve ser armazenada em variáveis de ambiente, nunca em código-fonte.

**NFR5:** Notificações locais não devem disparar durante uma sessão ativa de revisão.

**NFR6:** O app deve ser submetido seguindo as diretrizes da Apple App Store Review Guidelines e Google Play Policy.

**NFR7:** Dados de progresso do usuário devem ser protegidos por Row Level Security (RLS) no Supabase — nenhum usuário acessa dados de outro.

---

## 5. UI/UX Goals

**Visão geral:** Interface limpa, moderna e motivacional. Roxo (`#7C3AED`) como cor primária. Sensação de progresso constante — o usuário deve sempre saber onde está e o que fez.

**Paradigmas de interação:**
- Toque para revelar o verso do card
- Botões de resposta SRS grandes e claros (Novamente / Difícil / Bom / Fácil)
- Feedback visual imediato (overlay colorido ao responder)

**Telas principais:**
- Login / Onboarding
- Home (dashboard com streak, progresso, CTA de estudo)
- Sessão de estudo (flashcard + botões SRS)
- Tela de deck (listagem de cards)
- Revisar (lista de decks com cards pendentes)
- Criar (novo deck e cards)
- Configurações (feedback, privacidade, logout)

**Plataformas:** iOS e Android (React Native)

**Branding:** Roxo `#7C3AED`, emoji 🌱 como identidade visual, tipografia bold para títulos, tom encorajador e direto.

---

## 6. Premissas Técnicas

**Stack:**
- Frontend: React Native com Expo (SDK 52+), TypeScript, Expo Router
- Backend/Auth/DB: Supabase (PostgreSQL + Auth + Row Level Security)
- Notificações: expo-notifications (local, sem servidor)
- Analytics: PostHog (React Native SDK)
- Build/Deploy: EAS Build + EAS Submit
- Áudio: expo-speech (TTS nativo)

**Arquitetura:** Monorepo com pasta `mobile-new/` como projeto ativo. Arquitetura cliente-servidor simples — app React Native + Supabase como BaaS.

**Repositório:** Monorepo em `lingrow-app/mobile-new/`

**Testes:** Manual (beta v1). Testes automatizados planejados para v2.

---

## 7. Roadmap

### v1 — Beta (atual)
**Objetivo:** Validar retenção e product-market fit com primeiros usuários via influenciadores.
**Duração:** 20 dias (~19 Mai → 08 Jun 2026)
**Tudo gratuito durante o beta.**

Entregáveis:
- SRS completo com deck de 1000 frases
- Decks customizados
- Auth (Apple, Google, Email)
- Notificações locais
- Streak e progresso visual
- Modal de boas-vindas beta
- Canal de feedback (WhatsApp)

**Métricas de sucesso do beta:**
- D7 retention > 20%
- D14 retention > 12%
- Mínimo 10 feedbacks qualitativos recebidos
- Zero crashes críticos relatados

---

### v2 — Monetização + IA (pós-beta)
**Objetivo:** Ativar receita e expandir o produto com features de alto valor percebido.
**Previsão:** Q3 2026

**Modelo freemium ativado:**
- **Free para sempre:** Deck de 1000 frases + SRS completo + notificações
- **Premium — R$14,90/mês ou R$99/ano:**
  - Decks customizados ilimitados
  - Criar deck com IA (usuário descreve o tema, IA gera os cards)
  - Turmas Colaborativas (professores criam turmas, compartilham decks)
  - Estatísticas avançadas de progresso

**Features v2:**
- Integração Claude API / GPT via Supabase Edge Functions para geração de decks
- Sistema de turmas com controle de permissões (professor / aluno)
- Paywall e gestão de assinatura (RevenueCat ou Stripe)
- B2B: plano institucional para escolas e cursinhos

#### Feature âncora: Criar Cards com IA

> Documento de conceito completo: `docs/features/ai-deck-creator.md` (idealização concluída 2026-06-11)

**Conceito:** um motor único (`tema + quantidade → cards`) exposto em dois pontos de entrada — não são features separadas:
- **Caminho A — "Criar deck com IA":** na home, ao lado de "Novo Deck". O usuário descreve um tema e a IA gera um deck novo pronto. É o momento "uau" que justifica o premium.
- **Caminho B — "Gerar mais cards":** dentro de um deck existente. A IA completa o deck que o usuário já começou. Fideliza.

**Princípios de produto fechados:**
- **UX mínima, fiel à marca:** tela de entrada com campo de texto + chips-atalho (Viagem, Trabalho, etc.) + botão Gerar. Sem formulário. Entrada por voz via teclado nativo.
- **Tela de revisão obrigatória:** a IA gera, o usuário apaga/edita/aprova antes de salvar. Protege a qualidade do estudo.
- **Limites de custo desde o dia 1:** teto por geração (~20 cards) e teto mensal por usuário (~20 gerações/mês), calibráveis.
- **Nível de dificuldade** absorvido pelo texto livre ou ajustado na revisão ("mais fácil / mais difícil") — não polui a entrada. Não altera o SRS.
- **Segurança:** chamada via Supabase Edge Function, chave de API nunca no cliente.
- **Formato dos cards** idêntico ao deck 1000 (frente EN + verso PT + nota); áudio via TTS nativo já existente.

**Pendências técnicas (para @architect):** definição do modelo de IA e custo por geração, estrutura da Edge Function com rate limiting e contagem de quota por usuário.

**Decisão de go-to-market (2026-06-11):** construir a feature de IA **e** o paywall antes de submeter à Apple (lançamento completo). Modelo de monetização: **freemium em camadas** — IA restrita no grátis (2-3 gerações/mês, isca de conversão), generosa no premium (20/mês), com **trial de 7 dias** do premium. Preço a definir após custo da IA. Alertas a resolver antes de executar: (1) pagamento iOS via In-App Purchase / RevenueCat — não usar checkout externo, sob pena de rejeição; (2) confirmar custo real da IA vs preço antes de ligar a cobrança — risco maior no volume do grátis. Ver `docs/features/ai-deck-creator.md` §8 e §13.

---

### v3 — Escala (futuro)
- Feedback de pronúncia com IA
- Modo conversa em inglês com IA
- Marketplace de decks da comunidade
- Internacionalização (outros idiomas além de inglês)

---

## 8. Concorrentes

| Produto | Pontos Fortes | Fraqueza vs Lingrow |
|---------|--------------|---------------------|
| **Anki** | Poderoso, gratuito, open-source | Feio, complexo, exige criar tudo, sem conteúdo BR |
| **Duolingo** | Grande base, gamificação | Superficial, não gera fluência real, não é SRS |
| **Quizlet** | Conteúdo vasto | Americano, pesado, sem foco no brasileiro |

**Posicionamento:** O Lingrow é o único app de SRS feito para o brasileiro adulto — com conteúdo pronto, interface moderna e foco em progresso real, não em gamificação vazia.

---

## 9. O que está FORA do escopo (v1)

- Feedback de pronúncia
- Modo conversa com IA
- Turmas / colaboração
- Marketplace de decks
- Cobrança / paywall
- Suporte a outros idiomas além de inglês

---

## 10. Próximos Passos

**Para o Architect:**
> O app está em produção (v1.0.2). A arquitetura atual é React Native (Expo) + Supabase. Para v2, avaliar: (1) integração Claude API via Supabase Edge Functions para geração de decks com IA, (2) schema de turmas colaborativas no Supabase com RLS granular, (3) integração de paywall (RevenueCat recomendado para React Native).

**Para o @sm (criação de stories v2):**
> Baseado neste PRD, criar épicos para: (1) Monetização + Paywall, (2) IA — Geração de Decks, (3) Turmas Colaborativas. Prioridade nessa ordem.
