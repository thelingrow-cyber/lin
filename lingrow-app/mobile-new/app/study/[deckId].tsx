import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

import {
  Card,
  computeNextReview,
  getDecks,
  getProgress,
  getStudySession,
  saveProgress,
  updateStreak,
  SRSAnswer,
} from '@/store/lingrow';
import { Analytics } from '@/lib/analytics';
import { requestNotificationPermission, scheduleNextReviewNotification, hasNotificationPermission } from '@/lib/notifications';
import { colors, fonts } from '@/theme';

const PRIMARY = colors.primary;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightedText({ text, keyword, style }: { text: string; keyword?: string; style: any }) {
  if (!keyword) return <Text style={style}>{text}</Text>;
  const parts = text.split(new RegExp(`(${escapeRegExp(keyword)})`, 'gi'));
  return (
    <Text style={style}>
      {parts.map((p, i) =>
        p.toLowerCase() === keyword.toLowerCase() ? (
          <Text key={i} style={{ color: PRIMARY, fontFamily: fonts.bold }}>{p}</Text>
        ) : (
          p
        )
      )}
    </Text>
  );
}

export default function StudyScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const [deckName, setDeckName] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [studied, setStudied] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const swipeBgAnim = useRef(new Animated.Value(0)).current;

  const loadSession = useCallback(async () => {
    setLoading(true);
    try {
      const decks = await getDecks();
      const deck = decks.find((d) => d.id === deckId);
      if (deck) setDeckName(deck.name);
      const session = await getStudySession(deckId);
      setCards(session);
      setIndex(0);
      setFlipped(false);
      setDone(false);
      setStudied(0);
      if (session.length > 0) {
        Analytics.reviewSessionStarted(deckId, deck?.name ?? '', session.length);
        const { cancelAllScheduledNotificationsAsync } = await import('expo-notifications');
        void cancelAllScheduledNotificationsAsync();
      }
      flipAnim.setValue(0);
      swipeAnim.setValue(0);
      swipeBgAnim.setValue(0);
    } catch (e: any) {
      Alert.alert('Erro ao carregar sessão', e.message ?? 'Verifique sua conexão e tente novamente.');
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => { void loadSession(); }, [loadSession]);

  const current = cards[index];
  const total = cards.length;

  const flip = () => {
    Animated.spring(flipAnim, { toValue: flipped ? 0 : 1, useNativeDriver: true }).start();
    setFlipped(!flipped);
  };

  const answer = async (a: SRSAnswer) => {
    if (!current || answering) return;
    setAnswering(true);

    try {
      // direção: again/hard = esquerda (-1), good/easy = direita (+1)
      const dir = (a === 'again' || a === 'hard') ? -1 : 1;
      const shake = dir * 18;

      swipeBgAnim.setValue(dir);

      await new Promise<void>((resolve) => {
        Animated.sequence([
          Animated.timing(swipeAnim, { toValue: shake, duration: 80, useNativeDriver: true }),
          Animated.timing(swipeAnim, { toValue: -shake * 0.6, duration: 70, useNativeDriver: true }),
          Animated.timing(swipeAnim, { toValue: shake * 0.4, duration: 60, useNativeDriver: true }),
          Animated.timing(swipeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start(() => resolve());
      });

      swipeBgAnim.setValue(0);

      try {
        const progress = await getProgress(current.id);
        const next = computeNextReview(progress, a);
        await saveProgress(next);
      } catch (e: any) {
        Alert.alert('Erro ao salvar progresso', e.message ?? 'Tente novamente.');
        return;
      }

      swipeAnim.setValue(0);

      Analytics.cardReviewed(deckId, a, index);

      const nextIndex = index + 1;
      if (nextIndex >= total) {
        // best-effort: o progresso do card já foi salvo acima; uma falha aqui
        // não deve travar a tela de conclusão da sessão.
        try {
          await updateStreak();
        } catch {
          // streak não atualizou — próxima sessão tenta de novo
        }
        setStudied(total);
        setDone(true);
        Analytics.reviewSessionCompleted(deckId, deckName, total);
        await requestNotificationPermission();
        void scheduleNextReviewNotification();
      } else {
        setIndex(nextIndex);
        setFlipped(false);
        flipAnim.setValue(0);
        setStudied(nextIndex);
      }
    } finally {
      setAnswering(false);
    }
  };

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.doneContainer}>
          <View style={styles.doneIconWrap}>
            <Ionicons name="trophy" size={36} color={colors.accent} />
          </View>
          <Text style={styles.doneTitle}>Sessão concluída</Text>
          <Text style={styles.doneSub}>Você estudou <Text style={{ color: PRIMARY, fontFamily: fonts.bold }}>{studied} frases</Text> hoje.</Text>
          <Text style={styles.doneMotivation}>Você está construindo um hábito poderoso!</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => void loadSession()}>
            <Text style={styles.doneBtnText}>Continuar estudando</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.doneSecondaryBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.doneSecondaryText}>Voltar para o início</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.doneContainer}>
          <Ionicons name="hourglass-outline" size={40} color={colors.textFaint} />
          <Text style={styles.doneTitle}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!current) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.doneContainer}>
          <View style={[styles.doneIconWrap, { backgroundColor: colors.successSoft }]}>
            <Ionicons name="checkmark-done" size={36} color={colors.success} />
          </View>
          <Text style={styles.doneTitle}>Nada para estudar</Text>
          <Text style={styles.doneSub}>Você está em dia! Volte amanhã para novos cards.</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.doneBtnText}>Ir para o início</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const progressWidth = total > 0 ? ((index / total) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={async () => {
            if (!done && cards.length > 0) {
              if (index > 0) Analytics.reviewSessionAbandoned(deckId, index, total);
              const permitted = await hasNotificationPermission();
              if (permitted) void scheduleNextReviewNotification();
            }
            router.back();
          }}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color={colors.textMuted} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerDeck}>{deckName}</Text>
          <Text style={styles.headerCount}>{index + 1} / {total}</Text>
        </View>
        <TouchableOpacity
          onPress={() => { setIndex(0); setFlipped(false); flipAnim.setValue(0); }}
          accessibilityLabel="Reiniciar sessão de estudo"
          accessibilityRole="button"
        >
          <Ionicons name="refresh" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* progress bar */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progressWidth}%` as any }]} />
      </View>

      {/* card */}
      <View style={styles.cardArea}>
        {/* swipe color overlay */}
        <Animated.View pointerEvents="none" style={[
          styles.swipeOverlay,
          {
            backgroundColor: swipeBgAnim.interpolate({
              inputRange: [-1, 0, 1],
              outputRange: ['rgba(239,68,68,0.15)', 'rgba(0,0,0,0)', 'rgba(16,185,129,0.15)'],
            }),
            opacity: swipeAnim.interpolate({
              inputRange: [-500, -50, 0, 50, 500],
              outputRange: [1, 1, 0, 1, 1],
            }),
          }
        ]} />
        {/* front */}
        <Animated.View style={[styles.flashcard, { transform: [{ rotateY: frontRotate }, { translateX: swipeAnim }] }, !flipped && styles.cardVisible, flipped && styles.cardHidden]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardSide}>FRENTE</Text>
            <TouchableOpacity
              style={styles.audioBtn}
              onPress={() => Speech.speak(current.front, { language: 'en-US' })}
              accessibilityLabel="Ouvir pronúncia em inglês"
              accessibilityRole="button"
            >
              <Ionicons name="volume-medium-outline" size={20} color={PRIMARY} />
            </TouchableOpacity>
          </View>
          <View style={styles.cardContent}>
            <HighlightedText text={current.front} keyword={current.keyword} style={styles.cardText} />
            <View style={styles.langBadge}>
              <Text style={styles.langBadgeText}>🇬🇧 Inglês</Text>
            </View>
            <Text style={styles.cardHint}>Clique em &quot;Mostrar Tradução&quot; para ver a resposta</Text>
          </View>
        </Animated.View>

        {/* back */}
        <Animated.View style={[styles.flashcard, styles.flashcardBack, { transform: [{ rotateY: backRotate }, { translateX: swipeAnim }] }, flipped && styles.cardVisible, !flipped && styles.cardHidden]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardSide}>VERSO</Text>
            <TouchableOpacity
              style={styles.audioBtn}
              onPress={() => Speech.speak(current.front, { language: 'en-US' })}
              accessibilityLabel="Ouvir pronúncia em inglês"
              accessibilityRole="button"
            >
              <Ionicons name="volume-medium-outline" size={20} color={PRIMARY} />
            </TouchableOpacity>
          </View>
          <View style={styles.enRow}>
            <View style={styles.enBadge}><Text style={styles.enBadgeText}>EN</Text></View>
            <HighlightedText text={current.front} keyword={current.keyword} style={styles.cardTextSmall} />
          </View>
          <View style={styles.ptRow}>
            <View style={styles.ptBadge}><Text style={styles.ptBadgeText}>PT</Text></View>
            <HighlightedText text={current.back} keyword={current.keywordPt} style={styles.cardTextBold} />
          </View>
          {current.keyword && current.keywordPt && (
            <View style={styles.tipRow}>
              <Ionicons name="bulb-outline" size={16} color={colors.accent} />
              <Text style={styles.tipText}>{current.keyword} — {current.keywordPt}</Text>
            </View>
          )}
        </Animated.View>
      </View>

      {/* action buttons */}
      {!flipped ? (
        <TouchableOpacity style={styles.showBtn} onPress={flip}>
          <Text style={styles.showBtnText}>Mostrar Tradução</Text>
        </TouchableOpacity>
      ) : (
        <SRSButtons card={current} onAnswer={answer} disabled={answering} />
      )}
    </SafeAreaView>
  );
}

function SRSButtons({ card, onAnswer, disabled }: { card: Card; onAnswer: (a: SRSAnswer) => void; disabled?: boolean }) {
  return (
    <View style={styles.srsGrid}>
      <TouchableOpacity
        style={[styles.srsBtn, styles.srsBtnAgain]}
        onPress={() => onAnswer('again')}
        disabled={disabled}
        accessibilityLabel="Novamente — revisar em menos de 1 minuto"
        accessibilityRole="button"
      >
        <View style={[styles.srsIcon, { backgroundColor: colors.danger }]}>
          <Ionicons name="close-circle" size={24} color={colors.surface} />
        </View>
        <Text style={[styles.srsBtnLabel, { color: colors.danger }]}>Novamente</Text>
        <Text style={styles.srsBtnTime}>{'< 1 min'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.srsBtn, styles.srsBtnHard]}
        onPress={() => onAnswer('hard')}
        disabled={disabled}
        accessibilityLabel="Difícil — repete em breve"
        accessibilityRole="button"
      >
        <View style={[styles.srsIcon, { backgroundColor: colors.accent }]}>
          <Ionicons name="alert-circle" size={24} color={colors.surface} />
        </View>
        <Text style={[styles.srsBtnLabel, { color: colors.accent }]}>Difícil</Text>
        <Text style={styles.srsBtnTime}>Repete</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.srsBtn, styles.srsBtnGood]}
        onPress={() => onAnswer('good')}
        disabled={disabled}
        accessibilityLabel="Bom — avança para o próximo card"
        accessibilityRole="button"
      >
        <View style={[styles.srsIcon, { backgroundColor: colors.success }]}>
          <Ionicons name="checkmark-circle" size={24} color={colors.surface} />
        </View>
        <Text style={[styles.srsBtnLabel, { color: colors.success }]}>Bom</Text>
        <Text style={styles.srsBtnTime}>Próximo</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.srsBtn, styles.srsBtnEasy]}
        onPress={() => onAnswer('easy')}
        disabled={disabled}
        accessibilityLabel="Fácil — revisão em intervalo mais longo"
        accessibilityRole="button"
      >
        <View style={[styles.srsIcon, { backgroundColor: PRIMARY }]}>
          <Ionicons name="sparkles" size={24} color={colors.surface} />
        </View>
        <Text style={[styles.srsBtnLabel, { color: PRIMARY }]}>Fácil</Text>
        <Text style={styles.srsBtnTime}>4 dias</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerDeck: { fontSize: 13, color: colors.textMuted, fontFamily: fonts.medium },
  headerCount: { fontSize: 15, fontFamily: fonts.bold, color: colors.text },
  progressBg: { height: 4, backgroundColor: colors.border, marginHorizontal: 16, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: PRIMARY, borderRadius: 2 },
  cardArea: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', padding: 16, paddingTop: 8 },
  swipeOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 20, zIndex: 10 },
  flashcard: {
    width: '100%',
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    backfaceVisibility: 'hidden',
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  flashcardBack: { position: 'absolute' },
  cardVisible: { opacity: 1 },
  cardHidden: { opacity: 0 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  cardSide: { fontSize: 11, fontFamily: fonts.bold, color: colors.textFaint, letterSpacing: 1 },
  audioBtn: { padding: 4 },
  cardText: { fontSize: 24, fontFamily: fonts.bold, color: colors.text, textAlign: 'center', lineHeight: 34 },
  cardTextSmall: { fontSize: 17, color: colors.text },
  cardTextBold: { fontSize: 20, fontFamily: fonts.bold, color: colors.text },
  langBadge: { alignSelf: 'center', backgroundColor: colors.primarySoft, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  langBadgeText: { fontSize: 13, color: PRIMARY, fontFamily: fonts.semibold },
  cardHint: { fontSize: 13, color: colors.textFaint, textAlign: 'center' },
  enRow: { flexDirection: 'column', gap: 8 },
  ptRow: { flexDirection: 'column', gap: 8 },
  enBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.infoSoft, alignItems: 'center', justifyContent: 'center' },
  enBadgeText: { fontSize: 12, fontFamily: fonts.bold, color: colors.info },
  ptBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' },
  ptBadgeText: { fontSize: 12, fontFamily: fonts.bold, color: colors.success },
  tipRow: { backgroundColor: colors.borderSoft, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipText: { fontSize: 13, color: colors.textMuted, flex: 1 },
  showBtn: { marginHorizontal: 16, marginBottom: 24, backgroundColor: PRIMARY, borderRadius: 50, paddingVertical: 20, alignItems: 'center' },
  showBtnText: { color: colors.surface, fontFamily: fonts.bold, fontSize: 17 },
  srsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10, marginBottom: 12 },
  srsBtn: { width: '47%', borderRadius: 16, padding: 18, alignItems: 'center', gap: 8 },
  srsBtnAgain: { backgroundColor: colors.dangerSoft },
  srsBtnHard: { backgroundColor: colors.accentSoft },
  srsBtnGood: { backgroundColor: colors.successSoft },
  srsBtnEasy: { backgroundColor: colors.primarySoft },
  srsIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  srsBtnLabel: { fontSize: 15, fontFamily: fonts.bold },
  srsBtnTime: { fontSize: 12, color: colors.textFaint },
  doneContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  doneIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 28, fontFamily: fonts.extrabold, color: colors.text },
  doneSub: { fontSize: 16, color: colors.textMuted, textAlign: 'center' },
  doneMotivation: { fontSize: 15, color: colors.textMuted, fontStyle: 'italic', textAlign: 'center' },
  doneBtn: { width: '100%', backgroundColor: PRIMARY, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  doneBtnText: { color: colors.surface, fontFamily: fonts.bold, fontSize: 17 },
  doneSecondaryBtn: { width: '100%', borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  doneSecondaryText: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
});
