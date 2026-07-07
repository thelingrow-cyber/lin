// ============================================================
// Lingrow — Edge Function: delete-account
// Achado: technical-debt-assessment-2026-07.md §2 (C2) — o botão de
// exclusão no app só apagava dados soltos, nunca a conta de auth.users,
// ignorava erro parcial. Guideline 5.1.1(v) da Apple exige exclusão real.
//
// Toda tabela de dado do usuário (decks, card_progress, user_settings,
// study_sessions, ai_usage) já tem FK "ON DELETE CASCADE" para
// auth.users(id) desde as migrations 001/004 — cards cai em cascata via
// decks. Por isso: apagar o usuário em auth.users já limpa tudo em uma
// operação atômica no banco, sem precisar apagar tabela por tabela aqui.
// ============================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'method_not_allowed' });
  }

  // 1. Auth — valida o JWT do próprio usuário (nunca aceita deletar outra conta)
  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return json(401, { error: 'unauthenticated' });
  }

  // 2. Exclusão real — cascade no banco cuida de decks/cards/card_progress/
  //    user_settings/study_sessions/ai_usage numa transação atômica.
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error('delete-account: falha ao excluir usuário', user.id, deleteError.message);
    return json(500, { error: 'delete_failed', detail: deleteError.message });
  }

  return json(200, { ok: true });
});
