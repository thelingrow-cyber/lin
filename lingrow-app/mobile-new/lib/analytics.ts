import PostHog from 'posthog-react-native';

export const posthog = new PostHog('phc_sjzNkQL39m6eEqws9HnyiAPc5QcoLwYjvMnhChwcKF6r', {
  host: 'https://us.i.posthog.com',
});

export const Analytics = {
  // Onboarding
  onboardingCompleted: () =>
    posthog.capture('onboarding_completed'),

  // Sessão geral
  sessionStarted: () =>
    posthog.capture('session_started'),

  // Revisão de cards
  reviewSessionStarted: (deckId: string, deckName: string, totalCards: number) =>
    posthog.capture('review_session_started', { deck_id: deckId, deck_name: deckName, total_cards: totalCards }),

  cardReviewed: (deckId: string, answer: string, cardIndex: number) =>
    posthog.capture('card_reviewed', { deck_id: deckId, answer, card_index: cardIndex }),

  reviewSessionCompleted: (deckId: string, deckName: string, totalCards: number) =>
    posthog.capture('review_session_completed', { deck_id: deckId, deck_name: deckName, total_cards: totalCards }),

  reviewSessionAbandoned: (deckId: string, cardIndex: number, totalCards: number) =>
    posthog.capture('review_session_abandoned', { deck_id: deckId, card_index: cardIndex, total_cards: totalCards }),

  // Deck
  deckCreated: (deckName: string) =>
    posthog.capture('deck_created', { deck_name: deckName }),
};
