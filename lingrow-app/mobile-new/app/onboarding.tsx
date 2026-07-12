// ============================================================
// Lingrow — Onboarding v2: promessa → ponte → quiz → método → meta
// Épico: docs/stories/epic-e2-onboarding-conversao.md (Story E2.2)
//
// Padrões adotados da referência Prequel (análise 2026-07-12):
//  - tela-ponte antes do quiz (micro-compromisso: "3 perguntas, 30 segundos")
//  - subtítulo em CADA pergunta dizendo o que aquela resposta muda de fato
//    (nada de "personalização" vaga: cada frase abaixo é verdade verificável)
//  - interstício de valor no meio do quiz (o nosso é o MÉTODO, não features)
//  - feedback visual de seleção antes de avançar
// NÃO adotado: prova social numérica/imprensa — não temos nota, usuários nem
// citação reais. Inventar isso violaria o Artigo IV e a revisão da Apple.
//
// Respostas salvas ao FINAL: falha de rede no meio não deixa perfil pela metade.
// Textos FINAIS — não alterar sem @po.
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

/** Passos do fluxo. Só GOAL/LEVEL/DAILY contam na barra de progresso. */
enum Step {
  Promise,
  Bridge,
  Goal,
  Level,
  Method,
  Daily,
}

const ANSWERED_AT: Partial<Record<Step, number>> = {
  [Step.Goal]: 0,
  [Step.Level]: 1,
  [Step.Method]: 2,
  [Step.Daily]: 2,
};
const TOTAL_QUESTIONS = 3;

/** Delay do feedback de seleção antes de avançar (Prequel: a escolha "acende"). */
const SELECT_FEEDBACK_MS = 180;

