import PostHog from 'posthog-react-native';

export const posthog = new PostHog('phc_sjzNkQL39m6eEqws9HnyiAPc5QcoLwYjvMnhChwcKF6r', {
  host: 'https://us.i.posthog.com',
});

/** Versão do fluxo de onboarding — vai em TODOS os eventos do funil (FR-A5) para coortes/A-B. */
export const ONBOARDING_VERSION = 'v2';

export const Analytics = {
  // Onboarding (funil FR-A5 — E2.2/E2.4)
  onboardingStarted: () =>
    posthog.capture('onboarding_started', { onboarding_version: ONBOARDING_VERSION }),

  onboardingStepCompleted: (step: number, choice: string) =>
    posthog.capture('onboarding_step_completed', { step, choice, onboarding_version: ONBOARDING_VERSION }),

  /**
   * Telas SEM pergunta do onboarding (ponte e interstício do método — padrão
   * Prequel). São fricção deliberada: se derrubarem gente, o funil mostra e elas saem.
   */
  onboardingInterstitialContinue: (screen: 'bridge' | 'method') =>
    posthog.capture('onboarding_interstitial_continue', { screen, onboarding_version: ONBOARDING_VERSION }),

  onboardingCompleted: (goal?: string | null, level?: string | null, dailyGoal?: number) => {
    const props: Record<string, string | number> = { onboarding_version: ONBOARDING_VERSION };
    if (goal) props.goal = goal;
    if (level) props.level = level;
    if (dailyGoal !== undefined) props.daily_goal = dailyGoal;
    posthog.capture('onboarding_completed', props);
  },

  // Plan reveal (E6.1 / FR-F1)
  planRevealViewed: (goal: string, level: string, dailyGoal: number) =>
    posthog.capture('plan_reveal_viewed', { goal, level, daily_goal: dailyGoal, onboarding_version: ONBOARDING_VERSION }),

  planRevealSkippedAnimation: () =>
    posthog.capture('plan_reveal_skipped_animation', { onboarding_version: ONBOARDING_VERSION }),

  planRevealContinue: (goal: string, level: string, dailyGoal: number) =>
    posthog.capture('plan_reveal_continue', { goal, level, daily_goal: dailyGoal, onboarding_version: ONBOARDING_VERSION }),

  // Primeira sessão + tela-semente (E2.3 / FR-A2, FR-A3)
  firstSessionStarted: (totalCards: number) =>
    posthog.capture('first_session_started', { total_cards: totalCards, onboarding_version: ONBOARDING_VERSION }),

  firstSessionCompleted: (totalCards: number) =>
    posthog.capture('first_session_completed', { total_cards: totalCards, onboarding_version: ONBOARDING_VERSION }),

  seedScreenViewed: (owned: number) =>
    posthog.capture('seed_screen_viewed', { owned, onboarding_version: ONBOARDING_VERSION }),

  notificationPermissionResult: (granted: boolean) =>
    posthog.capture('notification_permission_result', { granted, onboarding_version: ONBOARDING_VERSION }),

  // Paywall (E2.4 / FR-A4, FR-A5). `context` distingue de onde o paywall veio —
  // E6.2 amplia isso para `source` em TODAS as portas.
  paywallViewed: (context: string) =>
    posthog.capture('paywall_viewed', { context, onboarding_version: ONBOARDING_VERSION }),

  trialStarted: (context: string, plan: 'monthly' | 'annual') =>
    posthog.capture('trial_started', { context, plan, onboarding_version: ONBOARDING_VERSION }),

  paywallDismissed: (context: string) =>
    posthog.capture('paywall_dismissed', { context, onboarding_version: ONBOARDING_VERSION }),

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
