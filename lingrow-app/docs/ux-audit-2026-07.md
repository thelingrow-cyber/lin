# Lingrow — Auditoria de UX/UI (Julho 2026)

| Campo | Valor |
|-------|-------|
| Auditora | @ux-design-expert (Uma) · Fable 5 |
| Data | 2026-07-05 |
| Escopo | Identidade visual (ícone, splash), telas de `mobile-new/app/`, consistência de marca, acessibilidade básica |
| Método | Inspeção visual real dos assets de imagem (não só código) + leitura de todas as telas + comparação entre plataformas (iOS/Android) |
| Fora do escopo | Bugs técnicos e dívida de código (ver `technical-debt-assessment-2026-07.md`); estratégia de planos/pagamentos (pendente, próxima rodada com @pm) |

---

## 1. Sumário Executivo (em linguagem simples)

Você estava certo em desconfiar da tela de abertura — e ao abrir os arquivos de imagem de verdade (não só o código), encontrei algo mais sério do que um ajuste de cor: **o ícone do Android que está publicado hoje é literalmente o desenho de exemplo que o Expo (a ferramenta usada para construir o app) coloca de propósito para servir de guia** — aquelas linhas e círculos tracejados que servem para o designer saber onde não pode desenhar. Ninguém desenhou o ícone do Android de verdade; o rascunho de referência foi publicado no lugar do produto final. Comparado a isso, o problema da splash que você notou é pequeno.

Além disso, descobri que **o app tem duas marcas diferentes competindo entre si sem que ninguém tenha decidido isso**: existe um monograma bonito — um "L" com uma folhinha brotando dele, em gradiente roxo-azul — usado no ícone da Apple e na splash. Mas o ícone do Android (quando corrigido) mostra uma seta azul sem nenhuma relação com esse monograma, e **dentro do próprio app, esse monograma nunca aparece** — as telas usam um ícone genérico de "folha" de uma biblioteca padrão, dentro de círculos coloridos, e o texto "Lingrow 🌱" com emoji no lugar da marca.

A boa notícia: a base de design é sólida (uma paleta e tipografia centralizadas, um arquivo único de onde tudo sai — isso é raro de ver em apps nesse estágio, e é exatamente a fundação que precisa para virar um produto com cara de "profissional pago"). O que falta não é reconstruir — é **decidir uma identidade visual e aplicá-la de forma consistente**, mais fechar lacunas pontuais de acabamento (modo escuro pela metade, botão de "Continuar com Google" com um "G" digitado como texto em vez do ícone oficial, e quase nenhum botão preparado para leitor de tela).

---

## 2. Achados CRÍTICOS (quebram confiança nos primeiros segundos)

### C1 — O ícone do Android publicado é o template de exemplo do Expo, não uma arte final

**Evidência:** abri `assets/images/android-icon-background.png` (512×512) — é literalmente o **guia de referência de zona segura** que o gerador de ícones adaptativos do Android usa como modelo: círculos e linhas tracejadas em azul claro sobre fundo azul clarinho, exatamente como aparece na documentação oficial do Android para "onde não colocar elementos importantes do ícone". Isso nunca deveria ir para produção — é um artefato de rascunho, não uma arte.

**Consequência:** qualquer usuário Android que instale o app vê, na tela inicial do celular, um ícone com linhas de grade e círculos técnicos em vez de uma marca. Isso é o tipo de detalhe que mais rápido comunica "app amador" — antes mesmo de abrir o app.

**Correção:** desenhar (ou adaptar do monograma existente) um par foreground/background reais para o ícone adaptativo do Android, seguindo as [especificações oficiais](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive) (zona segura de 66dp num canvas de 108dp).

### C2 — Duas marcas diferentes para o mesmo app, uma por plataforma

