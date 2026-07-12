// ============================================================
// Lingrow — "Montando seu plano" (Story E6.1, FR-F1)
// Épico: docs/stories/epic-e6-maquina-conversao.md
// Posição no fluxo: onboarding passo 3 → ESTA TELA → primeira sessão.
// Fase 1: análise animada curta e HONESTA (cada linha corresponde a algo
// real que o app faz com as respostas). ≤2,5s, pulável por tap,
// respeita reduce-motion. Fase 2: o plano, 100% derivado do quiz —
// projeção é aritmética transparente (daily × 30), nada inventado.
// Textos FINAIS — não alterar sem @po.
// TODO [E2.3]: quando a primeira sessão personalizada existir, o CTA
// passa a navegar para study/[deckId] (5 frases por nível) em vez da home.
// ============================================================

import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Analytics } from '@/lib/analytics';
import { LearningGoal, LevelSelfReport } from '@/store/lingrow';
import { colors, fonts, radius, shadow, spacing } from '@/theme';

const ANALYSIS_STEPS = [
  'Analisando seu objetivo…',
  'Calibrando seu ponto de partida…',
  'Agendando suas revisões…',
];

const GOAL_HEADLINE: Record<LearningGoal, string> = {
  work: 'Inglês para carreira',
  travel: 'Inglês para o mundo',
  study: 'Inglês para provas',
  abroad: 'Inglês para viver fora',
  self: 'Inglês para você',
};

const LEVEL_LINE: Record<LevelSelfReport, string> = {
  zero: 'Do começo, do jeito certo',
  stuck: 'Direto no que destrava',
  fluency: 'Rumo à fluência',
};

function isGoal(v: unknown): v is LearningGoal {
  return v === 'work' || v === 'travel' || v === 'study' || v === 'abroad' || v === 'self';
}
function isLevel(v: unknown): v is LevelSelfReport {
  return v === 'zero' || v === 'stuck' || v === 'fluency';
}

