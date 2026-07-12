// ============================================================
// Lingrow — Onboarding v2: 4 passos, 1 toque cada (Story E2.2)
// Épico: docs/stories/epic-e2-onboarding-conversao.md
// Textos FINAIS especificados na story — não alterar sem @po.
// Respostas salvas ao FINAL (não por passo): falha de rede no meio
// não pode deixar perfil pela metade; falha ao salvar prossegue
// (retry natural: onboardingDone segue false no server e a próxima
// abertura volta aqui — padrão do finish() da v1).
// ============================================================

import { Href, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { saveSettings, LearningGoal, LevelSelfReport } from '@/store/lingrow';
import { Analytics, ONBOARDING_VERSION } from '@/lib/analytics';
import { colors, fonts, radius, shadow, spacing } from '@/theme';

const GOALS: { key: LearningGoal; emoji: string; label: string }[] = [
  { key: 'work', emoji: '💼', label: 'Trabalho e carreira' },
  { key: 'travel', emoji: '✈️', label: 'Viagem' },
  { key: 'study', emoji: '🎓', label: 'Estudos e provas' },
  { key: 'abroad', emoji: '🌍', label: 'Morar fora' },
  { key: 'self', emoji: '💪', label: 'Por mim mesmo' },
];

const LEVELS: { key: LevelSelfReport; emoji: string; label: string }[] = [
  { key: 'zero', emoji: '🌱', label: 'Começando do zero' },
  { key: 'stuck', emoji: '😤', label: 'Entendo, mas travo na hora de usar' },
  { key: 'fluency', emoji: '🚀', label: 'Já me viro — quero chegar na fluência' },
];

const DAILY_GOALS: { value: number; label: string; sub: string }[] = [
  { value: 5, label: '5 frases', sub: '~3 min' },
  { value: 10, label: '10 frases', sub: '~6 min' },
  { value: 15, label: '15 frases', sub: '~9 min' },
];

const TOTAL_STEPS = 3; // passos com pergunta (1-3); o passo 0 é a promessa

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<LearningGoal | null>(null);
  const [level, setLevel] = useState<LevelSelfReport | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Analytics.onboardingStarted();
  }, []);

  const pickGoal = (g: LearningGoal) => {
    setGoal(g);
    Analytics.onboardingStepCompleted(1, g);
    setStep(2);
  };

  const pickLevel = (l: LevelSelfReport) => {
    setLevel(l);
    Analytics.onboardingStepCompleted(2, l);
    setStep(3);
  };

  const pickDaily = async (daily: number) => {
    if (saving) return; // guard de duplo-toque
    setSaving(true);
    Analytics.onboardingStepCompleted(3, String(daily));
    try {
      await saveSettings({
        goal,
        levelSelfreport: level,
        dailyGoal: daily,
        onboardingDone: true,
        onboardingVersion: ONBOARDING_VERSION,
      });
    } catch {
      // falha de rede ao salvar: prossegue — usuário não fica preso (AC4)
    }
    Analytics.onboardingCompleted(goal, level, daily);
    // typed routes só incluem /plan-reveal após o próximo `expo start` regenerar
    // .expo/types — o cast evita acoplar o typecheck ao arquivo gerado
    router.replace({
      pathname: '/plan-reveal',
      params: { goal: goal ?? 'self', level: level ?? 'zero', daily: String(daily) },
    } as unknown as Href);
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <SafeAreaView style={styles.container}>
      {/* barra de progresso fina no topo (só nos passos 1-3) */}
      {step > 0 && (
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={back}
            style={styles.backBtn}
            accessibilityLabel="Voltar ao passo anterior"
            accessibilityRole="button"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
          </View>
        </View>
      )}

      {step === 0 && (
        <View style={styles.slide}>
          <View style={styles.promiseIconWrap}>
            <Ionicons name="leaf" size={52} color={colors.primary} />
          </View>
          <Text style={styles.promiseTitle}>Inglês que não some.</Text>
          <Text style={styles.promiseSub}>
            Aqui, o que você aprende fica. O app garante — cientificamente.
          </Text>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => setStep(1)}
            activeOpacity={0.85}
            accessibilityLabel="Começar"
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>Começar</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 1 && (
        <View style={styles.slide}>
          <Text style={styles.question}>O que o inglês vai destravar pra você?</Text>
          <View style={styles.options}>
            {GOALS.map((g) => (
              <TouchableOpacity
                key={g.key}
                style={styles.optionCard}
                onPress={() => pickGoal(g.key)}
                activeOpacity={0.85}
                accessibilityLabel={g.label}
                accessibilityRole="button"
              >
                <Text style={styles.optionEmoji}>{g.emoji}</Text>
                <Text style={styles.optionLabel}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {step === 2 && (
        <View style={styles.slide}>
          <Text style={styles.question}>Onde você está hoje?</Text>
          <Text style={styles.questionSub}>
            (sem julgamento — o método funciona em qualquer ponto)
          </Text>
          <View style={styles.options}>
            {LEVELS.map((l) => (
              <TouchableOpacity
                key={l.key}
                style={styles.optionCard}
                onPress={() => pickLevel(l.key)}
                activeOpacity={0.85}
                accessibilityLabel={l.label}
                accessibilityRole="button"
              >
                <Text style={styles.optionEmoji}>{l.emoji}</Text>
                <Text style={styles.optionLabel}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {step === 3 && (
        <View style={styles.slide}>
          <Text style={styles.question}>Quanto cabe no seu dia?</Text>
          <View style={styles.options}>
            {DAILY_GOALS.map((d) => (
              <TouchableOpacity
                key={d.value}
                style={styles.optionCard}
                onPress={() => pickDaily(d.value)}
                activeOpacity={0.85}
                disabled={saving}
                accessibilityLabel={`${d.label}, aproximadamente ${d.sub.replace('~', '')}`}
                accessibilityRole="button"
              >
                <Text style={styles.optionLabel}>{d.label}</Text>
                <Text style={styles.optionSub}>{d.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.footnote}>Constância vence intensidade. Dá pra mudar depois.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  backBtn: { padding: 2 },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: colors.primary },
  slide: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  promiseIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  promiseTitle: {
    fontSize: 32,
    fontFamily: fonts.extrabold,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  promiseSub: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  question: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.text,
    letterSpacing: -0.3,
  },
  questionSub: { fontSize: 14, color: colors.textMuted, marginTop: -spacing.sm },
  options: { gap: spacing.sm, marginTop: spacing.sm },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    ...shadow.card,
  },
  optionEmoji: { fontSize: 24 },
  optionLabel: { flex: 1, fontSize: 16, fontFamily: fonts.semibold, color: colors.text },
  optionSub: { fontSize: 14, color: colors.textMuted },
  footnote: { fontSize: 13, color: colors.textFaint, textAlign: 'center', marginTop: spacing.sm },
  cta: {
    marginTop: spacing.md,
    paddingVertical: 16,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  ctaText: { color: colors.onPrimary, fontSize: 17, fontFamily: fonts.bold },
});
