import { supabase } from '@/lib/supabase';
import { SENTENCES, DECK_1000 } from '@/data/sentences';

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

let _builtinCards: Card[] | null = null;
function getBuiltinCards(): Card[] {
  if (!_builtinCards) {
    _builtinCards = SENTENCES.map((s) => ({
      id: `card-builtin-${s.position}`,
      deckId: DECK_1000.id,
      front: s.front,
      back: s.back,
      keyword: s.keyword,
      keywordPt: s.keywordPt,
      position: s.position,
    }));
  }
  return _builtinCards;
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
  /** Quando o card foi estudado pela 1ª vez (created_at da linha) — base do limite diário de cards novos. */
  createdAt?: string;
}

/** Objetivo declarado no onboarding (FR-A1a). NULL = usuário anterior ao onboarding v2. */
export type LearningGoal = 'work' | 'travel' | 'study' | 'abroad' | 'self';
/** Autoavaliação de nível no onboarding (FR-A1b). NULL = usuário anterior ao onboarding v2. */
export type LevelSelfReport = 'zero' | 'stuck' | 'fluency';

export interface UserSettings {
  onboardingDone: boolean;
  dailyGoal: number;
  streak: number;
  lastStudyDate: string | null;
  autoPlay: boolean;
  voiceVariant: string;
  playbackSpeed: number;
  goal: LearningGoal | null;
  levelSelfreport: LevelSelfReport | null;
  onboardingVersion: string | null;
}

const DEFAULT_SETTINGS: UserSettings = {
  onboardingDone: false,
  dailyGoal: 5,
  streak: 0,
  lastStudyDate: null,
  autoPlay: false,
  voiceVariant: 'en-US',
  playbackSpeed: 1.0,
  goal: null,
  levelSelfreport: null,
  onboardingVersion: null,
};

async function getUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error('Usuário não autenticado');
  return session.user.id;
}

// ─── settings ────────────────────────────────────────────────────────────────

/**
 * Lança em falha de rede/DB — só devolve defaults quando a linha genuinamente
 * não existe ainda (usuário novo, antes do onboarding criar o registro).
 * Distinguir isso é o que impede uma falha de rede de ser confundida com
 * "conta nova" e zerar streak/config de um usuário real (fix H1).
 */
export async function getSettings(overrideUserId?: string): Promise<UserSettings> {
  const userId = overrideUserId ?? await getUserId();
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { ...DEFAULT_SETTINGS, onboardingDone: false };

  return {
    onboardingDone: data.onboarding_done ?? false,
    dailyGoal: data.daily_goal,
    streak: data.streak ?? 0,
    lastStudyDate: data.last_study_date ?? null,
    autoPlay: data.auto_play_audio,
    voiceVariant: data.voice_variant,
    playbackSpeed: data.playback_speed,
    goal: data.goal ?? null,
    levelSelfreport: data.level_selfreport ?? null,
    onboardingVersion: data.onboarding_version ?? null,
  };
}

/**
 * Upsert PARCIAL — só grava as colunas presentes em `settings`. Colunas não
 * incluídas mantêm o valor atual no banco (linha existente) ou o default da
 * tabela (linha nova). Elimina o padrão ler-mesclar-escrever: uma falha de
 * rede na leitura não pode mais sobrescrever streak/config reais (fix H1).
 */
export async function saveSettings(settings: Partial<UserSettings>): Promise<void> {
  const userId = await getUserId();
  const patch: Record<string, unknown> = { id: userId, user_id: userId };

  if (settings.onboardingDone !== undefined) patch.onboarding_done = settings.onboardingDone;
  if (settings.dailyGoal !== undefined) patch.daily_goal = settings.dailyGoal;
  if (settings.streak !== undefined) patch.streak = settings.streak;
  if (settings.lastStudyDate !== undefined) patch.last_study_date = settings.lastStudyDate;
  if (settings.autoPlay !== undefined) patch.auto_play_audio = settings.autoPlay;
  if (settings.voiceVariant !== undefined) patch.voice_variant = settings.voiceVariant;
  if (settings.playbackSpeed !== undefined) patch.playback_speed = settings.playbackSpeed;
  if (settings.goal !== undefined) patch.goal = settings.goal;
  if (settings.levelSelfreport !== undefined) patch.level_selfreport = settings.levelSelfreport;
  if (settings.onboardingVersion !== undefined) patch.onboarding_version = settings.onboardingVersion;

  const { error } = await supabase.from('user_settings').upsert(patch, { onConflict: 'user_id' });
  if (error) throw error;
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
  const { error } = await supabase.from('decks').upsert({
    id: deck.id,
    user_id: userId,
    name: deck.name,
    description: deck.description,
    color: deck.color,
    is_built_in: deck.isBuiltIn ?? false,
  }, { onConflict: 'id' });
  if (error) throw error;
}

// ─── cards ───────────────────────────────────────────────────────────────────

export async function getCards(deckId?: string): Promise<Card[]> {
  try {
    let query = supabase.from('cards').select('*').order('position');
    if (deckId) query = query.eq('deck_id', deckId);

    const { data, error } = await query;
    if (error) throw error;
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
  const { error } = await supabase.from('cards').upsert({
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
  if (error) throw error;
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
  // inserir em lotes de 100 — falha de qualquer lote interrompe e propaga
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await supabase.from('cards').upsert(rows.slice(i, i + 100), { onConflict: 'id' });
    if (error) throw error;
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
      createdAt: p.created_at ?? undefined,
    }));
  } catch {
    return [];
  }
}

