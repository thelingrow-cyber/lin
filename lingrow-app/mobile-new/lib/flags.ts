// ============================================================
// Lingrow — Flags locais (AsyncStorage)
// Estado de apresentação que NÃO pertence ao servidor: "já mostrei
// isso a este usuário neste device?". Nunca guardar entitlement aqui
// (fonte da verdade é o RevenueCat/webhook — ver migration 006).
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

export const FLAG_PAYWALL_D0_SHOWN = 'paywall_d0_shown';

export async function getFlag(key: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(key)) === 'true';
  } catch {
    // storage indisponível: tratar como "não mostrado" é o comportamento seguro
    // (no pior caso o usuário vê a tela uma vez a mais, nunca fica preso)
    return false;
  }
}

export async function setFlag(key: string, value = true): Promise<void> {
  try {
    await AsyncStorage.setItem(key, String(value));
  } catch {
    // best-effort — não travar o fluxo por falha de storage
  }
}
