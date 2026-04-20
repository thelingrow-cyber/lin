import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  getDecks,
  getCards,
  getAllProgress,
  getSettings,
  saveDeck,
  saveSettings,
  Deck,
  UserSettings,
} from '@/store/lingrow';
import { DECK_1000, SENTENCES } from '@/data/sentences';

const PRIMARY = '#7C3AED';

export default function HomeScreen() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [cardsByDeck, setCardsByDeck] = useState<Record<string, number>>({});
  const [reviewCount, setReviewCount] = useState(0);
  const [learnedCount, setLearnedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showNewDeckModal, setShowNewDeckModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [newDeckColor, setNewDeckColor] = useState(PRIMARY);
  const [selectedGoal, setSelectedGoal] = useState(5);

  const DECK_COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // fase 1: settings + decks + progresso em paralelo
      const [s, allDecks, cards, allProgress] = await Promise.all([
        getSettings(),
        getDecks(),
        getCards(),
        getAllProgress(),
      ]);
      setSettings(s);
      setDecks(allDecks);

      // cards manuais (não built-in)
      const manualCards = cards.filter((c) => c.deckId !== DECK_1000.id);
      setTotalCards(manualCards.length);
      const counts: Record<string, number> = {};
      for (const c of manualCards) {
        counts[c.deckId] = (counts[c.deckId] ?? 0) + 1;
      }
      setCardsByDeck(counts);

      const now = new Date();
      const studiedIds = new Set(allProgress.map((p) => p.cardId));

      // reviews pendentes: built-in + manuais
      const builtinCardIds = new Set(
        SENTENCES.map((s) => `card-builtin-${s.position}`)
      );
      const toReview = allProgress.filter(
        (p) => p.nextReview && new Date(p.nextReview) <= now
      ).length;
      const newUnseen = manualCards.filter((c) => !studiedIds.has(c.id)).length;
      setReviewCount(toReview + newUnseen);

      // frases built-in aprendidas (progress salvo no Supabase)
      setLearnedCount(
        allProgress.filter((p) => p.repetitions > 0 && builtinCardIds.has(p.cardId)).length
      );
    } catch {
      // erro silencioso — tela renderiza vazia em vez de travar
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const startStudy = () => {
    if (learnedCount > 0) {
      router.push({ pathname: '/study/[deckId]', params: { deckId: DECK_1000.id } });
    } else {
      setShowGoalModal(true);
    }
  };

  const confirmGoal = async () => {
    try {
      await saveSettings({ dailyGoal: selectedGoal });
    } catch {
      // falha ao salvar meta — continua com o padrão (5/dia)
    }
    setShowGoalModal(false);
    router.push({ pathname: '/study/[deckId]', params: { deckId: DECK_1000.id } });
  };

  const createDeck = async () => {
    if (!newDeckName.trim()) return;
    const deck: Deck = {
      id: `deck-${Date.now()}`,
      name: newDeckName.trim(),
      description: newDeckDesc.trim(),
      color: newDeckColor,
    };
    try {
      await saveDeck(deck);
      setNewDeckName('');
      setNewDeckDesc('');
      setNewDeckColor(PRIMARY);
      setShowNewDeckModal(false);
      load();
    } catch (e: any) {
      Alert.alert('Erro ao criar deck', e.message ?? 'Tente novamente.');
    }
  };

  const isToday = settings?.lastStudyDate === new Date().toDateString();

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 32 }}>🌱</Text>
          <Text style={{ color: PRIMARY, fontWeight: '700', marginTop: 12, fontSize: 16 }}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Bem-vindo ao Lingrow</Text>
        <Text style={styles.headerSub}>Aprenda inglês com flashcards inteligentes</Text>

        {/* streak or CTA */}
        {isToday ? (
          <View style={styles.streakCard}>
            <Text style={styles.streakEmoji}>🎉</Text>
            <Text style={styles.streakTitle}>Você está em dia hoje!</Text>
            <Text style={styles.streakDays}>🔥 {settings?.streak ?? 1} dia{(settings?.streak ?? 1) !== 1 ? 's' : ''} seguido{(settings?.streak ?? 1) !== 1 ? 's' : ''}</Text>
            <Text style={styles.streakSub}>Volte amanhã para novos cards.</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.ctaCard} onPress={startStudy} activeOpacity={0.9}>
            <Text style={styles.ctaEmoji}>🌱</Text>
            <Text style={styles.ctaTitle}>{learnedCount > 0 || totalCards > 0 ? 'Estudar hoje' : 'Comece agora!'}</Text>
            <Text style={styles.ctaSub}>{learnedCount > 0 || totalCards > 0 ? `Você tem ${reviewCount} card${reviewCount !== 1 ? 's' : ''} esperando.` : 'Suas primeiras frases estão esperando por você.'}</Text>
            <View style={styles.ctaBtn}>
              <Text style={styles.ctaBtnText}>Estudar agora</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* deck with progress */}
        {learnedCount > 0 && (
          <TouchableOpacity style={styles.deckCard} onPress={() => router.push({ pathname: '/deck/[deckId]', params: { deckId: DECK_1000.id } })} activeOpacity={0.85}>
            <View style={styles.deckCardRow}>
              <Text style={styles.deckCardIcon}>📚</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.deckCardName}>1000 Frases Essenciais em Inglês</Text>
                <Text style={styles.deckCardDesc}>Aprenda inglês com frases reais usadas no dia a dia.</Text>
              </View>
            </View>
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>{learnedCount} / 1000 frases aprendidas</Text>
              <Text style={styles.progressPct}>{Math.round((learnedCount / 1000) * 100)}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${(learnedCount / 1000) * 100}%` as any }]} />
            </View>
            <TouchableOpacity style={styles.studyBtn} onPress={() => router.push({ pathname: '/study/[deckId]', params: { deckId: DECK_1000.id } })}>
              <Text style={styles.studyBtnText}>Estudar agora</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconWrap}><Ionicons name="book-outline" size={22} color={PRIMARY} /></View>
            <Text style={styles.statNum}>{decks.length}</Text>
            <Text style={styles.statLabel}>Decks</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#EFF6FF' }]}><Ionicons name="school-outline" size={22} color="#3B82F6" /></View>
            <Text style={styles.statNum}>{totalCards}</Text>
            <Text style={styles.statLabel}>Cards</Text>
          </View>
        </View>

        {/* review */}
        <TouchableOpacity style={styles.reviewCard} onPress={() => router.push('/(tabs)/revisar')} activeOpacity={0.85}>
          <View style={styles.reviewBadge}><Text style={styles.reviewBadgeText}>{reviewCount}</Text></View>
          <View>
            <Text style={styles.reviewTitle}>Para Revisar</Text>
            <Text style={styles.reviewSub}>Clique para estudar</Text>
          </View>
        </TouchableOpacity>

        {/* meus decks */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Meus Decks</Text>
          <TouchableOpacity style={styles.newDeckBtn} onPress={() => setShowNewDeckModal(true)}>
            <Ionicons name="add" size={14} color="#fff" />
            <Text style={styles.newDeckBtnText}>Novo Deck</Text>
          </TouchableOpacity>
        </View>

        {decks.map((deck) => (
          <TouchableOpacity key={deck.id} style={styles.deckItem} onPress={() => router.push({ pathname: '/deck/[deckId]', params: { deckId: deck.id } })} activeOpacity={0.85}>
            <View style={[styles.deckItemCover, { backgroundColor: deck.color + '22' }]}>
              <Ionicons name="book-outline" size={36} color={deck.color} />
            </View>
            <View style={styles.deckItemBody}>
              <Text style={styles.deckItemName}>{deck.name}</Text>
              <Text style={styles.deckItemDesc} numberOfLines={2}>{deck.description}</Text>
              <View style={styles.deckItemFooter}>
                <Text style={styles.deckItemCountLabel}>Cards</Text>
                <Text style={[styles.deckItemCountVal, { color: deck.color }]}>{cardsByDeck[deck.id] ?? 0}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Goal modal */}
      <Modal visible={showGoalModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalIcon}>🎯</Text>
            <Text style={styles.modalTitle}>1000 Frases Essenciais</Text>
            <Text style={styles.modalSub}>Quantas frases você quer aprender por dia?</Text>
            {[
              { v: 2, label: 'Ritmo tranquilo' },
              { v: 3, label: 'Ritmo moderado' },
              { v: 5, label: 'Ritmo recomendado' },
              { v: 10, label: 'Ritmo intensivo' },
            ].map(({ v, label }) => (
              <TouchableOpacity
                key={v}
                style={[styles.goalOpt, selectedGoal === v && styles.goalOptActive]}
                onPress={() => setSelectedGoal(v)}
              >
                <Text style={[styles.goalNum, selectedGoal === v && { color: PRIMARY }]}>{v} por dia</Text>
                <Text style={styles.goalLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalBtn} onPress={confirmGoal}>
              <Text style={styles.modalBtnText}>Começar agora</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* New Deck modal */}
      <Modal visible={showNewDeckModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Criar Novo Deck</Text>
              <TouchableOpacity onPress={() => setShowNewDeckModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Nome do Deck</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Vocabulário Básico"
              value={newDeckName}
              onChangeText={setNewDeckName}
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.fieldLabel}>Descrição (opcional)</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Adicione uma breve descrição..."
              value={newDeckDesc}
              onChangeText={setNewDeckDesc}
              multiline
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.fieldLabel}>Cor</Text>
            <View style={styles.colorRow}>
              {DECK_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, newDeckColor === c && styles.colorDotSelected]}
                  onPress={() => setNewDeckColor(c)}
                />
              ))}
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNewDeckModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { flex: 1 }]} onPress={createDeck}>
                <Text style={styles.modalBtnText}>Criar Deck</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 20, gap: 24, paddingBottom: 40 },
  headerTitle: { fontSize: 30, fontWeight: '800', color: PRIMARY, marginBottom: 4 },
  headerSub: { fontSize: 15, color: '#6B7280', marginBottom: 4 },
  streakCard: { backgroundColor: '#D1FAE5', borderRadius: 20, padding: 28, alignItems: 'center', gap: 6 },
  streakEmoji: { fontSize: 32 },
  streakTitle: { fontSize: 18, fontWeight: '700', color: '#065F46' },
  streakDays: { fontSize: 15, color: '#065F46' },
  streakSub: { fontSize: 14, color: '#065F46' },
  ctaCard: { borderRadius: 16, padding: 20, alignItems: 'center', gap: 8, backgroundColor: PRIMARY },
  ctaEmoji: { fontSize: 32 },
  ctaTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  ctaSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  ctaBtn: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10, marginTop: 4 },
  ctaBtnText: { color: PRIMARY, fontWeight: '700', fontSize: 15 },
  deckCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 12, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 16, elevation: 4, borderWidth: 1, borderColor: '#F3F4F6' },
  deckCardRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  deckCardIcon: { fontSize: 28 },
  deckCardName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  deckCardDesc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 13, color: '#6B7280' },
  progressPct: { fontSize: 13, color: PRIMARY, fontWeight: '700' },
  progressBarBg: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3 },
  progressBarFill: { height: 6, backgroundColor: PRIMARY, borderRadius: 3 },
  studyBtn: { backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  studyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 8, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: '#F3F4F6' },
  statIconWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  statNum: { fontSize: 32, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 13, color: '#6B7280' },
  reviewCard: { backgroundColor: PRIMARY, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  reviewBadge: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  reviewBadgeText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  reviewTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  reviewSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  newDeckBtn: { flexDirection: 'row', backgroundColor: PRIMARY, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, gap: 4, alignItems: 'center' },
  newDeckBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  deckItem: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 16, elevation: 4, borderWidth: 1, borderColor: '#F3F4F6' },
  deckItemCover: { height: 90, alignItems: 'center', justifyContent: 'center' },
  deckItemBody: { padding: 16, gap: 4 },
  deckItemName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  deckItemDesc: { fontSize: 13, color: '#6B7280' },
  deckItemFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  deckItemCountLabel: { fontSize: 13, color: '#9CA3AF' },
  deckItemCountVal: { fontSize: 13, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalIcon: { fontSize: 40, textAlign: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'center' },
  modalSub: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  goalOpt: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between' },
  goalOptActive: { borderColor: PRIMARY, backgroundColor: '#EDE9FE' },
  goalNum: { fontSize: 16, fontWeight: '700', color: '#111827' },
  goalLabel: { fontSize: 14, color: '#6B7280' },
  modalBtn: { backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, fontSize: 15, color: '#111827', backgroundColor: '#fff' },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  colorDotSelected: { borderWidth: 3, borderColor: '#111827' },
  modalFooter: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  cancelBtnText: { fontWeight: '700', fontSize: 16, color: '#111827' },
});