/**
 * Lança em falha de rede/DB — só devolve progresso zerado quando o card
 * genuinamente nunca foi estudado. Sem essa distinção, uma falha de rede no
 * meio de uma sessão fazia o app "esquecer" meses de agendamento SRS de um
 * card real e sobrescrever com o estado de card novo (fix H4).
 */
export async function getProgress(cardId: string): Promise<CardProgress> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('card_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('card_id', cardId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return {
      cardId,
      userId,
      repetitions: 0,
      easeFactor: 2.5,
      interval: 1,
      lastReview: null,
      nextReview: null,
      consecutiveAgain: 0,
      consecutiveEasy: 0,
    };
  }

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
}

export async function saveProgress(progress: CardProgress): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase.from('card_progress').upsert({
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
  if (error) throw error;
}

// ─── SRS algorithm ───────────────────────────────────────────────────────────

export type SRSAnswer = 'again' | 'hard' | 'good' | 'easy';

// Teto do intervalo em dias (~10 anos). Sem isso, respostas "bom"/"fácil"
// consecutivas multiplicam o interval sem limite até estourar o range de
// datas do JS — Date fica inválida e o algoritmo trava exatamente para o
// card que o usuário mais domina (bug encontrado por teste unitário).
const MAX_INTERVAL_DAYS = 3650;

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
      interval = progress.repetitions === 0 ? 0 : Math.min(MAX_INTERVAL_DAYS, Math.max(1, Math.round(Math.max(1, interval) * 1.2)));
      easeFactor = Math.max(1.3, easeFactor - 0.05);
      consecutiveEasy = 0;
      break;
    case 'good':
      consecutiveAgain = 0;
      consecutiveEasy = 0;
      repetitions += 1;
      interval = Math.min(MAX_INTERVAL_DAYS, Math.max(1, Math.round(interval * easeFactor)));
      break;
    case 'easy':
      consecutiveAgain = 0;
      consecutiveEasy += 1;
      repetitions += 1;
      const easyMultiplier = consecutiveEasy >= 3 ? 1.8 : 1.3;
      interval = Math.min(MAX_INTERVAL_DAYS, Math.max(1, Math.round(interval * easeFactor * easyMultiplier)));
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

/**
 * Posição inicial da PRIMEIRA sessão por autoavaliação de nível (E2.3 / FR-A2).
 * Mapeamento simples sobre as 400 frases atuais — o placement test real chega
 * com E1/FR-B4. Frases anteriores ao ponto de entrada ficam como não-vistas
 * (nenhum progresso falso é gravado).
 */
export const FIRST_SESSION_START: Record<LevelSelfReport, number> = {
  zero: 1,
  stuck: 150,
  fluency: 300,
};

export interface StudySessionOptions {
  /** Nº máximo de cards NOVOS da sessão. Sobrepõe o limite diário (uso: primeira sessão do onboarding). */
  sessionSize?: number;
  /** Position a partir da qual pegar cards novos. Cards anteriores não são marcados — só não entram nesta sessão. */
  startPosition?: number;
}

export async function getStudySession(
  deckId: string,
  options?: StudySessionOptions
): Promise<Card[]> {
  const settings = await getSettings();
  const isBuiltIn = deckId === DECK_1000.id;
  const cards = isBuiltIn ? getBuiltinCards() : await getCards(deckId);
  const allProgress = await getAllProgress();
  const now = new Date();

  // Primeira sessão do onboarding: só cards novos a partir do ponto de entrada,
  // sem revisões e sem o teto diário (o usuário acabou de definir a meta e
  // precisa do "aha" antes de qualquer outra tela).
  if (options?.sessionSize !== undefined) {
    const from = options.startPosition ?? 1;
    const studiedIds = new Set(allProgress.map((p) => p.cardId));
    return cards
      .filter((c) => !studiedIds.has(c.id) && c.position >= from)
      .sort((a, b) => a.position - b.position)
      .slice(0, options.sessionSize);
  }

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

  const studied = new Set(allProgress.map((p) => p.cardId));

  // Limite diário REAL de cards novos (fix A3 da auditoria 2026-06-12):
  // "5 por dia" era "5 por sessão" — agora desconta as novas já vistas HOJE
  // (primeira vez estudado = created_at da linha de progresso).
  const today = new Date().toDateString();
  const newStudiedToday = allProgress.filter(
    (p) => p.createdAt && new Date(p.createdAt).toDateString() === today
  ).length;
  const remainingToday = Math.max(0, settings.dailyGoal - newStudiedToday);

  // O ponto de entrada do usuário (declarado no onboarding) vale para TODA a
  // jornada, não só para a primeira sessão. Sem isso, quem disse "travo na hora
  // de usar" começava na frase 150 no dia 0 e era jogado de volta na frase 1 no
  // dia 1 — a personalização evaporava e o app voltava a ser "She has a dog".
  //
  // As frases anteriores ao ponto de entrada NÃO são perdidas: elas vão para o
  // FIM da fila. Quando o usuário esgotar as frases do nível dele, elas voltam
  // naturalmente. (O placement test da E1.4 refina isso e dá o botão explícito
  // de "revisar do início".)
  const entryPosition = isBuiltIn
    ? FIRST_SESSION_START[settings.levelSelfreport ?? 'zero']
    : 1;

  const unseen = cards.filter((c) => !studied.has(c.id));
  const byPosition = (a: Card, b: Card) => (a.position ?? 0) - (b.position ?? 0);

  const fromEntryPoint = unseen.filter((c) => c.position >= entryPosition).sort(byPosition);
  const skipped = unseen.filter((c) => c.position < entryPosition).sort(byPosition);

  const newCards = [...fromEntryPoint, ...skipped].slice(
    0,
    isBuiltIn ? remainingToday : undefined
  );

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
