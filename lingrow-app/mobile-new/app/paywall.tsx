// ============================================================
// Lingrow — Paywall (Fase 5.2)
// Plano: docs/stories/fase-5-paywall-plano.md
// Preço/formato: docs/monetization-strategy-2026-07.md (v2.0)
//
// R$24,90/mês · R$179,90/ano (destaque) · trial 14 dias.
// Fechar sem comprar volta sem forçar nada. O preço exibido vem do
// StoreProduct de verdade (pkg.product.priceString) quando o RevenueCat
// já estiver configurado; até lá, mostramos o valor de referência do
// plano de monetização como fallback informativo.
// ============================================================

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

import { getCurrentOffering, isRevenueCatConfigured, restorePurchases, usePremium } from '@/lib/premium';
import { colors, fonts, radius, shadow, spacing } from '@/theme';

const PRIVACY_URL = 'https://www.notion.so/Pol-tica-de-Privacidade-Lingrow-2efa44f320bd4399a11610f0803f0e8d';
// EULA padrão da Apple — mesmo fallback que o App Store Connect usa quando o
// desenvolvedor não configura termos próprios. Guideline 3.1.2 exige o link
// funcional na tela de compra; trocar por um EULA próprio quando existir um.
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

// Fallback de referência — usado só se a oferta ainda não estiver configurada
// no RevenueCat/App Store Connect. O preço real do StoreProduct sempre tem prioridade.
const FALLBACK_PRICE = { monthly: 'R$ 24,90/mês', annual: 'R$ 179,90/ano' };

const BENEFITS = [
  { icon: 'sparkles' as const, text: '20 gerações de IA por mês (5x mais que o grátis), até 20 cards cada' },
  { icon: 'trending-up' as const, text: 'Novidades de retenção e progresso chegando primeiro para assinantes' },
  { icon: 'infinite' as const, text: 'Decks e revisão sem limites — sempre foi assim, sempre vai ser' },
];

