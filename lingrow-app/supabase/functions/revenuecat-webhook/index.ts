// ============================================================
// Lingrow — Edge Function: revenuecat-webhook
// Plano: docs/stories/fase-5-paywall-plano.md
// Preço/formato: docs/monetization-strategy-2026-07.md (v2.0)
//
// Fonte da verdade de is_premium/subscription_status no Supabase.
// O RevenueCat autentica o webhook enviando de volta, em TODA chamada,
// exatamente a string configurada como "Authorization Header" no
// dashboard (não é HMAC sobre o corpo — é comparação de segredo fixo).
// Segredo vazio (default de app_config) = webhook recusa tudo (estado
// seguro até o fundador configurar de verdade).
//
// app_user_id do evento == auth.users.id, porque o SDK é inicializado
// com Purchases.configure({ appUserID: session.user.id }) (lib/premium.ts).
// ============================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PREMIUM_ENTITLEMENT_ID = 'premium';

type RcEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'UNCANCELLATION'
  | 'NON_RENEWING_PURCHASE'
  | 'PRODUCT_CHANGE'
  | 'TRANSFER'
  | 'CANCELLATION'
  | 'EXPIRATION'
  | 'BILLING_ISSUE'
  | 'SUBSCRIPTION_PAUSED'
  | string;

interface RcEvent {
  type: RcEventType;
  app_user_id?: string;
  original_app_user_id?: string;
  entitlement_id?: string | null;
  entitlement_ids?: string[] | null;
  period_type?: 'NORMAL' | 'TRIAL' | 'INTRO' | 'PREPAID' | string;
  expiration_at_ms?: number | null;
}

interface RcWebhookBody {
  api_version?: string;
  event?: RcEvent;
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function eventEntitlements(event: RcEvent): string[] {
  if (Array.isArray(event.entitlement_ids)) return event.entitlement_ids;
  if (event.entitlement_id) return [event.entitlement_id];
  return [];
}

const ACTIVATING_EVENTS = new Set<RcEventType>([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'PRODUCT_CHANGE',
  'TRANSFER',
]);

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'method_not_allowed' });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // 1. Autenticação do webhook (segredo fixo configurado no dashboard RevenueCat)
  const { data: secretRow } = await admin
    .from('app_config')
    .select('value')
    .eq('key', 'revenuecat_webhook_secret')
    .maybeSingle();

  const expectedSecret = secretRow?.value ?? '';
  const providedAuth = req.headers.get('Authorization') ?? '';

  if (!expectedSecret || !timingSafeEqual(providedAuth, expectedSecret)) {
    console.error('revenuecat-webhook: segredo ausente ou inválido');
    return json(401, { error: 'unauthorized' });
  }

  // 2. Corpo do evento
  let body: RcWebhookBody;
  try {
    body = await req.json();
  } catch {
    return json(422, { error: 'invalid_json' });
  }

  const event = body.event;
  if (!event?.type) {
    return json(422, { error: 'missing_event' });
  }

  const userId = event.app_user_id ?? event.original_app_user_id;
  if (!userId) {
    console.error('revenuecat-webhook: evento sem app_user_id', event.type);
    return json(200, { ok: true, ignored: 'no_app_user_id' });
  }

  // 3. Evento não é do entitlement premium — nada a fazer (app tem 1 entitlement hoje)
  const entitlements = eventEntitlements(event);
  if (entitlements.length > 0 && !entitlements.includes(PREMIUM_ENTITLEMENT_ID)) {
    return json(200, { ok: true, ignored: 'other_entitlement' });
  }

  const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null;

  let patch: Record<string, unknown> | null = null;

  if (ACTIVATING_EVENTS.has(event.type)) {
    patch = {
      is_premium: true,
      premium_expires_at: expiresAt,
      subscription_status: event.period_type === 'TRIAL' ? 'trial' : 'active',
      revenuecat_customer_id: userId,
    };
  } else if (event.type === 'CANCELLATION') {
    // Continua premium até o fim do período já pago — EXPIRATION desativa de fato.
    patch = {
      premium_expires_at: expiresAt,
      subscription_status: 'cancelled',
    };
  } else if (event.type === 'EXPIRATION') {
    patch = {
      is_premium: false,
      premium_expires_at: expiresAt,
      subscription_status: 'expired',
    };
  }
  // BILLING_ISSUE, SUBSCRIPTION_PAUSED e tipos desconhecidos: só logamos, sem mudar entitlement
  // (grace period é gerenciado pela própria loja/RevenueCat).

  if (!patch) {
    return json(200, { ok: true, ignored: event.type });
  }

  const { error } = await admin
    .from('user_settings')
    .update(patch)
    .eq('user_id', userId);

  if (error) {
    console.error('revenuecat-webhook: falha ao atualizar user_settings', error.message);
    return json(500, { error: 'internal' });
  }

  return json(200, { ok: true });
});