**Evidência:** o iOS usa `icon.png`/`splash-icon.png` — o monograma "L + folha" em gradiente roxo-azul. Já `android-icon-foreground.png` (512×512) é uma figura **completamente diferente**: um chevron/seta azul sólido, sem relação nenhuma com o monograma, sem folha, sem gradiente roxo. Não há como ambos serem a mesma decisão de marca — um dos dois é um placeholder esquecido.

**Consequência:** um usuário que veja o app no Android e depois no iPhone de um amigo (ou em qualquer material de marketing feito a partir do ícone iOS) não reconhece que é o mesmo produto.

**Correção:** escolher o monograma "L + folha" como a marca oficial (é o mais trabalhado dos dois e já usado no material de marca) e gerar os assets do Android a partir dele.

### C3 — Splash sem transparência: o "quadrado roxo recortado" que você notou

**Evidência confirmada visualmente:** `splash-icon.png` é o monograma com **fundo roxo sólido preenchendo todo o quadrado 1024×1024** (um roxo mais apagado, RGB próximo de `#6650A1`, diferente do roxo oficial da marca `colors.primary = #6D28D9`). O `app.json` configura a splash com fundo branco (`#ffffff`, claro) ou preto (`#000000`, escuro) e mostra essa imagem com `imageWidth: 200`. Resultado exatamente como você descreveu: um quadrado roxo "colado" boiando sobre uma tela branca ou preta, sem se fundir com nada.

**Correção:** gerar uma versão do monograma em **PNG com fundo transparente** (só o "L" e a folha, sem o quadrado roxo por trás). Com transparência, o `resizeMode: "contain"` da splash funciona como deveria — o monograma aparece sozinho, centralizado, sobre o `backgroundColor` configurado. Sugestão adicional: trocar o `backgroundColor` de branco/preto genéricos para o roxo oficial da marca (`#6D28D9`) — a splash vira uma extensão da marca, não uma tela neutra com um logo em cima.

---

## 3. Achados ALTOS

### H1 — Modo escuro declarado, mas não implementado (mencionado no seu pedido, confirmado)

**Evidência:** `app.json` diz `userInterfaceStyle: "automatic"` e a splash tem variante escura (`dark: { backgroundColor: "#000000" }`), mas `theme/index.ts` só define uma paleta (clara) e `useColorScheme` não é usado em nenhuma tela — busquei no código e não há nenhuma ocorrência. `_layout.tsx` fixa `<StatusBar style="dark" />` (ícones escuros) para sempre.

**Consequência:** um usuário com o celular em modo escuro vê a splash preta (correta) e, na sequência, a tela do app pula abruptamente para um fundo claro — uma transição visualmente quebrada logo na abertura.

**Recomendação (decisão, não meio-termo):** dado o estágio do produto, **não recomendo construir o modo escuro agora** — fazer bem feito exige uma segunda paleta inteira com contraste validado em cada tela, e fazer pela metade é pior que não ter. A correção certa e rápida é **assumir modo claro de propósito**: mudar `userInterfaceStyle` para `"light"` no `app.json`, remover a variante `dark` da configuração da splash, e manter a splash e o app sempre no mesmo fundo. Isso resolve a inconsistência sem prometer uma feature que ainda não existe. Modo escuro de verdade fica como candidato de v2 (o mesmo horizonte da identidade visual em escala, já mencionado no posicionamento de marca).

### H2 — A marca real nunca aparece dentro do app

**Evidência:** o monograma (a mesma imagem do ícone/splash) não é usado em nenhuma tela. Em `login.tsx`, o "logo" é um círculo com gradiente e o ícone genérico `Ionicons name="leaf"` — qualquer app poderia ter esse mesmo círculo. Na home (`(tabs)/index.tsx:177`), o cabeçalho é o texto `"Lingrow 🌱"` — nome + emoji, não a marca desenhada.

**Consequência:** o app investiu num monograma com identidade própria e não colhe esse investimento em nenhum momento em que o usuário está de fato usando o produto — só no ícone e na tela de abertura, que somem em menos de 2 segundos.

