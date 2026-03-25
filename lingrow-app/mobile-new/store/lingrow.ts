import { supabase } from '@/lib/supabase';

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  keyword?: string;
  keywordPt?: string;
  notes?: string;
  audioUrl?: string;
  position: number;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  color: string;
  isBuiltIn?: boolean;
}

export interface CardProgress {
  cardId: string;
  userId: string;
  repetitions: number;
  easeFactor: number;
  interval: number;
  lastReview: string | null;
  nextReview: string | null;
  consecutiveAgain: number;
  consecutiveEasy: number;
}

export interface UserSettings {
  onboardingDone: boolean;
  dailyGoal: number;
  streak: number;
  lastStudyDate: string | null;
  autoPlay: boolean;
  voiceVariant: string;
  playbackSpeed: number;
}

const DEFAULT_SETTINGS: UserSettings = {
  onboardingDone: false,
  dailyGoal: 5,
  streak: 0,
  lastStudyDate: null,
  autoPlay: false,
  voiceVariant: 'en-US',
  playbackSpeed: 1.0,
};

async function getUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error('Usuário não autenticado');
  return session.user.id;
}

// ─── settings ────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<UserSettings> {
  try {
    const userId = await getUserId();
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!data) return { ...DEFAULT_SETTINGS, onboardingDone: false };

    return {
      onboardingDone: data.onboarding_done ?? false,
      dailyGoal: data.daily_goal,
      streak: data.streak ?? 0,
      lastStudyDate: data.last_study_date ?? null,
      autoPlay: data.auto_play_audio,
      voiceVariant: data.voice_variant,
      playbackSpeed: data.playback_speed,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<UserSettings>): Promise<void> {
  const userId = await getUserId();
  const current = await getSettings();
  const merged = { ...current, ...settings };

  await supabase.from('user_settings').upsert({
    user_id: userId,
    onboarding_done: merged.onboardingDone,
    daily_goal: merged.dailyGoal,
    streak: merged.streak,
    last_study_date: merged.lastStudyDate,
    auto_play_audio: merged.autoPlay,
    voice_variant: merged.voiceVariant,
    playback_speed: merged.playbackSpeed,
  }, { onConflict: 'user_id' });
}

// ─── decks ───────────────────────────────────────────────────────────────────

export async function getDecks(): Promise<Deck[]> {
  try {
    const userId = await getUserId();
    const { data } = await supabase
      .from('decks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at');

    return (data ?? []).map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description ?? '',
      color: d.color ?? '#7C3AED',
      isBuiltIn: d.is_built_in ?? false,
    }));
  } catch {
    return [];
  }
}

export async function saveDeck(deck: Deck): Promise<void> {
  const userId = await getUserId();
  await supabase.from('decks').upsert({
    id: deck.id,
    user_id: userId,
    name: deck.name,
    description: deck.description,
    color: deck.color,
    is_built_in: deck.isBuiltIn ?? false,
  }, { onConflict: 'id' });
}

// ─── cards ───────────────────────────────────────────────────────────────────

export async function getCards(deckId?: string): Promise<Card[]> {
  try {
    let query = supabase.from('cards').select('*').order('position');
    if (deckId) query = query.eq('deck_id', deckId);

    const { data } = await query;
    return (data ?? []).map((c) => ({
      id: c.id,
      deckId: c.deck_id,
      front: c.front_text,
      back: c.back_text,
      keyword: c.keyword ?? undefined,
      keywordPt: c.keyword_pt ?? undefined,
      notes: c.notes ?? undefined,
      audioUrl: c.audio_url ?? undefined,
      position: c.position,
    }));
  } catch {
    return [];
  }
}

export async function saveCard(card: Card): Promise<void> {
  await supabase.from('cards').upsert({
    id: card.id,
    deck_id: card.deckId,
    front_text: card.front,
    back_text: card.back,
    keyword: card.keyword ?? null,
    keyword_pt: card.keywordPt ?? null,
    notes: card.notes ?? null,
    audio_url: card.audioUrl ?? null,
    position: card.position,
  }, { onConflict: 'id' });
}

export async function saveCards(cards: Card[]): Promise<void> {
  const rows = cards.map((card) => ({
    id: card.id,
    deck_id: card.deckId,
    front_text: card.front,
    back_text: card.back,
    keyword: card.keyword ?? null,
    keyword_pt: card.keywordPt ?? null,
    notes: card.notes ?? null,
    audio_url: card.audioUrl ?? null,
    position: card.position,
  }));
  // inserir em lotes de 100
  for (let i = 0; i < rows.length; i += 100) {
    await supabase.from('cards').upsert(rows.slice(i, i + 100), { onConflict: 'id' });
  }
}

// ─── progress ────────────────────────────────────────────────────────────────

export async function getAllProgress(): Promise<CardProgress[]> {
  try {
    const userId = await getUserId();
    const { data } = await supabase
      .from('card_progress')
      .select('*')
      .eq('user_id', userId);

    return (data ?? []).map((p) => ({
      cardId: p.card_id,
      userId: p.user_id,
      repetitions: p.repetitions,
      easeFactor: parseFloat(p.ease_factor),
      interval: p.interval_days,
      lastReview: p.last_review,
      nextReview: p.next_review,
      consecutiveAgain: p.consecutive_again,
      consecutiveEasy: p.consecutive_easy,
    }));
  } catch {
    return [];
  }
}

