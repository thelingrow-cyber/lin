# Lingrow — Estratégia de Monetização, Precificação e Formato do Paywall

| Campo | Valor |
|-------|-------|
| Autor | @pm (Morgan) · Fable 5 |
| Data | 2026-07-06 · **v2.0** |
| Changelog | v1.0 recomendava R$19,90-24,90 ancorada nos preços do `competitor-analysis.md` (mai/2026). A v2.0 verificou os preços reais na web em jul/2026 e **três âncoras daquele doc estavam desatualizadas ou erradas** — a recomendação foi refeita sobre os dados verificados. Seções de custo de IA, checkpoint de dados e pré-requisitos permanecem da v1. |
| Escopo | Preço, formato do paywall (o que é grátis vs pago, funcionalidade por funcionalidade), estrutura de tiers. **Não** cobre arquitetura técnica (essa permanece em `fase-5-paywall-plano.md`). |

---

## 1. Benchmark verificado (julho/2026) — o que os concorrentes REALMENTE cobram e vendem

Preços verificados via pesquisa web em 06/07/2026 (fontes ao final). Onde o doc de maio (`competitor-analysis.md`) divergia, está anotado.

| Player | Formato | Preço real (BR quando disponível) | O que fica atrás do paywall | Trial |
|--------|---------|-----------------------------------|------------------------------|-------|
| **Duolingo Free** | Freemium com anúncios + sistema de "vidas" | grátis | — | — |
| **Duolingo Super** | Assinatura | **R$14,99/mês · R$179,90/ano** *(doc de maio dizia ~R$35/mês — preço regionalizado real é bem menor)* | Sem anúncios, vidas ilimitadas, prática personalizada, offline — **nada de IA generativa** | 14 dias |
| **Duolingo Max** | Assinatura (tier IA) | **R$89,90/mês · R$399,90/ano** | Tudo do Super + IA: conversas com personagens, "explique minha resposta" | — |
| **Busuu Premium** | Assinatura | **R$12,90/mês** (canais BR; há semanal a R$4,99) | Curso completo, feedback de nativos, certificação | — |
| **Memrise Pro** | Assinatura + lifetime | ~US$8,49/mês · US$59,99/ano · lifetime ~US$330 | AI Buddies (chatbots), vídeos de nativos, estatísticas, "palavras difíceis" — free é bem limitado | — |
| **BeConfident** | **Somente anual** (vendido como curso) | **R$1.990/ano (~R$166/mês)** *(doc de maio dizia ~R$29/mês — errado por ~6×; eles não competem no cluster de "apps", competem com escola de inglês)* | Tutor de IA ilimitado no WhatsApp, feedback de pronúncia, trilhas | Teste gratuito com análise de nível |
| **AnkiMobile (iOS)** | Compra única | **US$24,99 (~R$140-150)** — sem trial, sem assinatura | O app inteiro (desktop e Android são grátis) | — |

### A leitura estrutural: dois clusters e um gap

O mercado brasileiro de "aprender inglês no celular" tem hoje **dois clusters de preço**:

1. **Cluster "app"** — R$12,90-14,99/mês: Busuu, Duolingo Super. O que se vende aqui é *conveniência* (sem anúncios, offline, vidas). **Nenhum deles entrega IA generativa nesse preço.**
2. **Cluster "IA/curso"** — R$89,90-166/mês: Duolingo Max, BeConfident. O que se vende aqui é *IA trabalhando ativamente para o aluno*. O mercado brasileiro **já foi educado** de que IA para inglês custa esse patamar — o BeConfident fatura R$60M/ano cobrando R$1.990/ano só anual (fonte: Exame).

**O gap entre R$15 e R$90 está vazio.** E o premium do Lingrow é, na essência, um produto de IA (geração de decks + os insights recomendados abaixo). É exatamente nesse gap que ele deve entrar: **"IA de verdade pelo preço de um app comum"** — caro o suficiente para financiar o produto e ser levado a sério, barato o suficiente para ser a barganha óbvia contra o Max.