**Correção:** usar o monograma real (como imagem/SVG, não como ícone de biblioteca) pelo menos na tela de login e no cabeçalho da home, no lugar do círculo genérico e do emoji. É uma trocar de asset, não uma reconstrução de tela.

### H3 — Botão "Continuar com Google" com letra digitada em vez do ícone oficial

**Evidência:** `login.tsx:143-145` — `<Text>G  Continuar com Google</Text>`. É a letra "G" do teclado, não o ícone colorido oficial do Google. Ao lado, o botão da Apple (`AppleAuthenticationButton`) é o componente nativo oficial, correto e polido — a diferença de acabamento entre os dois botões, um ao lado do outro, é visível.

**Correção:** usar o ícone oficial do Google (existem pacotes leves e gratuitos, ou um simples PNG/SVG do "G" colorido) — é uma troca pontual, o mesmo peso de esforço da splash.

### H4 — Acessibilidade praticamente ausente

**Evidência:** busquei por `accessibilityLabel`/`hitSlop` em todas as telas — **apenas 2 ocorrências em todo o app**, ambas em `ai-create.tsx` (os ícones de editar/excluir um rascunho de card). Todos os outros botões só de ícone — voltar, tocar para virar o card, reiniciar sessão, abrir/fechar modais, os botões de resposta do SRS — não têm `accessibilityLabel` (leitor de tela não sabe o que o botão faz) nem área de toque ampliada consistente.

**Consequência:** para usuários que dependem de leitor de tela, partes centrais do app (a própria tela de estudo!) são difíceis ou impossíveis de operar. Isso também é um sinal de qualidade que revisores de loja e usuários mais exigentes notam.

**Correção:** adicionar `accessibilityLabel` nos botões só de ícone das telas mais usadas primeiro (estudo, home, navegação) — baixo esforço por tela, mas o volume é grande; vale um passe dedicado.

---

## 4. Achados MÉDIOS

### M1 — Três modais competindo pela atenção no primeiro uso da home
`(tabs)/index.tsx` pode abrir, na mesma sessão, o modal de boas-vindas do beta, o modal de meta diária e (se o usuário tocar em "Novo Deck") o modal de criação — três camadas de overlay possíveis sem uma coreografia pensada entre elas. Recomendo desenhar a sequência do primeiro acesso como um fluxo único e guiado, não telas isoladas que por acaso podem se sobrepor.

### M2 — Home com muita coisa de uma vez, e uma redundância visual
A home empilha, em sequência: cabeçalho, card de streak OU CTA de estudo, card do "programa 1000 frases" (que repete a mesma chamada "Estudar agora" do CTA logo acima), grade de estatísticas, card de revisão, e a lista de decks. O card do programa duplica a informação do CTA principal — dois blocos grandes convidando para a mesma ação, um em cima do outro. Recomendo fundir os dois num único bloco hero, deixando estatísticas e decks como seções secundárias, mais compactas.

### M3 — Dependência total de ícones genéricos, zero ilustração própria
Onboarding, login, home, revisar e config usam exclusivamente `Ionicons` dentro de círculos coloridos — não há nenhuma ilustração customizada em lugar nenhum do app. Isoladamente cada tela está limpa, mas o conjunto lê como "template de UI kit", que é provavelmente a origem da sua dúvida sobre o app estar "profissional o bastante". Não é urgente, mas é o tipo de investimento que separa "bem feito" de "memorável" — 2-3 ilustrações simples (onboarding e talvez o estado vazio de "tudo em dia") já mudam a percepção.

---

## 5. Achados BAIXOS

