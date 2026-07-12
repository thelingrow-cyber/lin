import {
  computeNextReview,
  getSettings,
  getStudySession,
  saveSettings,
  CardProgress,
  FIRST_SESSION_START,
  SRSAnswer,
} from './lingrow';
import { DECK_1000 } from '@/data/sentences';

// Mock em memória do supabase — cobre apenas o que getSettings/saveSettings
// usam (auth.getSession, select().eq().maybeSingle(), upsert). Os testes de
// computeNextReview não tocam rede, então o mock global não os afeta.
jest.mock('@/lib/supabase', () => {
  const rows: Record<string, Record<string, unknown>> = {};
  return {
    __resetSettingsRows: () => {
      for (const k of Object.keys(rows)) delete rows[k];
    },
    supabase: {
      auth: {
        getSession: async () => ({ data: { session: { user: { id: 'user-1' } } } }),
      },
      from: (_table: string) => ({
        select: (_cols?: string) => ({
          eq: (_col: string, val: string) => ({
            maybeSingle: async () => ({ data: rows[val] ?? null, error: null }),
          }),
        }),
        upsert: async (patch: Record<string, unknown>) => {
          const key = String(patch.user_id);
          rows[key] = { ...(rows[key] ?? {}), ...patch };
          return { error: null };
        },
      }),
    },
  };
});

const { __resetSettingsRows } = jest.requireMock('@/lib/supabase') as {
  __resetSettingsRows: () => void;
};

const baseProgress = (overrides: Partial<CardProgress> = {}): CardProgress => ({
  cardId: 'card-1',
  userId: 'user-1',
  repetitions: 0,
  easeFactor: 2.5,
  interval: 1,
  lastReview: null,
  nextReview: null,
  consecutiveAgain: 0,
  consecutiveEasy: 0,
  ...overrides,
});

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

