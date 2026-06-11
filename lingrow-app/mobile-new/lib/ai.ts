// ============================================================
// Lingrow — Cliente do motor de IA (Edge Function: generate-cards)
// Story: IA-1.1 | NÃO salva nada — devolve drafts p/ tela de revisão (Fase 2).
// ============================================================

import { supabase } from '@/lib/supabase';

export type AiLevel = 'basic' | 'intermediate' | 'advanced';

/** Card gerado pela IA — ainda SEM id/deckId (drafts da tela de revisão). */
export interface AiCardDraft {
  front: string;
  back: string;
  keyword: string;
  keywordPt: string;
  notes?: string;
}

export interface AiUsage {
  used: number;
  limit: number;
  month: string; // 'YYYY-MM'
}

export interface GenerateCardsParams {
  theme: string;
  count?: number;
  level?: AiLevel;
  /** Caminho B: contexto do deck existente p/ cards coerentes sem duplicar. */
  deckContext?: { name: string; sampleFronts: string[] };
}

export interface GenerateCardsResult {
  cards: AiCardDraft[];
  usage: AiUsage;
}

export type AiErrorCode =
  | 'unauthenticated'    // 401 — sessão inválida
  | 'feature_disabled'   // 403 — kill switch desligado
  | 'invalid_input'      // 422 — tema vazio/longo demais
  | 'quota_exceeded'     // 429 — limite mensal do tier atingido
  | 'too_many_requests'  // 429 — anti-burst (aguarde alguns segundos)
  | 'generation_failed'  // 502 — IA falhou (quota foi reembolsada)
  | 'network'            // sem conexão / timeout
  | 'unknown';

export class AiError extends Error {
  code: AiErrorCode;
  /** Presente em quota_exceeded — p/ exibir "X de Y usadas". */
  usage?: AiUsage;
  /** Presente em too_many_requests. */
  retryAfterSeconds?: number;

  constructor(code: AiErrorCode, message: string, usage?: AiUsage, retryAfterSeconds?: number) {
    super(message);
    this.name = 'AiError';
    this.code = code;
    this.usage = usage;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const KNOWN_CODES: AiErrorCode[] = [
  'unauthenticated',
  'feature_disabled',
  'invalid_input',
  'quota_exceeded',
  'too_many_requests',
  'generation_failed',
];

/**
 * Gera flashcards via IA. Lança `AiError` tipado em qualquer falha.
 * Nunca persiste nada — o chamador decide salvar (tela de revisão).
 */
export async function generateCards(params: GenerateCardsParams): Promise<GenerateCardsResult> {
  const theme = params.theme?.trim() ?? '';
  if (theme.length === 0 || theme.length > 100) {
    throw new AiError('invalid_input', 'O tema deve ter entre 1 e 100 caracteres.');
  }

  const { data, error } = await supabase.functions.invoke('generate-cards', {
    body: {
      theme,
      count: params.count,
      level: params.level,
      deckContext: params.deckContext,
    },
  });

  if (error) {
    // FunctionsHttpError carrega a Response original em error.context
    const response: Response | undefined = (error as { context?: Response }).context;
    if (response) {
      let payload: Record<string, unknown> = {};
      try {
        payload = await response.json();
      } catch {
        // corpo não-JSON — segue com payload vazio
      }
      const code = KNOWN_CODES.includes(payload.error as AiErrorCode)
        ? (payload.error as AiErrorCode)
        : 'unknown';
      throw new AiError(
        code,
        `generate-cards falhou (${response.status}): ${code}`,
        payload.usage as AiUsage | undefined,
        typeof payload.retryAfterSeconds === 'number' ? payload.retryAfterSeconds : undefined,
      );
    }
    // Sem Response ⇒ falha de rede/timeout
    throw new AiError('network', 'Sem conexão com o servidor. Tente novamente.');
  }

  const cards = (data?.cards ?? []) as AiCardDraft[];
  const usage = data?.usage as AiUsage | undefined;
  if (!Array.isArray(cards) || cards.length === 0 || !usage) {
    throw new AiError('unknown', 'Resposta inesperada do servidor.');
  }

  return { cards, usage };
}

/**
 * Kill switch remoto: a feature de IA só aparece com `ai_enabled = 'true'`.
 * Em qualquer falha de leitura, assume DESLIGADA (estado seguro).
 */
export async function isAiEnabled(): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'ai_enabled')
      .maybeSingle();
    return data?.value === 'true';
  } catch {
    return false;
  }
}

/** Limites de exibição (o servidor é a autoridade — isto é só p/ UI). */
export const AI_DISPLAY_LIMITS = { free: 3, premium: 20 } as const;

/**
 * Tier do usuário p/ exibição da quota (premium ativo e não expirado).
 */
export async function isPremiumUser(): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('user_settings')
      .select('is_premium, premium_expires_at')
      .maybeSingle();
    if (!data?.is_premium) return false;
    return data.premium_expires_at == null || new Date(data.premium_expires_at) > new Date();
  } catch {
    return false;
  }
}

/**
 * Lê o uso de IA do mês corrente direto da tabela (RLS: leitura própria).
 * P/ exibir "✨ X gerações restantes" sem chamar a função.
 */
export async function getAiUsage(limitForTier: number): Promise<AiUsage> {
  const month = new Date().toISOString().slice(0, 7);
  const { data } = await supabase
    .from('ai_usage')
    .select('generations_used')
    .eq('month', month)
    .maybeSingle();

  return { used: data?.generations_used ?? 0, limit: limitForTier, month };
}
