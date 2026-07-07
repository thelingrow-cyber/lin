import { computeNextReview, CardProgress, SRSAnswer } from './lingrow';

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