---

## 2. Preço recomendado (v2.0 — substitui a recomendação da v1)

**R$24,90/mês · R$179,90/ano · trial de 14 dias.**

O raciocínio de cada número:

- **R$179,90/ano é paridade EXATA com o Duolingo Super anual.** Essa é a história de venda mais forte disponível: *"pelo preço do plano do Duolingo que NÃO tem IA, o Lingrow te dá IA que monta seus decks e mostra o que ficou na memória."* Efetivo de R$15/mês — indolor para o Mateus (persona principal, disposição a pagar alta), alcançável para a Clara (sensível a preço, mas disposta a compromisso anual — `user-personas.md`).
- **R$24,90/mês** posiciona acima do cluster "app" (sinaliza que não é só remoção de anúncio) e a ~1/4 do Duolingo Max (a âncora de IA do líder faz o Lingrow parecer barganha). Também cria um desconto anual de ~40% que empurra para o anual — que é onde queremos o assinante (ver formato, seção 3).
- **Trial de 14 dias, não 7** (ajuste sobre o plano atual): o Duolingo dá 14, então 7 parece mesquinho em comparação direta — e, mais importante, **a promessa do Lingrow ("inglês que não some") precisa de tempo para se provar**: o loop do SRS leva dias até o usuário sentir a primeira revisão "chegar na hora certa". Um trial de 7 dias expira antes de o produto mostrar sua mágica; 14 dias cobre dois ciclos de revisão.
- **Não** recomendo lifetime (Memrise cobra US$330; Anki é one-time): com custo variável de IA por assinante, lifetime é passivo perpétuo — e o formato one-time do Anki é justamente o modelo que trava o Anki de evoluir (sem receita recorrente, sem servidor, sem IA).
- **Nota sobre a v1:** a recomendação anterior (R$19,90-24,90) por acaso quase acerta o mesmo pouso, mas pela razão errada — estava ancorada em "BeConfident cobra R$29" (falso) e "Duolingo cobra R$35" (desatualizado). O teto da faixa se mantém; a âncora do anual muda para paridade com o Super, que é defensável com dado verificado.

---

## 3. O formato: o que fica grátis e o que fica pago, funcionalidade por funcionalidade

**Modelo: freemium soft.** O núcleo que prova a promessa fica grátis para sempre; o premium vende amplificação por IA + visibilidade da retenção. O free NUNCA deve dar a sensação de app quebrado/mutilado (o erro do Memrise, cujo free é "severamente limitado" e gera reviews ressentidas) — o Lingrow gratuito precisa continuar sendo genuinamente o melhor flashcard grátis do Brasil, porque ele É o funil de aquisição num contexto onde distribuição é o gargalo nº 1 do projeto.

### GRÁTIS PARA SEMPRE (aquisição + prova da promessa)

| Funcionalidade | Status no código | Racional |
|----------------|------------------|----------|
| Programa 1000 Frases completo + SRS | Existe (com o crítico C1 pendente — só há 400 frases; resolver ANTES do paywall) | É a prova pública da promessa "inglês que não some". Cobrar por isso mataria a aquisição. |
| Decks e cards manuais ilimitados | Existe | O Anki dá isso de graça no Android; cobrar o básico do flashcard é perder a comparação. |
| Notificações de revisão + streak | Existe | Motor de retenção — retenção do FREE é o que gera conversão futura. |
| IA "degustação": 3 gerações/mês, 5 cards cada | Existe (`lib/ai.ts`, edge function) | O usuário precisa PROVAR a IA para querer pagar por ela. 3/mês cria o hábito e o teto. |

### PREMIUM — R$24,90/mês · R$179,90/ano (um único tier no lançamento)

