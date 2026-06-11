import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getDecks, getCards, getAllProgress, getSettings, getStudySession, Deck } from '@/store/lingrow';
import { colors, fonts } from '@/theme';

const PRIMARY = colors.primary;

export default function DeckScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [totalCards, setTotalCards] = useState(0);
  const [learnedCount, setLearnedCount] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(5);
  const [availableCount, setAvailableCount] = useState(0);

  useEffect(() => {
    (async () => {
      const decks = await getDecks();
      const found = decks.find((d) => d.id === deckId);
      if (found) setDeck(found);

      const cards = await getCards(deckId);
      setTotalCards(cards.length);

      const allProgress = await getAllProgress();
      const cardIds = new Set(cards.map((c) => c.id));
      const learned = allProgress.filter((p) => cardIds.has(p.cardId) && p.repetitions > 0).length;
      setLearnedCount(learned);

      const s = await getSettings();
      setDailyGoal(s.dailyGoal);

      const session = await getStudySession(deckId);
      setAvailableCount(session.length);
    })();
  }, [deckId]);

  if (!deck) return null;

  const pct = totalCards > 0 ? Math.round((learnedCount / totalCards) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.title}>{deck.name}</Text>
        <Text style={styles.sub}>Programa de aprendizado</Text>

        {/* progress */}
        <View style={styles.card}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Progresso</Text>
            <Text style={styles.progressPct}>{pct}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${pct}%` as any }]} />
          </View>
          <Text style={styles.progressCount}>{learnedCount} / {totalCards} {totalCards === 1 ? 'card' : 'cards'} estudados</Text>
        </View>

        {/* study card */}
        <View style={styles.card}>
          <Text style={styles.deckName}>{deck.name}</Text>
          <Text style={styles.deckInfo}>
            {availableCount > 0 ? `${availableCount} disponíveis para estudar agora` : 'Você está em dia! Volte amanhã.'}
            {deckId === 'deck-1000-frases' ? ` · ${dailyGoal} novas por dia` : ''}
          </Text>
          <TouchableOpacity style={styles.studyBtn} onPress={() => router.push({ pathname: '/study/[deckId]', params: { deckId } })}>
            <Text style={styles.studyBtnText}>Estudar agora</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  backBtn: { marginBottom: 4 },
  title: { fontSize: 26, fontFamily: fonts.extrabold, color: PRIMARY },
  sub: { fontSize: 14, color: colors.textMuted },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, gap: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  progressPct: { fontSize: 16, fontFamily: fonts.bold, color: PRIMARY },
  progressBarBg: { height: 6, backgroundColor: colors.border, borderRadius: 3 },
  progressBarFill: { height: 6, backgroundColor: PRIMARY, borderRadius: 3 },
  progressCount: { fontSize: 13, color: colors.textMuted },
  deckName: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  deckInfo: { fontSize: 13, color: colors.textMuted },
  studyBtn: { backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  studyBtnText: { color: colors.surface, fontFamily: fonts.bold, fontSize: 15 },
});