export async function getProgress(cardId: string): Promise<CardProgress> {
  try {
    const userId = await getUserId();
    const { data } = await supabase
      .from('card_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('card_id', cardId)
      .single();

    if (!data) throw new Error('not found');

    return {
      cardId: data.card_id,
      userId: data.user_id,
      repetitions: data.repetitions,
      easeFactor: parseFloat(data.ease_factor),
      interval: data.interval_days,
      lastReview: data.last_review,
      nextReview: data.next_review,
      consecutiveAgain: data.consecutive_again,
      consecutiveEasy: data.consecutive_easy,
    };
  } catch {
    return {
      cardId,
      userId: '',
      repetitions: 0,
      easeFactor: 2.5,
      interval: 1,
      lastReview: null,
      nextReview: null,
      consecutiveAgain: 0,
      consecutiveEasy: 0,
    };
  }
}

export async function saveProgress(progress: CardProgress): Promise<void> {
  const userId = await getUserId();
  await supabase.from('card_progress').upsert({
    user_id: userId,
    card_id: progress.cardId,
    repetitions: progress.repetitions,
    ease_factor: progress.easeFactor,
    interval_days: progress.interval,
    last_review: progress.lastReview,
    next_review: progress.nextReview,
    consecutive_again: progress.consecutiveAgain,
    consecutive_easy: progress.consecutiveEasy,
  }, { onConflict: 'user_id,card_id' });
}

// ─── SRS algorithm ───────────────────────────────────────────────────────────

export type SRSAnswer = 'again' | 'hard' | 'good' | 'easy';

export function computeNextReview(
  progress: CardProgress,
  answer: SRSAnswer
): CardProgress {
  let { repetitions, easeFactor, interval, consecutiveAgain, consecutiveEasy } = progress;

  switch (answer) {
    case 'again':
      consecutiveAgain += 1;
      consecutiveEasy = 0;
      repetitions = 0;
      interval = 0;
      easeFactor = consecutiveAgain >= 2
        ? Math.max(1.3, easeFactor - 0.4)
        : Math.max(1.3, easeFactor - 0.2);
      break;
    case 'hard':
      consecutiveAgain = 0;
      repetitions += 1;
      interval = progress.repetitions === 0 ? 0 : Math.max(1, Math.round(Math.max(1, interval) * 1.2));
      easeFactor = Math.max(1.3, easeFactor - 0.05);
      consecutiveEasy = 0;
      break;
    case 'good':
      consecutiveAgain = 0;
      consecutiveEasy = 0;
      repetitions += 1;
      interval = Math.max(1, Math.round(interval * easeFactor));
      break;
    case 'easy':
      consecutiveAgain = 0;
      consecutiveEasy += 1;
      repetitions += 1;
      const easyMultiplier = consecutiveEasy >= 3 ? 1.8 : 1.3;
      interval = Math.max(1, Math.round(interval * easeFactor * easyMultiplier));
      easeFactor = Math.min(4.0, easeFactor + 0.1);
      break;
  }

  const nextReview = new Date();
  if (interval === 0) {
    const minutes = answer === 'again' ? 1 : 10;
    nextReview.setMinutes(nextReview.getMinutes() + minutes);
  } else {
    nextReview.setDate(nextReview.getDate() + interval);
  }

  return {
    ...progress,
    repetitions,
    easeFactor,
    interval,
    consecutiveAgain,
    consecutiveEasy,
    lastReview: new Date().toISOString(),
    nextReview: nextReview.toISOString(),
  };
}

export function getIntervalLabel(answer: SRSAnswer, progress: CardProgress): string {
  const next = computeNextReview(progress, answer);
  if (next.interval < 1) return '< 1 min';
  if (next.interval === 1) return '1 dia';
  if (next.interval < 7) return `${next.interval} dias`;
  if (next.interval < 30) return `${Math.round(next.interval / 7)} sem`;
  return `${Math.round(next.interval / 30)} mês`;
}

// ─── study session ────────────────────────────────────────────────────────────

export async function getStudySession(deckId: string): Promise<Card[]> {
  const settings = await getSettings();
  const cards = await getCards(deckId);
  const allProgress = await getAllProgress();
  const now = new Date();

  const MAX_REVIEWS_PER_DAY = 20;

  const toReview = cards
    .filter((c) => {
      const p = allProgress.find((p) => p.cardId === c.id);
      if (!p || !p.nextReview) return false;
      return new Date(p.nextReview) <= now;
    })
    .sort((a, b) => {
      const pa = allProgress.find((p) => p.cardId === a.id);
      const pb = allProgress.find((p) => p.cardId === b.id);
      return new Date(pa!.nextReview!).getTime() - new Date(pb!.nextReview!).getTime();
    })
    .slice(0, MAX_REVIEWS_PER_DAY);

  const isBuiltIn = deckId === 'deck-1000-frases';
  const studied = new Set(allProgress.map((p) => p.cardId));
  const newCards = cards
    .filter((c) => !studied.has(c.id))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .slice(0, isBuiltIn ? settings.dailyGoal : undefined);

  return [...toReview, ...newCards];
}

// ─── streak ───────────────────────────────────────────────────────────────────

export async function updateStreak(): Promise<number> {
  const settings = await getSettings();
  const today = new Date().toDateString();
  const last = settings.lastStudyDate;

  if (last === today) return settings.streak;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isConsecutive = last === yesterday.toDateString();

  const streak = isConsecutive ? settings.streak + 1 : 1;
  await saveSettings({ streak, lastStudyDate: today });
  return streak;
}
