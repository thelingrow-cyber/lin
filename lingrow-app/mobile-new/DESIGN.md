# Lingrow — Design System

> Documento-fonte do visual do app. Funciona como **system prompt**: sempre que
> for criar ou alterar uma tela (você ou uma IA), siga estas regras. Toda tela
> nova deve nascer consistente com as existentes.
>
> Implementação dos tokens: [`theme/index.ts`](./theme/index.ts).

---

## 1. Princípios

1. **Fonte única da verdade.** Nenhuma tela declara cor em hex solto. Importe de
   `@/theme` e use os tokens (`colors.primary`, `colors.text`, etc.). Quer mudar
   a identidade do app inteiro? Mude só o `theme/index.ts`.
2. **Utilidade antes do enfeite.** O design existe para o usuário entender e usar
   rápido. Bonito vem depois de funcional.
3. **Neutros quentes, nunca cinza frio.** O segredo para não ter "cara de IA": os
   cinzas têm um leve calor (família *stone*), não o cinza azulado (*gray*) que
   toda ferramenta gera por padrão.
4. **Consistência > novidade.** Repetir o mesmo botão, o mesmo card, o mesmo
   espaçamento é o que faz parecer profissional.

---

## 2. Cores (tokens)

### Marca — roxo refinado
| Token | Hex | Uso |
|-------|-----|-----|
| `primary` | `#6D28D9` | Cor da marca: botões principais, títulos, destaques |
| `primaryDark` | `#5B21B6` | Estado pressionado / variação escura |
| `primaryLight` | `#8B5CF6` | Destaque mais leve |
| `primarySoft` | `#F3F0FF` | Fundo de badge, item selecionado, realce suave |

### Apoio
| Token | Hex | Uso |
|-------|-----|-----|
| `accent` / `accentSoft` | `#F59E0B` / `#FEF3C7` | Âmbar: streak, "fácil", energia |
| `success` / `successSoft` | `#16A34A` / `#DCFCE7` | Acerto, "bom", confirmação |
| `successDark` | `#14532D` | Texto sobre fundo verde claro |
| `danger` / `dangerSoft` | `#DC2626` / `#FEE2E2` | Erro, "novamente", excluir |
| `info` / `infoSoft` | `#2563EB` / `#DBEAFE` | Inglês (EN), informações |

### Neutros quentes (o antídoto da "cara de IA")
| Token | Hex | Uso |
|-------|-----|-----|
| `text` | `#1C1917` | Títulos e texto principal |
| `textMuted` | `#78716C` | Texto secundário, legendas |
| `textFaint` | `#A8A29E` | Placeholders, texto fraco |
| `border` | `#E7E5E4` | Bordas de inputs e cards |
| `borderSoft` | `#F1EFEE` | Divisórias bem sutis |

### Superfícies
| Token | Hex | Uso |
|-------|-----|-----|
| `bg` | `#FAF9F7` | Fundo de tela (off-white quente) |
| `surface` | `#FFFFFF` | Cards e texto sobre roxo |
| `onPrimary` | `#FFFFFF` | Texto/ícone sobre a cor da marca |

> **Regra de ouro:** fundo de tela = `bg` (off-white quente); cards = `surface`
> (branco). O leve contraste entre os dois é o que dá sensação premium.

---

## 3. Tipografia

Tamanhos em `font` (`theme/index.ts`): `display 30 · title 22 · heading 18 ·
body 15 · small 13 · tiny 11`. Pesos: `bold '800' · semibold '700' · medium '600'`.

Regras vindas de UX (importantes num app que é leitura o tempo todo):
- **Texto de leitura nunca muito largo** — cansa o olho. Em cards, mantenha
  margens generosas.
- **Hierarquia clara:** título forte (`display`/`title` + `bold`), corpo calmo
  (`body` + peso normal), legenda discreta (`small` + `textMuted`).
- **Fonte de marca: Plus Jakarta Sans** (carregada no `app/_layout.tsx`). Com
  fonte customizada o RN não sintetiza peso — use sempre `fontFamily: fonts.*`
  (`regular/medium/semibold/bold/extrabold`), nunca `fontWeight`.
- **Ícones: Ionicons** (`@expo/vector-icons`), nunca emoji como ilustração.
  Emojis só dentro de texto corrido, como acento (ex.: "Olá 👋").

---

## 4. Forma e profundidade

- **Raios** (`radius`): `sm 10 · md 14 · lg 20 · pill 50`. Botões e inputs `md`;
  cards `lg`; botões-pílula `pill`.
- **Sombra** (`shadow.card` / `shadow.soft`): suave e difusa, com tom quente
  (`#1C1917`), nunca o "preto duro". Card flutua de leve sobre o fundo.
- **Espaçamento** (`spacing`): `xs 4 · sm 8 · md 12 · lg 16 · xl 24`.

---

## 5. Acessibilidade (não-negociável)

- **Contraste:** texto principal sempre `text` sobre `surface`/`bg` (alto
  contraste). Nunca `textFaint` para conteúdo importante.
- **Animações:** evitar piscadas rápidas/agressivas (risco para pessoas
  epilépticas). Transições suaves, como o flip do card.
- **Toque:** alvos de no mínimo ~44px (botões já seguem isso).

---

## 6. Como usar (na prática)

```tsx
import { colors, radius, spacing, font } from '@/theme';

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  title: { fontSize: font.title, fontWeight: font.bold, color: colors.text },
  hint:  { fontSize: font.small, color: colors.textMuted },
});
```

**Ao criar uma tela nova:** comece copiando a estrutura de uma tela parecida que
já existe, troque só o conteúdo, e nunca escreva um hex direto — sempre `colors.*`.