describe('computeNextReview (algoritmo SRS)', () => {
  const now = () => new Date();

  it('"again" num card novo: zera repetitions/interval e agenda em ~1 minuto', () => {
    const result = computeNextReview(baseProgress(), 'again');
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(0);
    expect(result.consecutiveAgain).toBe(1);
    expect(result.consecutiveEasy).toBe(0);
    expect(result.easeFactor).toBeCloseTo(2.3, 5); // penalidade leve (-0.2) no 1º "again"

    const next = new Date(result.nextReview!);
    const diffMin = (next.getTime() - now().getTime()) / 60000;
    expect(diffMin).toBeGreaterThan(0.5);
    expect(diffMin).toBeLessThan(1.5);
  });

  it('2 "again" consecutivos aplicam penalidade agressiva (-0.4) na segunda vez', () => {
    const first = computeNextReview(baseProgress(), 'again');
    const second = computeNextReview(first, 'again');
    expect(second.consecutiveAgain).toBe(2);
    expect(second.easeFactor).toBeCloseTo(2.5 - 0.2 - 0.4, 5);
  });

  it('easeFactor nunca cai abaixo do piso de 1.3, mesmo com muitos "again"', () => {
    let progress = baseProgress({ easeFactor: 1.4 });
    for (let i = 0; i < 10; i++) {
      progress = computeNextReview(progress, 'again');
    }
    expect(progress.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('"hard" num card NUNCA estudado (repetitions original 0) agenda curto prazo, não usa o interval anterior', () => {
    const result = computeNextReview(baseProgress({ repetitions: 0, interval: 5 }), 'hard');
    expect(result.interval).toBe(0);
    expect(result.repetitions).toBe(1);
    expect(result.easeFactor).toBeCloseTo(2.45, 5);
  });

  it('"hard" num card já revisado antes acelera o interval em 1.2x (mínimo 1 dia)', () => {
    const result = computeNextReview(baseProgress({ repetitions: 2, interval: 4 }), 'hard');
    expect(result.interval).toBe(Math.round(4 * 1.2)); // 5
    const next = new Date(result.nextReview!);
    expect(daysBetween(now(), next)).toBe(result.interval);
  });

  it('"good" multiplica o interval pelo easeFactor e mantém o easeFactor', () => {
    const result = computeNextReview(baseProgress({ interval: 1, easeFactor: 2.5 }), 'good');
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(Math.round(1 * 2.5)); // 3
    expect(result.easeFactor).toBe(2.5);
    expect(result.consecutiveAgain).toBe(0);
    expect(result.consecutiveEasy).toBe(0);
  });

  it('"easy" acelera o interval, aumenta o easeFactor e conta consecutiveEasy', () => {
    const result = computeNextReview(baseProgress({ interval: 1, easeFactor: 2.5 }), 'easy');
    expect(result.consecutiveEasy).toBe(1);
    expect(result.interval).toBe(Math.round(1 * 2.5 * 1.3)); // multiplicador 1.3 antes do 3º consecutivo
    expect(result.easeFactor).toBeCloseTo(2.6, 5);
  });

  it('3º "easy" consecutivo troca o multiplicador para 1.8 (acelera mais que 1.3)', () => {
    let progress = baseProgress({ interval: 1, easeFactor: 2.5 });
    progress = computeNextReview(progress, 'easy'); // consecutiveEasy=1, mult=1.3 → interval=round(1*2.5*1.3)=3, ease=2.6
    expect(progress.interval).toBe(3);
    progress = computeNextReview(progress, 'easy'); // consecutiveEasy=2, mult=1.3 → interval=round(3*2.6*1.3)=10, ease=2.7
    expect(progress.interval).toBe(10);

    const before = progress.interval;
    const easeBefore = progress.easeFactor;
    progress = computeNextReview(progress, 'easy'); // consecutiveEasy=3 → multiplicador vira 1.8

    expect(progress.consecutiveEasy).toBe(3);
    const withAcceleratedMultiplier = Math.round(before * easeBefore * 1.8);
    const withNormalMultiplier = Math.round(before * easeBefore * 1.3);
    expect(progress.interval).toBe(withAcceleratedMultiplier);
    expect(progress.interval).not.toBe(withNormalMultiplier);
  });

  it('easeFactor nunca passa do teto de 4.0, mesmo com muitos "easy"', () => {
    let progress = baseProgress({ easeFactor: 3.95 });
    for (let i = 0; i < 10; i++) {
      progress = computeNextReview(progress, 'easy');
    }
    expect(progress.easeFactor).toBeLessThanOrEqual(4.0);
  });

  it('interval tem teto de 3650 dias — sem isso, muitos "easy" seguidos estouram o range de Date e travam o app', () => {
    // regressão: antes do fix, 10 "easy" consecutivos faziam nextReview.toISOString()
    // lançar RangeError (Invalid time value) por estourar o range de datas do JS.
    let progress = baseProgress({ interval: 1, easeFactor: 2.5 });
    for (let i = 0; i < 10; i++) {
      progress = computeNextReview(progress, 'easy');
    }
    expect(progress.interval).toBeLessThanOrEqual(3650);
    expect(() => new Date(progress.nextReview!).toISOString()).not.toThrow();
    expect(Number.isNaN(new Date(progress.nextReview!).getTime())).toBe(false);
  });

  it('qualquer resposta que não seja "again" agenda em ~10 minutos quando o interval calculado é 0', () => {
    // "hard" num card virgem (repetitions original 0) força interval=0
    const result = computeNextReview(baseProgress({ repetitions: 0 }), 'hard');
    expect(result.interval).toBe(0);
    const next = new Date(result.nextReview!);
    const diffMin = (next.getTime() - now().getTime()) / 60000;
    expect(diffMin).toBeGreaterThan(9);
    expect(diffMin).toBeLessThan(11);
  });

  it('sempre atualiza lastReview para agora', () => {
    const before = Date.now();
    const result = computeNextReview(baseProgress(), 'good');
    const lastReview = new Date(result.lastReview!).getTime();
    expect(lastReview).toBeGreaterThanOrEqual(before);
    expect(lastReview).toBeLessThanOrEqual(Date.now());
  });
});

describe('getSettings/saveSettings — perfil de aprendizado (E2.1, migration 007)', () => {
  beforeEach(() => __resetSettingsRows());

  it('usuário sem linha: defaults com goal/levelSelfreport/onboardingVersion nulos', async () => {
    const s = await getSettings();
    expect(s.onboardingDone).toBe(false);
    expect(s.goal).toBeNull();
    expect(s.levelSelfreport).toBeNull();
    expect(s.onboardingVersion).toBeNull();
  });

  it('roundtrip: salva goal+level+versão e lê de volta os mesmos valores', async () => {
    await saveSettings({
      goal: 'work',
      levelSelfreport: 'stuck',
      dailyGoal: 10,
      onboardingVersion: 'v2',
      onboardingDone: true,
    });
    const s = await getSettings();
    expect(s.goal).toBe('work');
    expect(s.levelSelfreport).toBe('stuck');
    expect(s.dailyGoal).toBe(10);
    expect(s.onboardingVersion).toBe('v2');
    expect(s.onboardingDone).toBe(true);
  });

  it('upsert parcial preservado: salvar só streak não apaga o perfil de aprendizado', async () => {
    await saveSettings({ goal: 'travel', levelSelfreport: 'zero', onboardingVersion: 'v2' });
    await saveSettings({ streak: 7 });
    const s = await getSettings();
    expect(s.streak).toBe(7);
    expect(s.goal).toBe('travel');
    expect(s.levelSelfreport).toBe('zero');
    expect(s.onboardingVersion).toBe('v2');
  });
});

describe('getStudySession — primeira sessão do onboarding (E2.3)', () => {
  beforeEach(() => __resetSettingsRows());

  it('entrega exatamente sessionSize cards a partir de startPosition', async () => {
    const session = await getStudySession(DECK_1000.id, { sessionSize: 5, startPosition: 150 });
    expect(session).toHaveLength(5);
    expect(session.map((c) => c.position)).toEqual([150, 151, 152, 153, 154]);
  });

  it('cada nível entra no ponto mapeado — e o iniciante começa na frase 1', async () => {
    const zero = await getStudySession(DECK_1000.id, {
      sessionSize: 5,
      startPosition: FIRST_SESSION_START.zero,
    });
    expect(zero[0].position).toBe(1);

    const fluency = await getStudySession(DECK_1000.id, {
      sessionSize: 5,
      startPosition: FIRST_SESSION_START.fluency,
    });
    expect(fluency[0].position).toBe(300);
  });

  it('frases puladas NÃO viram progresso — elas apenas não entram nesta sessão', async () => {
    const session = await getStudySession(DECK_1000.id, { sessionSize: 5, startPosition: 300 });
    // nenhum card anterior ao ponto de entrada aparece; nada foi gravado por ter sido "pulado"
    expect(session.every((c) => c.position >= 300)).toBe(true);
  });

  it('sem opções, a sessão normal continua respeitando a meta diária (regressão)', async () => {
    await saveSettings({ dailyGoal: 5 });
    const session = await getStudySession(DECK_1000.id);
    expect(session).toHaveLength(5);
    expect(session[0].position).toBe(1);
  });
});