| Funcionalidade | Status no código | Papel na assinatura |
|----------------|------------------|---------------------|
| IA ampliada: 20 gerações/mês, até 20 cards cada (Caminho A e B) | Existe — é só o entitlement liberar | **Gancho de ativação** — o motivo de assinar no mês 1 |
| **"Meu Inglês" — painel de retenção/patrimônio**: % retido, frases em risco de esquecimento, curva de domínio | NÃO existe — mas os dados já estão 100% em `card_progress` (é UI sobre dado existente, custo de IA zero) | **Gancho de permanência** — o motivo de continuar no mês 6. Sem isso, o premium é "cota que se esgota" e o churn come a receita (análise da v1, mantida). É a fatia monetizável do "Movimento 2" da tese de produto (`vision-top1-flashcard-idiomas.md`). |
| Estatísticas avançadas por deck | Não existe (deriva do painel acima) | Reforço do mesmo gancho |

### Reservado para um FUTURO segundo tier (não lançar agora)

O "Movimento 1" da tese de produto — **revisão avaliada por IA** (o usuário fala/escreve a frase, a IA corrige e dá a nota SRS) — tem custo de IA por revisão (volume muito maior que geração de deck) e valor percebido de outra ordem. O mercado já precificou essa categoria: Duolingo Max R$89,90, BeConfident R$166/mês. Quando esse movimento existir, ele é o candidato natural a um tier "Lingrow Max" (~R$39,90-49,90/mês), mantendo o tier atual intacto. **A decisão de hoje que protege esse futuro: não prometer "toda IA presente e futura" no marketing do tier atual** — a comunicação do premium deve nomear o que ele inclui, não vender "IA ilimitada para sempre".

### O que foi considerado e descartado

- **Múltiplos tiers no lançamento** — sem dado de conversão, é complexidade prematura (mantido da v1; o desconto anual já segmenta Mateus/Clara).
- **Lifetime** — passivo perpétuo com custo variável de IA (seção 2).
- **Venda avulsa de packs de decks (one-time IAP)** — fragmenta a proposta, polui o paywall e canibaliza a assinatura; o problema do Lingrow é LTV recorrente, não ticket único.
- **Paywall hard no conteúdo core (modelo BeConfident)** — só funciona com força de marketing de curso (eles têm mídia e vendem transformação); para um app em fase de aquisição orgânica, matar o free é matar o funil.

---

## 4. Custo de IA re-validado (mantido da v1)

Com `claude-haiku-4-5` (modelo em uso na edge function): geração de 20 cards ≈ 500 tokens entrada + ~1.200 saída ≈ **US$0,007/geração**. Assinante no teto (20 gerações/mês): **≈ US$0,14/mês (~R$0,75-0,80)**. Contra R$24,90/mês, margem bruta >96% nessa linha. O painel "Meu Inglês" tem custo de IA **zero** (é leitura de dados existentes). **O custo só vira variável relevante no futuro Movimento 1 — mais um motivo para ele ser tier separado.** (Conferir tabela vigente em anthropic.com/pricing antes de fechar modelo financeiro.)

---

## 5. Ausência de dados do beta → preço é hipótese com checkpoint (mantido da v1)

O OKR O4-KR3 do beta previa decisão de pricing orientada a dados até o dia 20; o documento não existe e o beta teve gargalo de distribuição — os dados nunca existiram em volume. Portanto: lançar com os números da seção 2 como **hipótese testável**, com **checkpoint formal de revisão em 60 dias pós-ativação** (ou ~30-50 conversões pagas, o que vier primeiro), medindo conversão trial→pago e churn do 1º ciclo. Registrar o checkpoint como item da Fase 5.3.

---

## 6. Pré-requisitos NÃO-NEGOCIÁVEIS antes de ativar cobrança (mantido da v1)

