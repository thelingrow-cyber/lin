// ============================================================
// Lingrow — Tela-semente do patrimônio (Story E2.3, FR-A3)
// Épico: docs/stories/epic-e2-onboarding-conversao.md
//
// Chega DEPOIS da primeira sessão de 5 frases do onboarding. É aqui —
// e só aqui — que o app pede permissão de notificação: acabou de
// prometer um lembrete, então o contexto é máximo (AC4).
// CTA leva ao paywall Day-0 (E2.4) 1× e daí para a home.
// Textos FINAIS — não alterar sem @po.
// ============================================================

import { Href, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Analytics } from '@/lib/analytics';
import { FLAG_PAYWALL_D0_SHOWN, getFlag, setFlag } from '@/lib/flags';
import { requestNotificationPermission, scheduleNextReviewNotification } from '@/lib/notifications';
import { isPaywallEnabled } from '@/lib/premium';
import { colors, fonts, radius, shadow, spacing } from '@/theme';

export default function FirstSessionDoneScreen() {
  const { studied } = useLocalSearchParams<{ studied?: string }>();
  const count = Number(studied) > 0 ? Number(studied) : 5;
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    Analytics.seedScreenViewed(count);

    // permissão pedida NESTE momento (AC4): a promessa do lembrete acabou de
    // ser feita na tela. Falha/negação não bloqueia nada.
    (async () => {
      const granted = await requestNotificationPermission();
      Analytics.notificationPermissionResult(granted);
      if (granted) void scheduleNextReviewNotification();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToSpace = async () => {
    if (leaving) return;
    setLeaving(true);

    // Só apresenta o paywall Day-0 se ele REALMENTE puder vender: RevenueCat
    // configurado + kill switch remoto ligado. Sem isso, mostrar a tela de
    // compra seria entregar um botão que responde "assinatura indisponível"
    // no primeiro dia de uso — pior que não mostrar nada.
    const [alreadyShown, paywallLive] = await Promise.all([
      getFlag(FLAG_PAYWALL_D0_SHOWN),
      isPaywallEnabled(),
    ]);

    if (alreadyShown || !paywallLive) {
      router.replace('/(tabs)');
      return;
    }

    await setFlag(FLAG_PAYWALL_D0_SHOWN);
    // paywall Day-0 (E2.4): 1 única vez, com fechar visível; ao sair, home.
    router.replace({ pathname: '/paywall', params: { context: 'onboarding' } } as unknown as Href);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={44} color={colors.success} />
        </View>

        <Text style={styles.title}>{count} frases suas. ✅</Text>

        <View style={styles.card}>
          <Text style={styles.cardText}>
            O Lingrow agenda a revisão de cada uma no momento exato antes de você esquecer.
            Amanhã eu te chamo pra primeira.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
          onPress={goToSpace}
          disabled={leaving}
          accessibilityLabel="Conhecer meu espaço"
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>Conhecer meu espaço</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  wrap: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.lg },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    fontSize: 30,
    fontFamily: fonts.extrabold,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.xl,
    ...shadow.card,
  },
  cardText: { fontSize: 16, color: colors.text, lineHeight: 24, textAlign: 'center' },
  cta: {
    paddingVertical: 16,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  ctaText: { color: colors.onPrimary, fontSize: 17, fontFamily: fonts.bold },
});
