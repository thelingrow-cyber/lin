import { router, useFocusEffect, type Href } from 'expo-router';
import React, { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '@/context/auth';
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
import { Analytics } from '@/lib/analytics';
import { isAiEnabled } from '@/lib/ai';
import { colors, fonts } from '@/theme';

const PRIMARY = colors.primary;
const FEEDBACK_URL = 'https://wa.me/5592984296972?text=Feedback%20Lingrow%3A%20';
const BETA_WELCOME_KEY = 'beta_welcome_done';

export default function HomeScreen() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [cardsByDeck, setCardsByDeck] = useState<Record<string, number>>({});
  const [reviewCount, setReviewCount] = useState(0);
  const [learnedCount, setLearnedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBetaWelcome, setShowBetaWelcome] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showNewDeckModal, setShowNewDeckModal] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [newDeckColor, setNewDeckColor] = useState(PRIMARY);
  const [selectedGoal, setSelectedGoal] = useState(5);

  const DECK_COLORS = [colors.primary, colors.info, colors.success, colors.accent, colors.danger, '#EC4899'];

  const dismissBetaWelcome = useCallback(async () => {
    await AsyncStorage.setItem(BETA_WELCOME_KEY, 'true');
    setShowBetaWelcome(false);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const betaDone = await AsyncStorage.getItem(BETA_WELCOME_KEY);
      if (!betaDone) setShowBetaWelcome(true);

      // kill switch remoto da IA — falha ⇒ botão oculto (estado seguro)
      void isAiEnabled().then(setAiEnabled);

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

  useFocusEffect(useCallback(() => {
    Analytics.sessionStarted();
    void load();
  }, [load]));

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
      Analytics.deckCreated(deck.name);
      setNewDeckName('');
      setNewDeckDesc('');
      setNewDeckColor(PRIMARY);
      setShowNewDeckModal(false);
      void load();
    } catch (e: any) {
      Alert.alert('Erro ao criar deck', e.message ?? 'Tente novamente.');
    }
  };

  const isToday = settings?.lastStudyDate === new Date().toDateString();

  // saudação pessoal: nome do perfil (Apple/Google) ou fallback por horário
  const firstName = String(
    user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? ''
  ).trim().split(' ')[0];
  const hour = new Date().getHours();
  const daypart = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const greeting = firstName ? `${daypart}, ${firstName}` : daypart;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="leaf" size={36} color={PRIMARY} />
          <Text style={{ color: PRIMARY, fontFamily: fonts.bold, marginTop: 12, fontSize: 16 }}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>{greeting} 👋</Text>
        <Text style={styles.headerSub}>Pronto pra mais um dia de inglês?</Text>

        {/* streak (só quando nada vencido) ou CTA para estudar */}
        {isToday && reviewCount === 0 ? (
          <View style={styles.streakCard}>
            <View style={styles.streakIconWrap}>
              <Ionicons name="trophy" size={26} color={colors.successDark} />
            </View>
            <Text style={styles.streakTitle}>Você está em dia hoje!</Text>
            <View style={styles.streakRow}>
              <Ionicons name="flame" size={16} color={colors.accent} />
              <Text style={styles.streakDays}>{settings?.streak ?? 1} dia{(settings?.streak ?? 1) !== 1 ? 's' : ''} seguido{(settings?.streak ?? 1) !== 1 ? 's' : ''}</Text>
            </View>
            <Text style={styles.streakSub}>Volte amanhã para novos cards.</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={startStudy} activeOpacity={0.9}>
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaCard}
            >
              <View style={styles.ctaIconWrap}>
                <Ionicons name="leaf" size={26} color={colors.onPrimary} />
              </View>
              <Text style={styles.ctaTitle}>{learnedCount > 0 || totalCards > 0 ? 'Estudar hoje' : 'Comece agora!'}</Text>
              <Text style={styles.ctaSub}>{learnedCount > 0 || totalCards > 0 ? `Você tem ${reviewCount} card${reviewCount !== 1 ? 's' : ''} esperando.` : 'Suas primeiras frases estão esperando por você.'}</Text>
              <View style={styles.ctaBtn}>
                <Text style={styles.ctaBtnText}>Estudar agora</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* deck with progress */}
        {learnedCount > 0 && (
          <TouchableOpacity style={styles.deckCard} onPress={() => router.push({ pathname: '/deck/[deckId]', params: { deckId: DECK_1000.id } })} activeOpacity={0.85}>
            <View style={styles.deckCardRow}>
              <View style={styles.deckCardIconWrap}>
                <Ionicons name="book" size={22} color={PRIMARY} />
              </View>
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
            <View style={[styles.statIconWrap, { backgroundColor: colors.infoSoft }]}><Ionicons name="school-outline" size={22} color={colors.info} /></View>
            <Text style={styles.statNum}>{totalCards}</Text>
            <Text style={styles.statLabel}>Cards</Text>
          </View>
        </View>

        {/* review */}
        <TouchableOpacity onPress={() => router.push('/(tabs)/revisar')} activeOpacity={0.85}>
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.reviewCard}
          >
            <View style={styles.reviewBadge}><Text style={styles.reviewBadgeText}>{reviewCount}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewTitle}>Para Revisar</Text>
              <Text style={styles.reviewSub}>Clique para estudar</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>

        {/* meus decks */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Meus Decks</Text>
          <View style={styles.deckBtnRow}>
            {aiEnabled && (
              // rota nova — tipo gerado só no próximo `expo start`, daí o cast
              <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/ai-create' as Href)}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.aiDeckBtn}
                >
                  <Ionicons name="sparkles" size={13} color={colors.surface} />
                  <Text style={styles.newDeckBtnText}>Criar com IA</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.newDeckBtn} onPress={() => setShowNewDeckModal(true)}>
              <Ionicons name="add" size={14} color={colors.surface} />
              <Text style={styles.newDeckBtnText}>Novo Deck</Text>
            </TouchableOpacity>
          </View>
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

      {/* Beta welcome modal */}
      <Modal visible={showBetaWelcome} transparent animationType="fade">
        <View style={styles.betaOverlay}>
          <View style={styles.betaBox}>
            <View style={styles.betaBody}>
              <View style={styles.betaIconWrap}>
                <Ionicons name="leaf" size={30} color={PRIMARY} />
              </View>
              <Text style={styles.betaTitle}>Você chegou primeiro.</Text>
              <Text style={styles.betaText}>
                O Lingrow ainda está crescendo — e você está aqui desde o início.
              </Text>
              <Text style={styles.betaText}>
                Tem uma ideia ou quer contar como está sendo? Nos passe seu feedback — você vai moldar conosco tudo que está vindo.
              </Text>
              <TouchableOpacity style={styles.betaCloseBtn} onPress={dismissBetaWelcome}>
                <Text style={styles.betaCloseText}>Vamos lá!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Goal modal */}
      <Modal visible={showGoalModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="flag" size={26} color={PRIMARY} />
            </View>
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
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Criar Novo Deck</Text>
              <TouchableOpacity onPress={() => setShowNewDeckModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Nome do Deck</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Vocabulário Básico"
              value={newDeckName}
              onChangeText={setNewDeckName}
              placeholderTextColor={colors.textFaint}
            />
            <Text style={styles.fieldLabel}>Descrição (opcional)</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Adicione uma breve descrição..."
              value={newDeckDesc}
              onChangeText={setNewDeckDesc}
              multiline
              placeholderTextColor={colors.textFaint}
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
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, gap: 24, paddingBottom: 40 },
  headerTitle: { fontSize: 28, fontFamily: fonts.extrabold, color: colors.text, marginBottom: 4, letterSpacing: -0.4 },
  headerSub: { fontSize: 15, color: colors.textMuted, marginBottom: 4 },
  streakCard: { backgroundColor: colors.successSoft, borderRadius: 20, padding: 28, alignItems: 'center', gap: 6 },
  streakIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.65)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  streakTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.successDark },
  streakDays: { fontSize: 15, color: colors.successDark },
  streakSub: { fontSize: 14, color: colors.successDark },
  ctaCard: { borderRadius: 24, padding: 22, alignItems: 'center', gap: 8, shadowColor: PRIMARY, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  ctaIconWrap: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  ctaTitle: { fontSize: 20, fontFamily: fonts.extrabold, color: colors.surface },
  ctaSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  ctaBtn: { backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10, marginTop: 4 },
  ctaBtnText: { color: PRIMARY, fontFamily: fonts.bold, fontSize: 15 },
  deckCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, gap: 12, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 16, elevation: 4, borderWidth: 1, borderColor: colors.borderSoft },
  deckCardRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  deckCardIconWrap: { width: 44, height: 44, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  deckCardName: { fontSize: 15, fontFamily: fonts.bold, color: colors.text },
  deckCardDesc: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 13, color: colors.textMuted },
  progressPct: { fontSize: 13, color: PRIMARY, fontFamily: fonts.bold },
  progressBarBg: { height: 6, backgroundColor: colors.border, borderRadius: 3 },
  progressBarFill: { height: 6, backgroundColor: PRIMARY, borderRadius: 3 },
  studyBtn: { backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  studyBtnText: { color: colors.surface, fontFamily: fonts.bold, fontSize: 15 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 20, padding: 20, gap: 8, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: colors.borderSoft },
  statIconWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  statNum: { fontSize: 32, fontFamily: fonts.extrabold, color: colors.text },
  statLabel: { fontSize: 13, color: colors.textMuted },
  reviewCard: { borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16, shadowColor: PRIMARY, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  reviewBadge: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  reviewBadgeText: { color: colors.surface, fontFamily: fonts.extrabold, fontSize: 18 },
  reviewTitle: { color: colors.surface, fontFamily: fonts.bold, fontSize: 16 },
  reviewSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  sectionTitle: { fontSize: 20, fontFamily: fonts.extrabold, color: colors.text },
  newDeckBtn: { flexDirection: 'row', backgroundColor: PRIMARY, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, gap: 4, alignItems: 'center' },
  deckBtnRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  aiDeckBtn: { flexDirection: 'row', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, gap: 4, alignItems: 'center' },
  newDeckBtnText: { color: colors.surface, fontFamily: fonts.bold, fontSize: 13 },
  deckItem: { backgroundColor: colors.surface, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 16, elevation: 4, borderWidth: 1, borderColor: colors.borderSoft },
  deckItemCover: { height: 90, alignItems: 'center', justifyContent: 'center' },
  deckItemBody: { padding: 16, gap: 4 },
  deckItemName: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  deckItemDesc: { fontSize: 13, color: colors.textMuted },
  deckItemFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  deckItemCountLabel: { fontSize: 13, color: colors.textFaint },
  deckItemCountVal: { fontSize: 13, fontFamily: fonts.bold },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  betaOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  betaBox: { backgroundColor: colors.surface, borderRadius: 24, overflow: 'hidden', width: '100%', maxWidth: 360 },
  betaHeader: { backgroundColor: PRIMARY, alignItems: 'center', paddingVertical: 28 },
  betaIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  betaBody: { padding: 24, gap: 14 },
  betaTitle: { fontSize: 22, fontFamily: fonts.extrabold, color: colors.text, textAlign: 'center' },
  betaText: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  betaFeedbackBtn: { borderWidth: 1.5, borderColor: PRIMARY, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  betaFeedbackText: { color: PRIMARY, fontFamily: fonts.bold, fontSize: 15 },
  betaCloseBtn: { backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  betaCloseText: { color: colors.surface, fontFamily: fonts.bold, fontSize: 16 },
  modalBox: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  modalTitle: { fontSize: 20, fontFamily: fonts.extrabold, color: colors.text, textAlign: 'center' },
  modalSub: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  goalOpt: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between' },
  goalOptActive: { borderColor: PRIMARY, backgroundColor: colors.primarySoft },
  goalNum: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  goalLabel: { fontSize: 14, color: colors.textMuted },
  modalBtn: { backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  modalBtnText: { color: colors.surface, fontFamily: fonts.bold, fontSize: 16 },
  fieldLabel: { fontSize: 14, fontFamily: fonts.semibold, color: colors.text },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 15, color: colors.text, backgroundColor: colors.surface },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  colorDotSelected: { borderWidth: 3, borderColor: colors.text },
  modalFooter: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  cancelBtnText: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
});