1. **Corrigir a RLS de `user_settings`** — hoje o próprio cliente consegue se auto-promover a premium via upsert (achado da auditoria técnica, seção 6 de `technical-debt-assessment-2026-07.md`). Policy de UPDATE bloqueando `is_premium`/`premium_expires_at` para o cliente; fonte da verdade = webhook RevenueCat (service role). Dono: `@data-engineer`. **Bloqueador absoluto.**
2. **C1 — completar/resolver as 1000 frases** — não se vende assinatura sobre uma promessa que já falha no gratuito.
3. **C2 — exclusão de conta compliant** — a revisão da Apple que introduz IAP é mais rigorosa; entrar nela com a exclusão de conta quebrada é pedir rejeição.

---

## 7. Impacto no `fase-5-paywall-plano.md`

O plano técnico (RevenueCat, webhook HMAC, migração 006 aditiva, flag `paywall_enabled` nascendo false) **permanece válido**. Mudanças de configuração e escopo:

| Item do plano | Era | Fica |
|---------------|-----|------|
| Produto mensal (App Store Connect) | R$14,90 | **R$24,90** |
| Produto anual | R$99 | **R$179,90** |
| Trial | 7 dias | **14 dias** |
| Proposta de valor da tela de paywall (Fase 5.2) | "gere mais cards com IA" | IA ampliada **+ painel "Meu Inglês"** (mesmo que o painel chegue numa release logo após — a comunicação nasce certa) |
| Gate da Fase 5.1 | compra sandbox ativa is_premium | + **RLS de is_premium corrigida e testada** (tentativa de auto-upsert deve falhar) |
| Pós-Fase 5.3 | — | + **checkpoint de revisão de preço em 60 dias** |

**Escopo novo a puxar para perto do lançamento:** story do painel "Meu Inglês" (UI sobre `card_progress` — sem migração, sem IA). Se não couber na 1.0.5, entra na 1.0.6 — mas o paywall já o comunica como benefício da assinatura ("chegando para assinantes"), prática padrão da categoria.

---

## 8. Limites desta análise (Artigo IV)

Elasticidade real de preço continua sem dado — a seção 2 é ancoragem competitiva verificada + alinhamento de marca, não teste A/B; o checkpoint da seção 5 existe para substituir julgamento por dado. Os preços dos concorrentes foram verificados em fontes públicas em 06/07/2026 e podem mudar; reconferir App Store Connect/sites oficiais no dia da configuração dos produtos.

### Fontes (verificação de 06/07/2026)

- Duolingo Super/Max preços BR: [Compare Escolas](https://compareescolas.com.br/duolingo-preco-e-como-funciona/), [Fast Company Brasil](https://fastcompanybrasil.com/news/duolingo-lanca-recursos-de-ia-em-plano-max-veja-quanto-custa-no-brasil/), [Papora](https://www.papora.com/pt/aprender-ingles/duolingo-planos/), [olhardigital](https://olhardigital.com.br/2025/05/14/dicas-e-tutoriais/super-duolingo-veja-o-que-e-quais-os-beneficios-e-como-funciona-a-assinatura/)
- Busuu preços BR: [Termos Vivo/Busuu](https://www.busuu.com/pt/terms/vivo), [Compare Escolas](https://compareescolas.com.br/busuu/)
- Memrise Pro: [LinguaSteps](https://linguasteps.com/reviews/memrise-pricing-a-transparent-overview), [Test Prep Insight](https://testprepinsight.com/reviews/memrise-review/)
- BeConfident (R$1.990/ano; faturamento R$60M): [App Store BR](https://apps.apple.com/br/app/beconfident-aprenda-ingl%C3%AAs/id6468505840), [Exame](https://exame.com/negocios/amigos-da-periferia-foram-estudar-nos-eua-e-hoje-faturam-r-60-milhoes-ensinando-ingles-no-whatsapp/), [beconfident.app](https://beconfident.app/en-us/)
- AnkiMobile US$24,99 one-time: [FlashRecall](https://flashrecall.app/blog/anki-ios-price), [Repetrax](https://www.repetrax.com/blog/is-anki-free-on-iphone)

— Morgan, planejando o futuro 📊
