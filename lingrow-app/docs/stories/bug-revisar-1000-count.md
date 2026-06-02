# Bug Story — Inconsistência na contagem de revisão (deck 1000) e banner da home

| Campo | Valor |
|-------|-------|
| Tipo | Bug |
| Status | InReview (QA PASS) |
| Prioridade | Alta (visível na home, dia 1 do beta) |
| Autor | Orion (aiox-master) |
| Data | 2026-06-02 |

---

## Contexto

Reportado pelo fundador durante teste do beta: ao entrar, responder os cards como "Difícil" e voltar à home, a home mostra **"10 Para Revisar"** ao mesmo tempo que o banner verde **"Você está em dia hoje! Volte amanhã"**. Ao clicar em "Para Revisar", a aba Revisar mostra **"Tudo em dia!"** (tela vazia).

## Causa raiz

1. **Aba Revisar ignora o deck built-in (1000 frases).** `revisar.tsx` itera apenas sobre `getDecks()` (decks customizados do banco). O `DECK_1000` é um deck fixo no código e nunca entra nessa lista — então seus cards vencidos nunca são contados na aba, enquanto a home conta todo o progresso vencido. Daí o "10" na home virar "0" na Revisar.
2. **Banner da home usa lógica incoerente.** O banner verde "em dia" aparece com base em `isToday` (estudou hoje?), ignorando se há cards vencidos. Como "Difícil" reagenda card novo para +10 min (`interval = 0`), os cards voltam a vencer no mesmo dia → contradição com "volte amanhã".

## Critérios de aceite

- [x] AC1: A aba Revisar exibe o deck "1000 Frases Essenciais" com sua contagem de cards vencidos, ao lado dos decks criados pelo usuário.
- [x] AC2: O total da home ("Para Revisar") é igual à soma das contagens por deck na aba Revisar (1000 + decks custom).
- [x] AC3: Clicar em "Para Revisar" leva o usuário a uma tela com os cards corretos (não tela vazia).
- [x] AC4: O banner "Você está em dia / Volte amanhã" só aparece quando NÃO há cards vencidos (`reviewCount === 0`). Havendo cards vencidos, o banner chama para estudar.
- [x] AC5: A % de progresso da home continua contando **apenas** o programa das 1000 frases (não mistura decks custom).
- [x] AC6: Sem double-count — a contagem de cada deck é isolada por card (1000 não soma nos decks custom e vice-versa).

## File List

- `lingrow-app/mobile-new/app/(tabs)/revisar.tsx` — incluir DECK_1000 na lista e na renderização
- `lingrow-app/mobile-new/app/(tabs)/index.tsx` — corrigir condição do banner

## Tasks

- [x] @dev: incluir o deck built-in na contagem e listagem da aba Revisar
- [x] @dev: ajustar a condição do banner da home (`isToday && reviewCount === 0`)
- [x] @qa: validar AC1–AC6 (PASS)
- [ ] @devops: commit/push
