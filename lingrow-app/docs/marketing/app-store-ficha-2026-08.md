# Lingrow — Ficha da App Store (pronta para colar)

| Campo | Valor |
|-------|-------|
| Data | 2026-08-12 |
| Substitui | a seção ASO de `launch-assets-ph-apple-aso.md` (19/07) e o `app-store-metadata.md` (abr/2026, **obsoleto**) |
| App | `id6761549876` · bundle `com.lingrow.flashcards` · v1.0 de 17/04/2026 |
| Base | `brand-positioning.md` v1.0 · restrições de linguagem de 07/08 |

> **O que mudou frente ao doc de 19/07.** Ele sugeria o subtítulo `Repetição espaçada, sem Anki` e uma descrição com travessões e "1000 frases". As três coisas estão fora agora: menção a Anki proibida, travessão zerado, e contagem de frases travada enquanto a decisão LG-12 estiver aberta. Também padronizei a marca no **feminino** (`a Lingrow`), como manda o `brand-positioning.md`; o doc de ASO usava o masculino.

---

## O estado atual da ficha (o que está errado hoje)

| Campo | Hoje | Custo |
|-------|------|-------|
| Subtítulo | **vazio** | 30 caracteres indexados jogados fora. É o segundo campo de maior peso no ranking |
| Título | só `Lingrow` | nome de marca desconhecida não é buscado por ninguém. Zero tráfego de busca |
| Descrição | abre pelo método ("repetição espaçada") | as 3 primeiras linhas são as únicas visíveis antes do "mais". Abrir pelo método fala com quem já entende SRS, não com quem tem a dor |
| Última atualização | 1.0, 17/04/2026 | recência pesa no ranking. Quase 4 meses parado |

---

## 1. Título — 24/30 caracteres

```
Lingrow: Aprender Inglês
```

**Por que este e não `Lingrow: Inglês que Não Some` (28/30, o hook da marca).** A ficha da loja é canal de **descoberta por busca**, não de reconhecimento de marca. Quem vem da bio do Instagram já clicou no link direto e vai baixar de qualquer jeito, o título não muda a decisão dele. Quem descobre por busca só chega até você se o título ranquear, e "aprender inglês" é a intenção de busca nº1 do público. O hook continua presente no texto promocional e no fecho da descrição, onde ele converte.

---

## 2. Subtítulo — 24/30 caracteres

```
Flashcards que não somem
```

Traz `flashcards` (a categoria do produto) para o índice, liberando esse espaço no campo de keywords, e ecoa a estrutura do hook da marca sem repetir a palavra "inglês", que já está no título.

**Alternativa mais orientada à dor:** `Fixe o que você estuda` (22/30). Perde a keyword de categoria, ganha em promessa.

---

## 3. Keywords — 97/100 caracteres

```
vocabulario,memorizar,fluencia,frases,revisao,estudar,idiomas,repeticao espacada,anki,falar
```

Regras aplicadas: sem espaço depois da vírgula (cada espaço é um caractere desperdiçado), sem acento (a Apple normaliza), e **sem repetir nada que já esteja no título ou no subtítulo** — a loja trata os três campos como um índice único, então repetir queima caracteres.

> ⚠️ **`anki` está na lista de propósito.** Esse campo é **invisível** ao usuário: ninguém lê, ele só captura quem procura "anki" na loja, que é exatamente o nosso público. A sua proibição de citar Anki vale para texto visível (legendas, artes, descrição), e ela está respeitada em todos os campos visíveis abaixo. Se você preferir tirar mesmo assim, troque por `curso`.

---

## 4. Texto promocional — 155/170 caracteres

> Editável a qualquer momento **sem submeter nova versão do app**. Use para campanha, sazonalidade, novidade.

```
Chega de streak que não vira fluência. A Lingrow te mostra cada frase no momento certo, antes de você esquecer. Comece em 30 segundos, sem configurar nada.
```

---

## 5. Descrição

> As **3 primeiras linhas** são as únicas visíveis antes do "mais". Elas abrem pela dor, não pelo método.

```
Você aprende inglês e esquece tudo? O problema nunca foi você.

A Lingrow é para quem já tentou e cansou de começar do zero. Ela usa
repetição espaçada para te mostrar cada frase no momento exato, antes
do seu cérebro esquecer. O resultado é simples: o que você aprende, fica.

Sem streak vazio. Sem configuração. Sem curso que você abandona na
terceira semana.

COMO FUNCIONA

• Frases essenciais em inglês já prontas, você começa em 30 segundos
• O app decide a hora certa de revisar cada frase, com base na ciência
  da memória
• Um plano montado a partir do seu objetivo e do seu nível
• Seu progresso acumula e fica visível, você sente que está construindo

POR QUE A LINGROW É DIFERENTE

• Repetição espaçada de verdade, não é jogo e não é streak
• Feita no Brasil, 100% em português, para o adulto brasileiro
• Interface limpa, sem distração: abre, estuda, fecha
• Crie também os seus próprios decks

Inglês que não some. Para quem não aceita mais voltar do zero.
Baixe e comece hoje.
```

**Restrições aplicadas:** zero travessão · zero menção a Anki · nenhuma contagem de frases (a linha diz "frases essenciais já prontas", verdadeira com 400 ou com 1000, então não precisa ser reescrita quando a LG-12 for decidida) · sem promessa de prazo · marca no feminino.

---

## Onde colar no App Store Connect

`Meus Apps → Lingrow → App Store → Informações da versão em português (Brasil)`

| Campo do ASC | Seção acima | Exige nova versão? |
|---|---|---|
| Nome | 1 | Sim |
| Subtítulo | 2 | Sim |
| Palavras-chave | 3 | Sim |
| Texto promocional | 4 | **Não**, muda na hora |
| Descrição | 5 | Sim |

Ou seja: o texto promocional você pode colar agora e já vale. Os outros quatro entram junto da próxima submissão, o que também resolve o problema de recência (app parado na 1.0 desde abril).

---

## O que continua faltando na ficha

1. **6 screenshots.** É o ativo de conversão nº1: cerca de 60% da decisão acontece no primeiro. O roteiro está em `launch-assets-ph-apple-aso.md` §3 e pode ser produzido com o mesmo pipeline `deck.html` → Chrome headless do lote 01 do Instagram.
2. **Avaliações: 3 (média 5,0).** Não usar como prova pública antes de ~20.
3. **Vídeo de preview do app.** Mesma peça que serve de Reel de demo para os influencers.
