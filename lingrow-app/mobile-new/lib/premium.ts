// ============================================================
// Lingrow — Cliente do RevenueCat (paywall Fase 5)
// Plano: docs/stories/fase-5-paywall-plano.md
// Preço/formato: docs/monetization-strategy-2026-07.md (v2.0)
//
// Fonte da verdade do entitlement: SEMPRE o CustomerInfo do RevenueCat
// (que reflete o webhook). Nunca ler is_premium direto do Supabase para
// decidir se libera feature — isso é só espelho para exibição de UI.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import Purchases, { CustomerInfo, LOG_LEVEL, PurchasesOffering } from 'react-native-purchases';

export const PREMIUM_ENTITLEMENT_ID = 'premium';

const RC_API_KEY = process.env.EXPO_PUBLIC_RC_API_KEY ?? '';

let configured = false;

/** Chamar uma vez no boot do app (RootLayout). Sem a chave, vira no-op — o
 * paywall fica indisponível mas o resto do app funciona normalmente. */
export function configureRevenueCat(appUserId?: string): void {
  if (configured || !RC_API_KEY) return;
  Purchases.configure({ apiKey: RC_API_KEY, appUserID: appUserId });
  if (__DEV__) void Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  configured = true;
}

export function isRevenueCatConfigured(): boolean {
  return configured;
}

function isEntitlementActive(info: CustomerInfo): boolean {
  return info.entitlements.active[PREMIUM_ENTITLEMENT_ID] != null;
}

/**
 * Hook de entitlement em tempo real. Sempre confiar neste valor para
 * liberar/bloquear feature premium na UI — é o CustomerInfo do RevenueCat,
 * atualizado automaticamente após compra/restore/expiração.
 */
export function usePremium() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!configured) {
      setIsPremium(false);
      setLoading(false);
      return;
    }
    try {
      const info = await Purchases.getCustomerInfo();
      setIsPremium(isEntitlementActive(info));
    } catch {
      // falha de rede — mantém o último valor conhecido em vez de derrubar premium
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    if (!configured) return;

    const listener = (info: CustomerInfo) => setIsPremium(isEntitlementActive(info));
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => { Purchases.removeCustomerInfoUpdateListener(listener); };
  }, [refresh]);

  return { isPremium, loading, refresh };
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!configured) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function restorePurchases(): Promise<boolean> {
  if (!configured) return false;
  const info = await Purchases.restorePurchases();
  return isEntitlementActive(info);
}
