// ============================================================
// Lingrow — "Meu Inglês" (painel de retenção, benefício Premium)
// Recomendação: docs/monetization-strategy-2026-07.md §3
// Gancho de PERMANÊNCIA da assinatura (não de ativação) — usa dados que
// já existem em card_progress, custo de IA zero. Reforça a promessa
// central da marca ("inglês que não some") com números reais.
// ============================================================

import { router, useFocusEffect, type Href } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { usePremium } from '@/lib/premium';
import { getAllProgress, getSettings } from '@/store/lingrow';
import { colors, fonts, radius, shadow, spacing } from '@/theme';

interface Stats {
  learned: number;
  retentionPct: number;
  atRisk: number;
  streak: number;
}

export default function MeuInglesScreen() {
  const { isPremium, loading: premiumLoading } = usePremium();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!isPremium) {
        setLoading(false);
        return;
      }
      (async () => {
        setLoading(true);
        try {
          const [progress, settings] = await Promise.all([getAllProgress(), getSettings()]);
          const learnedCards = progress.filter((p) => p.repetitions > 0);
          const now = new Date();
          const atRisk = learnedCards.filter((p) => p.nextReview && new Date(p.nextReview) <= now).length;
          const retentionPct = learnedCards.length > 0
            ? Math.round(((learnedCards.length - atRisk) / learnedCards.length) * 100)
            : 100;

          setStats({
            learned: learnedCards.length,
            retentionPct,
            atRisk,
            streak: settings.streak,
          });
        } catch {
          setStats(null);
        } finally {
          setLoading(false);
        }
      })();
    }, [isPremium])
  );

  if (premiumLoading || loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="leaf" size={32} color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isPremium) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Voltar" accessibilityRole="button">
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.lockedIconWrap}>
            <Ionicons name="lock-closed" size={28} color={colors.primary} />
          </View>
          <Text style={styles.title}>Meu Inglês</Text>
          <Text style={styles.sub}>
            Veja quanto do seu inglês está retido de verdade, quais frases correm risco de sumir e
            acompanhe sua evolução real — não só uma sequência de dias.
          </Text>

          <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/paywall' as Href)}>
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.unlockBtn}
            >
              <Ionicons name="sparkles" size={18} color={colors.onPrimary} />
              <Text style={styles.unlockBtnText}>Desbloquear com o Premium</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Voltar" accessibilityRole="button">
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>

        <Text style={styles.title}>Meu Inglês</Text>
        <Text style={styles.sub}>Seu inglês não some — aqui está a prova.</Text>

        <View style={styles.heroCard}>
          <Text style={styles.heroPct}>{stats?.retentionPct ?? 100}%</Text>
          <Text style={styles.heroLabel}>retido hoje</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="book-outline" size={22} color={colors.primary} />
            <Text style={styles.statNum}>{stats?.learned ?? 0}</Text>
            <Text style={styles.statLabel}>frases suas</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flame-outline" size={22} color={colors.accent} />
            <Text style={styles.statNum}>{stats?.streak ?? 0}</Text>
            <Text style={styles.statLabel}>dias seguidos</Text>
          </View>
        </View>

        {stats && stats.atRisk > 0 ? (
          <View style={styles.riskCard}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.accent} />
            <Text style={styles.riskText}>
              <Text style={{ fontFamily: fonts.bold }}>{stats.atRisk} frase{stats.atRisk !== 1 ? 's' : ''}</Text>
              {' '}em risco de esquecimento — reveja hoje para não perder o que já é seu.
            </Text>
          </View>
        ) : (
          <View style={styles.okCard}>
            <Ionicons name="checkmark-done" size={20} color={colors.success} />
            <Text style={styles.okText}>Nada em risco agora. Continue assim.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.xl, gap: spacing.md, paddingBottom: 40 },
  backBtn: { marginBottom: spacing.xs },
  title: { fontSize: 26, fontFamily: fonts.extrabold, color: colors.primary, letterSpacing: -0.4 },
  sub: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  lockedIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  unlockBtn: { flexDirection: 'row', borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md },
  unlockBtnText: { color: colors.onPrimary, fontFamily: fonts.bold, fontSize: 15 },
  heroCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.borderSoft, ...shadow.card, marginTop: spacing.sm },
  heroPct: { fontSize: 48, fontFamily: fonts.extrabold, color: colors.primary },
  heroLabel: { fontSize: 14, color: colors.textMuted, fontFamily: fonts.semibold },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.borderSoft, ...shadow.soft },
  statNum: { fontSize: 24, fontFamily: fonts.extrabold, color: colors.text },
  statLabel: { fontSize: 12, color: colors.textMuted },
  riskCard: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: spacing.md, alignItems: 'flex-start' },
  riskText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 19 },
  okCard: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.successSoft, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  okText: { flex: 1, fontSize: 13, color: colors.successDark },
});