export default function PaywallScreen() {
  const { isPremium } = usePremium();
  const [offering, setOffering] = useState<Awaited<ReturnType<typeof getCurrentOffering>>>(null);
  const [loadingOffering, setLoadingOffering] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selected, setSelected] = useState<'monthly' | 'annual'>('annual');

  useEffect(() => {
    (async () => {
      try {
        setOffering(await getCurrentOffering());
      } catch {
        // sem oferta configurada ainda — segue com o fallback informativo
      } finally {
        setLoadingOffering(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (isPremium) {
      Alert.alert('Você já é premium ✨', 'Sua assinatura está ativa.');
      router.back();
    }
  }, [isPremium]);

  const monthlyPkg: PurchasesPackage | null = offering?.monthly ?? null;
  const annualPkg: PurchasesPackage | null = offering?.annual ?? null;
  const selectedPkg = selected === 'annual' ? annualPkg : monthlyPkg;

  const purchase = async () => {
    if (!selectedPkg) {
      Alert.alert(
        'Assinatura ainda não disponível',
        'Estamos finalizando a configuração dos planos. Volte em breve!'
      );
      return;
    }
    setPurchasing(true);
    try {
      await Purchases.purchasePackage(selectedPkg);
      // isPremium atualiza sozinho via listener do usePremium (customerInfo update)
      Alert.alert('Bem-vindo ao Premium ✨', 'Sua assinatura está ativa.');
      router.back();
    } catch (e: any) {
      const cancelled = e?.userCancelled === true
        || e?.code === Purchases.PURCHASES_ERROR_CODE?.PURCHASE_CANCELLED_ERROR;
      if (!cancelled) {
        Alert.alert('Não foi possível concluir a compra', e?.message ?? 'Tente novamente.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const restore = async () => {
    setRestoring(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        Alert.alert('Compra restaurada ✨', 'Sua assinatura premium foi reativada.');
        router.back();
      } else {
        Alert.alert('Nada para restaurar', 'Não encontramos uma assinatura ativa nesta conta.');
      }
    } catch (e: any) {
      Alert.alert('Erro ao restaurar', e?.message ?? 'Tente novamente.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          accessibilityLabel="Fechar"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.heroIconWrap}>
          <Ionicons name="sparkles" size={30} color={colors.primary} />
        </View>
        <Text style={styles.title}>Lingrow Premium</Text>
        <Text style={styles.sub}>Para quem não aceita mais voltar do zero.</Text>

        <View style={styles.benefitsCard}>
          {BENEFITS.map((b) => (
            <View key={b.text} style={styles.benefitRow}>
              <View style={styles.benefitIconWrap}>
                <Ionicons name={b.icon} size={16} color={colors.primary} />
              </View>
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>

        {loadingOffering ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
        ) : (
          <View style={styles.plansRow}>
            <TouchableOpacity
              style={[styles.planCard, selected === 'monthly' && styles.planCardActive]}
              onPress={() => setSelected('monthly')}
              accessibilityLabel="Plano mensal"
              accessibilityRole="button"
            >
              <Text style={styles.planLabel}>Mensal</Text>
              <Text style={styles.planPrice}>{monthlyPkg?.product.priceString ?? FALLBACK_PRICE.monthly}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.planCard, selected === 'annual' && styles.planCardActive]}
              onPress={() => setSelected('annual')}
              accessibilityLabel="Plano anual, melhor valor"
              accessibilityRole="button"
            >
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>MELHOR VALOR</Text>
              </View>
              <Text style={styles.planLabel}>Anual</Text>
              <Text style={styles.planPrice}>{annualPkg?.product.priceString ?? FALLBACK_PRICE.annual}</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.trialNote}>
          14 dias grátis. Depois, {selected === 'annual' ? annualPkg?.product.priceString ?? FALLBACK_PRICE.annual : monthlyPkg?.product.priceString ?? FALLBACK_PRICE.monthly}
          {' '}— cobrado no seu Apple ID na confirmação. A assinatura renova automaticamente, salvo cancelamento com pelo menos 24h de antecedência do fim do período vigente. Gerencie ou cancele a qualquer momento em Ajustes {'>'} Apple ID {'>'} Assinaturas.
        </Text>

        <TouchableOpacity disabled={purchasing} activeOpacity={0.9} onPress={purchase}>
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.purchaseBtn, purchasing && { opacity: 0.7 }]}
          >
            <Text style={styles.purchaseBtnText}>
              {purchasing ? 'Processando…' : 'Experimentar 14 dias grátis'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreBtn} onPress={restore} disabled={restoring}>
          <Text style={styles.restoreBtnText}>{restoring ? 'Restaurando…' : 'Restaurar compra'}</Text>
        </TouchableOpacity>

        <View style={styles.privacyRow}>
          <Text style={styles.privacyText}>Ao assinar, você concorda com nossa </Text>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text style={styles.privacyLink}>Política de Privacidade</Text>
          </TouchableOpacity>
          <Text style={styles.privacyText}> e nossos </Text>
          <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
            <Text style={styles.privacyLink}>Termos de Uso</Text>
          </TouchableOpacity>
        </View>

        {!isRevenueCatConfigured() && (
          <Text style={styles.debugNote}>[dev] RevenueCat ainda não configurado — preços de referência.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, gap: spacing.md, paddingBottom: 40 },
  closeBtn: { alignSelf: 'flex-end', marginBottom: spacing.xs },
  heroIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  title: { fontSize: 26, fontFamily: fonts.extrabold, color: colors.primary, textAlign: 'center', letterSpacing: -0.4 },
  sub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.sm },
  benefitsCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, borderWidth: 1, borderColor: colors.borderSoft, ...shadow.card },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  benefitIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  benefitText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  plansRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  planCard: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', gap: 4, backgroundColor: colors.surface },
  planCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  bestValueBadge: { position: 'absolute', top: -10, backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  bestValueText: { fontSize: 10, fontFamily: fonts.bold, color: colors.surface, letterSpacing: 0.5 },
  planLabel: { fontSize: 13, fontFamily: fonts.semibold, color: colors.textMuted, marginTop: 6 },
  planPrice: { fontSize: 18, fontFamily: fonts.extrabold, color: colors.text },
  trialNote: { fontSize: 12, color: colors.textFaint, textAlign: 'center' },
  purchaseBtn: { borderRadius: radius.md, paddingVertical: 17, alignItems: 'center', marginTop: spacing.xs, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  purchaseBtnText: { color: colors.onPrimary, fontFamily: fonts.bold, fontSize: 16 },
  restoreBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  restoreBtnText: { fontSize: 14, fontFamily: fonts.semibold, color: colors.primary },
  privacyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  privacyText: { color: colors.textFaint, fontSize: 12 },
  privacyLink: { color: colors.textFaint, fontSize: 12, textDecorationLine: 'underline' },
  debugNote: { fontSize: 11, color: colors.textFaint, textAlign: 'center', marginTop: spacing.sm },
});
