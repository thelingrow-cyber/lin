import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getDecks, getCards, getAllProgress, Deck } from '@/store/lingrow';
import { SENTENCES, DECK_1000 } from '@/data/sentences';

const PRIMARY = '#7C3AED';

export default function RevisarScreen() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [reviewByDeck, setReviewByDeck] = useState<Record<string, number>>({});
  const [totalReview, setTotalReview] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
    const [allDecks, allCards, allProgress] = await Promise.all([
      getDecks(),
      getCards(),
      getAllProgress(),
    ]);
    const now = new Date();

    const counts: Record<string, number> = {};
    let total = 0;

    const studiedIds = new Set(allProgress.map((p) => p.cardId));
    const builtinCardIds = new Set(SENTENCES.map((s) => `card-builtin-${s.position}`));

    for (const deck of allDecks) {
      const isBuiltIn = deck.id === DECK_1000.id;
      let due: number;
      let newUnseen: number;

      if (isBuiltIn) {
        due = allProgress.filter(
          (p) => builtinCardIds.has(p.cardId) && p.nextReview && new Date(p.nextReview) <= now
        ).length;
        newUnseen = 0;
      } else {
        const cards = allCards.filter((c) => c.deckId === deck.id);
        const cardIds = new Set(cards.map((c) => c.id));
        due = allProgress.filter(
          (p) => cardIds.has(p.cardId) && p.nextReview && new Date(p.nextReview) <= now
        ).length;
        newUnseen = cards.filter((c) => !studiedIds.has(c.id)).length;
      }

      const count = due + newUnseen;
      counts[deck.id] = count;
      total += count;
    }

    setDecks(allDecks);
    setReviewByDeck(counts);
    setTotalReview(total);
    } catch (e: any) {
      Alert.alert('Erro ao carregar revisões', e.message ?? 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 32 }}>📚</Text>
          <Text style={{ color: PRIMARY, fontWeight: '700', marginTop: 12, fontSize: 16 }}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Revisar</Text>
        <Text style={styles.sub}>Seus cards para revisar hoje</Text>

        {totalReview === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyTitle}>Tudo em dia!</Text>
            <Text style={styles.emptySub}>Você não tem cards para revisar agora. Continue estudando para criar novas revisões.</Text>
          </View>
        ) : (
          <>
            <View style={styles.totalBadge}>
              <Text style={styles.totalText}>{totalReview} card{totalReview !== 1 ? 's' : ''} para revisar</Text>
            </View>

            {decks.map((deck) => {
              const count = reviewByDeck[deck.id] ?? 0;
              if (count === 0) return null;
              return (
                <TouchableOpacity
                  key={deck.id}
                  style={styles.deckCard}
                  onPress={() => router.push({ pathname: '/study/[deckId]', params: { deckId: deck.id } })}
                  activeOpacity={0.85}
                >
                  <View style={[styles.deckIcon, { backgroundColor: deck.color + '22' }]}>
                    <Ionicons name="book-outline" size={24} color={deck.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deckName}>{deck.name}</Text>
                    <Text style={styles.deckCount}>{count} para revisar</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: deck.color }]}>
                    <Text style={styles.badgeText}>{count}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  sub: { fontSize: 15, color: '#6B7280' },
  emptyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', gap: 8, marginTop: 16 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  totalBadge: { backgroundColor: PRIMARY + '15', borderRadius: 12, padding: 12, alignItems: 'center' },
  totalText: { color: PRIMARY, fontWeight: '700', fontSize: 15 },
  deckCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  deckIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  deckName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  deckCount: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  badge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