export default function PlanRevealScreen() {
  const params = useLocalSearchParams<{ goal?: string; level?: string; daily?: string }>();
  const goal: LearningGoal = isGoal(params.goal) ? params.goal : 'self';
  const level: LevelSelfReport = isLevel(params.level) ? params.level : 'zero';
  const daily = [5, 10, 15].includes(Number(params.daily)) ? Number(params.daily) : 5;

  const [confirmed, setConfirmed] = useState(0); // quantas linhas da análise já confirmaram
  const [phase, setPhase] = useState<'analyzing' | 'plan'>('analyzing');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const skipped = useRef(false);

  const minutes = Math.round(daily * 0.6);
  const projection = daily * 30;

  useEffect(() => {
    Analytics.planRevealViewed(goal, level, daily);

    const localTimers = timers.current;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled || skipped.current) return;
      if (reduceMotion) {
        // sem coreografia: tudo confirmado, pausa breve, plano (NFR7)
        setConfirmed(ANALYSIS_STEPS.length);
        timers.current.push(setTimeout(() => setPhase('plan'), 800));
        return;
      }
      ANALYSIS_STEPS.forEach((_, i) => {
        timers.current.push(setTimeout(() => setConfirmed(i + 1), 700 * (i + 1)));
      });
      timers.current.push(setTimeout(() => setPhase('plan'), 2500));
    });

    return () => {
      cancelled = true;
      localTimers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skipAnalysis = () => {
    if (phase !== 'analyzing' || skipped.current) return;
    skipped.current = true;
    timers.current.forEach(clearTimeout);
    Analytics.planRevealSkippedAnimation();
    setConfirmed(ANALYSIS_STEPS.length);
    timers.current.push(setTimeout(() => setPhase('plan'), 250));
  };

  const continueToApp = () => {
    Analytics.planRevealContinue(goal, level, daily);
    // TODO [E2.3]: trocar pela primeira sessão personalizada (study/[deckId]
    // com sessionSize=5 e startPosition por nível) quando a story chegar.
    router.replace('/(tabs)');
  };

  if (phase === 'analyzing') {
    return (
      <Pressable style={styles.container} onPress={skipAnalysis} accessibilityLabel="Montando seu plano. Toque para pular a animação.">
        <SafeAreaView style={styles.analysisWrap}>
          <View style={styles.analysisIconWrap}>
            <Ionicons name="leaf" size={40} color={colors.primary} />
          </View>
          <Text style={styles.analysisTitle}>Montando seu plano</Text>
          <View style={styles.analysisSteps}>
            {ANALYSIS_STEPS.map((label, i) => {
              const done = confirmed > i;
              return (
                <View key={label} style={[styles.analysisRow, !done && styles.analysisRowPending]}>
                  <Ionicons
                    name={done ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={done ? colors.primary : colors.border}
                  />
                  <Text style={[styles.analysisText, done && styles.analysisTextDone]}>{label}</Text>
                </View>
              );
            })}
          </View>
        </SafeAreaView>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.planWrap}>
        <Text style={styles.planReady}>Seu plano está pronto.</Text>

        <View style={styles.planCard} accessibilityLabel={`Seu plano: ${GOAL_HEADLINE[goal]}. Ponto de partida: ${LEVEL_LINE[level]}. ${daily} frases por dia, aproximadamente ${minutes} minutos. No seu ritmo, cerca de ${projection} frases suas em 30 dias.`}>
          <View style={styles.planHeader}>
            <View style={styles.planMonogram}>
              <Ionicons name="leaf" size={18} color={colors.onPrimary} />
            </View>
            <Text style={styles.planBrand}>lingrow</Text>
          </View>

          <View style={styles.planRow}>
            <Text style={styles.planEmoji}>🎯</Text>
            <Text style={styles.planHeadline}>{GOAL_HEADLINE[goal]}</Text>
          </View>
          <View style={styles.planRow}>
            <Text style={styles.planEmoji}>📍</Text>
            <Text style={styles.planText}>Ponto de partida: {LEVEL_LINE[level]}</Text>
          </View>
          <View style={styles.planRow}>
            <Text style={styles.planEmoji}>📅</Text>
            <Text style={styles.planText}>{daily} frases por dia (~{minutes} min)</Text>
          </View>
          <View style={styles.planDivider} />
          <View style={styles.planRow}>
            <Text style={styles.planEmoji}>📈</Text>
            <Text style={styles.planText}>
              No seu ritmo: ~{projection} frases suas em 30 dias.{' '}
              <Text style={styles.planTextStrong}>E elas não somem.</Text>
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
          onPress={continueToApp}
          accessibilityLabel="Começar agora"
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>Começar agora</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  analysisWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl },
  analysisIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisTitle: { fontSize: 22, fontFamily: fonts.bold, color: colors.text },
  analysisSteps: { gap: spacing.md, marginTop: spacing.sm, alignSelf: 'stretch', paddingHorizontal: spacing.xl },
  analysisRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  analysisRowPending: { opacity: 0.45 },
  analysisText: { fontSize: 15, color: colors.textMuted, fontFamily: fonts.semibold },
  analysisTextDone: { color: colors.text },
  planWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.lg },
  planReady: {
    fontSize: 28,
    fontFamily: fonts.extrabold,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadow.card,
  },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  planMonogram: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBrand: { fontSize: 14, fontFamily: fonts.bold, color: colors.primary, letterSpacing: 0.5 },
  planRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  planEmoji: { fontSize: 18, marginTop: 1 },
  planHeadline: { flex: 1, fontSize: 20, fontFamily: fonts.extrabold, color: colors.text, letterSpacing: -0.3 },
  planText: { flex: 1, fontSize: 15, color: colors.text, lineHeight: 22 },
  planTextStrong: { fontFamily: fonts.bold, color: colors.primary },
  planDivider: { height: 1, backgroundColor: colors.borderSoft },
  cta: {
    paddingVertical: 16,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  ctaText: { color: colors.onPrimary, fontSize: 17, fontFamily: fonts.bold },
});