export default function OnboardingScreen() {
  const [step, setStep] = useState<Step>(Step.Promise);
  const [goal, setGoal] = useState<LearningGoal | null>(null);
  const [level, setLevel] = useState<LevelSelfReport | null>(null);
  const [picked, setPicked] = useState<string | null>(null); // realce da opção tocada
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Analytics.onboardingStarted();
  }, []);

  // toda escolha "acende" antes de avançar — confirma o toque sem custo de tempo real
  const choose = (key: string, then: () => void) => {
    if (picked) return; // guard de duplo-toque
    setPicked(key);
    setTimeout(() => {
      setPicked(null);
      then();
    }, SELECT_FEEDBACK_MS);
  };

  const pickGoal = (g: LearningGoal) =>
    choose(g, () => {
      setGoal(g);
      Analytics.onboardingStepCompleted(1, g);
      setStep(Step.Level);
    });

  const pickLevel = (l: LevelSelfReport) =>
    choose(l, () => {
      setLevel(l);
      Analytics.onboardingStepCompleted(2, l);
      setStep(Step.Method);
    });

  const pickDaily = (daily: number) =>
    choose(String(daily), () => void finish(daily));

  const finish = async (daily: number) => {
    if (saving) return;
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
    router.replace({
      pathname: '/plan-reveal',
      params: { goal: goal ?? 'self', level: level ?? 'zero', daily: String(daily) },
    } as unknown as Href);
  };

  const back = () => {
    if (step === Step.Level) setStep(Step.Goal);
    else if (step === Step.Method) setStep(Step.Level);
    else if (step === Step.Daily) setStep(Step.Method);
    else if (step === Step.Goal) setStep(Step.Bridge);
    else if (step === Step.Bridge) setStep(Step.Promise);
  };

  const answered = ANSWERED_AT[step] ?? 0;
  const showProgress = step >= Step.Goal;

  return (
    <SafeAreaView style={styles.container}>
      {showProgress && (
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
            <View
              style={[styles.progressFill, { width: `${(answered / TOTAL_QUESTIONS) * 100}%` }]}
            />
          </View>
        </View>
      )}

      {/* ── Promessa ─────────────────────────────────────────── */}
      {step === Step.Promise && (
        <View style={styles.slide}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="leaf" size={52} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Inglês que não some.</Text>
          <Text style={styles.heroSub}>
            Aqui, o que você aprende fica. O app garante — cientificamente.
          </Text>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => setStep(Step.Bridge)}
            activeOpacity={0.85}
            accessibilityLabel="Começar"
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>Começar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Ponte: prepara para o quiz (padrão Prequel) ───────── */}
      {step === Step.Bridge && (
        <View style={styles.slide}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="compass-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Vamos montar o seu plano.</Text>
          <Text style={styles.heroSub}>
            3 perguntas, 30 segundos. Nenhum currículo genérico — o Lingrow começa
            de onde você está.
          </Text>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => {
              Analytics.onboardingInterstitialContinue('bridge');
              setStep(Step.Goal);
            }}
            activeOpacity={0.85}
            accessibilityLabel="Personalizar meu plano"
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>Personalizar meu plano</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Pergunta 1: objetivo ──────────────────────────────── */}
      {step === Step.Goal && (
        <View style={styles.slide}>
          <Text style={styles.question}>O que o inglês vai destravar pra você?</Text>
          <Text style={styles.questionWhy}>Isso define o foco do seu plano.</Text>
          <View style={styles.options}>
            {GOALS.map((g) => (
              <OptionCard
                key={g.key}
                emoji={g.emoji}
                label={g.label}
                selected={picked === g.key}
                onPress={() => pickGoal(g.key)}
              />
            ))}
          </View>
        </View>
      )}

      {/* ── Pergunta 2: nível ─────────────────────────────────── */}
      {step === Step.Level && (
        <View style={styles.slide}>
          <Text style={styles.question}>Onde você está hoje?</Text>
          <Text style={styles.questionWhy}>
            Isso define por onde você começa — sem julgamento, o método funciona em
            qualquer ponto.
          </Text>
          <View style={styles.options}>
            {LEVELS.map((l) => (
              <OptionCard
                key={l.key}
                emoji={l.emoji}
                label={l.label}
                selected={picked === l.key}
                onPress={() => pickLevel(l.key)}
              />
            ))}
          </View>
        </View>
      )}

      {/* ── Interstício de valor: o MÉTODO (padrão Prequel) ───── */}
      {step === Step.Method && (
        <View style={styles.slide}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="time-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>O app age antes do esquecimento.</Text>
          <Text style={styles.heroSub}>
            Cada frase volta pra você no momento exato em que ia escapar da sua
            memória. É por isso que aqui o inglês não some.
          </Text>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => {
              Analytics.onboardingInterstitialContinue('method');
              setStep(Step.Daily);
            }}
            activeOpacity={0.85}
            accessibilityLabel="Faz sentido, continuar"
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>Faz sentido</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Pergunta 3: meta diária ───────────────────────────── */}
      {step === Step.Daily && (
        <View style={styles.slide}>
          <Text style={styles.question}>Quanto cabe no seu dia?</Text>
          <Text style={styles.questionWhy}>Isso define seu ritmo e a hora do lembrete.</Text>
          <View style={styles.options}>
            {DAILY_GOALS.map((d) => (
              <OptionCard
                key={d.value}
                label={d.label}
                trailing={d.sub}
                selected={picked === String(d.value)}
                disabled={saving}
                onPress={() => pickDaily(d.value)}
                accessibilityLabel={`${d.label}, aproximadamente ${d.sub.replace('~', '')}`}
              />
            ))}
          </View>
          <Text style={styles.footnote}>Constância vence intensidade. Dá pra mudar depois.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function OptionCard({
  emoji,
  label,
  trailing,
  selected,
  disabled,
  onPress,
  accessibilityLabel,
}: {
  emoji?: string;
  label: string;
  trailing?: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.optionCard, selected && styles.optionCardSelected]}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
    >
      {emoji ? <Text style={styles.optionEmoji}>{emoji}</Text> : null}
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
      {trailing ? <Text style={styles.optionTrailing}>{trailing}</Text> : null}
    </TouchableOpacity>
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

  slide: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.md },

  heroIconWrap: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontSize: 30,
    fontFamily: fonts.extrabold,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  heroSub: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },

  question: { fontSize: 26, fontFamily: fonts.bold, color: colors.text, letterSpacing: -0.3, lineHeight: 33 },
  questionWhy: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginTop: -spacing.xs },

  options: { gap: spacing.sm, marginTop: spacing.sm },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    ...shadow.card,
  },
  optionCardSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionEmoji: { fontSize: 24 },
  optionLabel: { flex: 1, fontSize: 16, fontFamily: fonts.semibold, color: colors.text },
  optionLabelSelected: { color: colors.primary },
  optionTrailing: { fontSize: 14, color: colors.textMuted },

  footnote: { fontSize: 13, color: colors.textFaint, textAlign: 'center', marginTop: spacing.sm },

  cta: {
    marginTop: spacing.md,
    paddingVertical: 17,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  ctaText: { color: colors.onPrimary, fontSize: 17, fontFamily: fonts.bold },
});