| # | Achado | Onde |
|---|--------|------|
| L1 | Botão de reiniciar sessão de estudo (ícone ↻) age sem confirmação — reinicia cards já respondidos com um toque acidental | `study/[deckId].tsx:213` |
| L2 | Onboarding tem só texto + ícone, sem prova social nem diferencial competitivo explícito nos slides | `onboarding.tsx` |
| L3 | Rótulos de tempo do SRS são fixos no texto ("Fácil → 4 dias") mesmo quando o intervalo real calculado é outro | `study/[deckId].tsx:301-325` (também no relatório técnico, ângulo UX: informação errada exibida ao usuário) |

---

## 6. Dark Mode — Recomendação Final

**Forçar modo claro em todo o sistema, de propósito, agora.** Construir um modo escuro de verdade exige uma segunda paleta com contraste validado tela por tela — fazer isso pela metade (como está hoje: splash escura + app sempre claro) é pior que não ter a feature. Ações concretas:
1. `app.json`: trocar `"userInterfaceStyle": "automatic"` por `"light"`.
2. Remover o bloco `dark: { backgroundColor: "#000000" }` da config da splash.
3. Manter `<StatusBar style="dark" />` como está — já é consistente com essa decisão.

Modo escuro de verdade é um bom candidato para quando a identidade visual em escala for revisitada (mesmo horizonte já mencionado no posicionamento de marca).

---

## 7. Direção de Identidade Visual — Como usar o monograma de forma consistente

1. **Escolher oficialmente** o monograma "L + folha" (gradiente roxo-azul) como a marca única do app — hoje ele já é o melhor ativo visual que existe e está sendo desperdiçado.
2. **Ícone do app:** regenerar o par foreground/background do Android a partir do monograma (resolve C1 e C2 juntos).
3. **Splash:** versão transparente do monograma, fundo `#6D28D9` (roxo oficial da marca) em vez de branco/preto — a abertura do app vira uma respiração de marca, não uma tela neutra (resolve C3).
4. **Dentro do app:** substituir o círculo genérico com `Ionicons name="leaf"` (login) e o texto `"Lingrow 🌱"` (home) por uma versão pequena do monograma real — mesma imagem, contextos diferentes, marca reconhecível do primeiro ao último segundo de uso.
5. **Manter** os ícones Ionicons para ações funcionais (voltar, configurações, revisar) — o problema não é usar biblioteca de ícones para funcionalidade, é não ter marca própria nos pontos de identidade (logo, splash, onboarding).

---

## 8. Top 5 Quick Wins (alto impacto de percepção, baixo esforço)

1. **Substituir o ícone Android** — hoje é o template de exemplo do Expo publicado em produção; é o achado mais grave e mais rápido de entender por que precisa mudar (C1).
2. **Gerar a splash com PNG transparente** do monograma sobre fundo roxo de marca — resolve exatamente o "não conversa com o fundo, fica recortada" que você notou (C3).
3. **Trocar o "G" de texto pelo ícone oficial do Google** no botão de login — 1 asset, remove a diferença de acabamento ao lado do botão da Apple (H3).
4. **Forçar modo claro de propósito** (3 linhas de config, seção 6) — elimina o flash branco/preto na abertura sem exigir construir dark mode inteiro (H1).
5. **Fundir o card do "programa 1000 frases" com o CTA principal da home** — remove a redundância visual mais óbvia da tela mais vista do app (M2).

---

## 9. Nota de verificação (Artigo IV — No Invention)

Os achados C1, C2 e C3 foram confirmados por **inspeção visual direta dos arquivos de imagem** (não inferência de código) — abri `android-icon-background.png`, `android-icon-foreground.png` e `splash-icon.png` e descrevi o que está neles. H1 e H4 foram confirmados por busca no código (`useColorScheme`, `accessibilityLabel`/`hitSlop`) com contagem exata de ocorrências. Nenhuma correção foi aplicada nesta auditoria — o documento é somente diagnóstico, pronto para virar tarefas de `@dev` (implementação) e, para os assets de marca (ícone Android, splash, monograma in-app), possivelmente um passe de design visual antes da implementação.

— Uma, desenhando com empatia 💝
