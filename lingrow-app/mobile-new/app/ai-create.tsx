// ============================================================
// Lingrow — Criar deck com IA (Caminho A)
// Story: IA-2.1 | UX: docs/features/ai-deck-creator.md §3-§5
// Uma tela, 3 fases: entrada → gerando → revisão. Nada é salvo
// até o usuário aprovar na revisão (saveDeck + saveCards).
// ============================================================

import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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

import {
  AiCardDraft,
  AiError,
  AiUsage,
  AI_DISPLAY_LIMITS,
  generateCards,
  getAiUsage,
  isPremiumUser,
} from '@/lib/ai';
import { saveCards, saveDeck, Card, Deck } from '@/store/lingrow';
import { Analytics } from '@/lib/analytics';
import { colors, fonts, radius, shadow, spacing } from '@/theme';

const THEME_MAX = 100;

const CHIPS: { emoji: string; label: string; theme: string }[] = [
  { emoji: '✈️', label: 'Viagem', theme: 'inglês para viagem' },
  { emoji: '💼', label: 'Reunião de negócios', theme: 'inglês para reunião de negócios' },
  { emoji: '🍽️', label: 'Pedir em restaurante', theme: 'pedir comida em restaurante em inglês' },
  { emoji: '💬', label: 'Entrevista de emprego', theme: 'entrevista de emprego em inglês' },
];

type Phase = 'input' | 'generating' | 'review';

export default function AiCreateScreen() {
  const [phase, setPhase] = useState<Phase>('input');
  const [theme, setTheme] = useState('');
  const [usage, setUsage] = useState<AiUsage | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // revisão
  const [drafts, setDrafts] = useState<AiCardDraft[]>([]);
  const [deckName, setDeckName] = useState('');
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // quota p/ exibição (servidor é a autoridade — isto é informativo)
  useEffect(() => {
    (async () => {
      try {
        const premium = await isPremiumUser();
        const limit = premium ? AI_DISPLAY_LIMITS.premium : AI_DISPLAY_LIMITS.free;
        setUsage(await getAiUsage(limit));
      } catch {
        // sem quota visível — segue sem a linha informativa
      }
    })();
  }, []);

  // contagem regressiva do anti-burst
  useEffect(() => {
    if (cooldown <= 0) {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
      return;
    }
    cooldownTimer.current = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    };
  }, [cooldown > 0]);

  const remaining = usage ? Math.max(0, usage.limit - usage.used) : null;

  const generate = useCallback(async () => {
    const t = theme.trim();
    if (t.length === 0) {
      setErrorMsg('Digite um tema ou toque em uma das sugestões.');
      return;
    }
    setErrorMsg(null);
    setPhase('generating');
    try {
      const result = await generateCards({ theme: t });
      setDrafts(result.cards);
      setUsage(result.usage);
      setDeckName(t.charAt(0).toUpperCase() + t.slice(1));
      setFlipped(new Set());
      setEditingIndex(null);
      setPhase('review');
    } catch (e) {
      setPhase('input');
      if (e instanceof AiError) {
        switch (e.code) {
          case 'quota_exceeded':
            if (e.usage) setUsage(e.usage);
            setErrorMsg(
              `Você usou todas as suas gerações deste mês (${e.usage?.used ?? ''} de ${e.usage?.limit ?? ''}). Em breve: gere muito mais com o Lingrow Premium ✨`
            );
            return;
          case 'too_many_requests':
            setCooldown(e.retryAfterSeconds ?? 15);
            setErrorMsg('Calma, uma geração de cada vez 😉');
            return;
          case 'generation_failed':
            setErrorMsg('A IA não conseguiu gerar desta vez — tente de novo. Essa tentativa não contou na sua cota.');
            return;
          case 'network':
            setErrorMsg('Sem conexão. Verifique sua internet e tente novamente.');
            return;
          case 'feature_disabled':
            router.back();
            return;
          case 'invalid_input':
            setErrorMsg('O tema precisa ter entre 1 e 100 caracteres.');
            return;
        }
      }
      setErrorMsg('Algo deu errado. Tente novamente em instantes.');
    }
  }, [theme]);

  const toggleFlip = (i: number) => {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const updateDraft = (i: number, patch: Partial<AiCardDraft>) => {
    setDrafts((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  };

  const removeDraft = (i: number) => {
    if (drafts.length <= 1) {
      Alert.alert('Ops', 'O deck precisa de pelo menos 1 card.');
      return;
    }
    setDrafts((prev) => prev.filter((_, idx) => idx !== i));
    setEditingIndex(null);
  };

  const discard = () => {
    Alert.alert('Descartar deck?', 'Os cards gerados serão perdidos.', [
      { text: 'Continuar revisando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const save = async () => {
    const name = deckName.trim();
    if (!name) {
      Alert.alert('Atenção', 'Dê um nome ao seu deck.');
      return;
    }
    setSaving(true);
    const ts = Date.now();
    const deck: Deck = {
      id: `deck-ai-${ts}`,
      name,
      description: `Deck gerado por IA — ${theme.trim()}`,
      color: colors.primary,
    };
    const cards: Card[] = drafts.map((d, i) => ({
      id: `card-ai-${ts}-${i}`,
      deckId: deck.id,
      front: d.front,
      back: d.back,
      keyword: d.keyword,
      keywordPt: d.keywordPt,
      notes: d.notes,
      position: ts + i, // sequencial — preserva a ordem gerada
    }));
    try {
      await saveDeck(deck);
      await saveCards(cards);
      Analytics.deckCreated(deck.name);
      Alert.alert('Deck criado ✨', `"${name}" está pronto com ${cards.length} cards.`);
      router.replace({ pathname: '/deck/[deckId]', params: { deckId: deck.id } });
    } catch (e: any) {
      // drafts permanecem na tela — o usuário pode tentar salvar de novo
      Alert.alert('Erro ao salvar', e?.message ?? 'Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // ─── fase GERANDO ──────────────────────────────────────────────────────────
  if (phase === 'generating') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <View style={styles.loadingIconWrap}>
            <Ionicons name="sparkles" size={30} color={colors.primary} />
          </View>
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.lg }} />
          <Text style={styles.loadingTitle}>Criando seu deck…</Text>
          <Text style={styles.loadingSub}>
            Nossa IA está escrevendo frases sobre{'\n'}"{theme.trim()}"
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── fase REVISÃO ──────────────────────────────────────────────────────────
  if (phase === 'review') {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <TouchableOpacity onPress={discard} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Revise seu deck</Text>
            <Text style={styles.sub}>
              {drafts.length} card{drafts.length !== 1 ? 's' : ''} gerado{drafts.length !== 1 ? 's' : ''} · toque para virar, edite ou exclua
            </Text>

            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Nome do deck</Text>
              <TextInput
                style={styles.input}
                value={deckName}
                onChangeText={setDeckName}
                maxLength={60}
                placeholder="Nome do deck"
                placeholderTextColor={colors.textFaint}
              />
            </View>

            {drafts.map((d, i) => {
              const isFlipped = flipped.has(i);
              const isEditing = editingIndex === i;
              return (
                <View key={`${i}-${d.front.slice(0, 12)}`} style={styles.draftCard}>
                  {isEditing ? (
                    <View style={{ gap: spacing.sm }}>
                      <Text style={styles.fieldLabel}>Frente (inglês)</Text>
                      <TextInput style={styles.editInput} value={d.front} multiline onChangeText={(v) => updateDraft(i, { front: v })} />
                      <Text style={styles.fieldLabel}>Verso (português)</Text>
                      <TextInput style={styles.editInput} value={d.back} multiline onChangeText={(v) => updateDraft(i, { back: v })} />
                      <Text style={styles.fieldLabel}>Nota (opcional)</Text>
                      <TextInput style={styles.editInput} value={d.notes ?? ''} multiline onChangeText={(v) => updateDraft(i, { notes: v || undefined })} />
                      <TouchableOpacity style={styles.doneEditBtn} onPress={() => setEditingIndex(null)}>
                        <Ionicons name="checkmark" size={16} color={colors.onPrimary} />
                        <Text style={styles.doneEditText}>Concluir edição</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity activeOpacity={0.85} onPress={() => toggleFlip(i)}>
                      <View style={styles.draftHeader}>
                        <Text style={styles.draftIndex}>{i + 1}</Text>
                        <View style={styles.draftActions}>
                          <TouchableOpacity hitSlop={8} onPress={() => setEditingIndex(i)}>
                            <Ionicons name="pencil" size={18} color={colors.textMuted} />
                          </TouchableOpacity>
                          <TouchableOpacity hitSlop={8} onPress={() => removeDraft(i)}>
                            <Ionicons name="trash-outline" size={18} color={colors.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {!isFlipped ? (
                        <>
                          <Text style={styles.draftFront}>{d.front}</Text>
                          <View style={styles.flipHint}>
                            <Ionicons name="sync-outline" size={13} color={colors.textFaint} />
                            <Text style={styles.flipHintText}>toque para ver a tradução</Text>
                          </View>
                        </>
                      ) : (
                        <>
                          <Text style={styles.draftBack}>{d.back}</Text>
                          <View style={styles.keywordChip}>
                            <Text style={styles.keywordText}>{d.keyword}</Text>
                            <Text style={styles.keywordPt}> · {d.keywordPt}</Text>
                          </View>
                          {d.notes ? <Text style={styles.draftNotes}>{d.notes}</Text> : null}
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            <TouchableOpacity disabled={saving} activeOpacity={0.9} onPress={save}>
              <LinearGradient
                colors={[colors.primary, colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.generateBtn, saving && { opacity: 0.7 }]}
              >
                <Ionicons name="checkmark-circle" size={20} color={colors.onPrimary} />
                <Text style={styles.generateBtnText}>
                  {saving ? 'Salvando…' : `Salvar deck (${drafts.length} card${drafts.length !== 1 ? 's' : ''})`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.discardBtn} onPress={discard} disabled={saving}>
              <Text style={styles.discardText}>Descartar</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── fase ENTRADA ──────────────────────────────────────────────────────────
  const canGenerate = theme.trim().length > 0 && cooldown <= 0;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.heroIconWrap}>
            <Ionicons name="sparkles" size={26} color={colors.primary} />
          </View>
          <Text style={styles.title}>Criar deck com IA</Text>
          <Text style={styles.sub}>Descreva um tema e a IA monta seu deck — você revisa tudo antes de salvar.</Text>

          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Qual o tema?</Text>
            <TextInput
              style={styles.themeInput}
              placeholder="Ex.: inglês para viagem"
              placeholderTextColor={colors.textFaint}
              value={theme}
              onChangeText={(v) => {
                setTheme(v);
                if (errorMsg) setErrorMsg(null);
              }}
              maxLength={THEME_MAX}
              multiline
            />
            <Text style={styles.charCount}>{theme.length}/{THEME_MAX}</Text>

            <Text style={[styles.fieldLabel, { marginTop: spacing.sm }]}>Ou comece por um atalho</Text>
            <View style={styles.chipsWrap}>
              {CHIPS.map((c) => (
                <TouchableOpacity
                  key={c.label}
                  style={[styles.chip, theme === c.theme && styles.chipActive]}
                  onPress={() => {
                    setTheme(c.theme);
                    if (errorMsg) setErrorMsg(null);
                  }}
                >
                  <Text style={styles.chipEmoji}>{c.emoji}</Text>
                  <Text style={[styles.chipText, theme === c.theme && styles.chipTextActive]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Ionicons name="information-circle" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <TouchableOpacity disabled={!canGenerate} activeOpacity={0.9} onPress={generate}>
              <LinearGradient
                colors={[colors.primary, colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.generateBtn, !canGenerate && { opacity: 0.5 }]}
              >
                <Ionicons name="sparkles" size={18} color={colors.onPrimary} />
                <Text style={styles.generateBtnText}>
                  {cooldown > 0 ? `Aguarde ${cooldown}s` : 'Gerar'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {remaining != null && (
            <View style={styles.quotaRow}>
              <Ionicons name="sparkles-outline" size={14} color={colors.textMuted} />
              <Text style={styles.quotaText}>
                {remaining} geraç{remaining === 1 ? 'ão restante' : 'ões restantes'} este mês
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, gap: spacing.md, paddingBottom: 40 },
  backBtn: { marginBottom: spacing.xs },
  heroIconWrap: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontFamily: fonts.extrabold, color: colors.primary, letterSpacing: -0.4 },
  sub: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.sm, ...shadow.card, borderWidth: 1, borderColor: colors.borderSoft },
  fieldLabel: { fontSize: 14, fontFamily: fonts.semibold, color: colors.text },
  themeInput: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: 15, color: colors.text, minHeight: 64, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: colors.textFaint, alignSelf: 'flex-end' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surface },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 13, fontFamily: fonts.medium, color: colors.text },
  chipTextActive: { color: colors.primary, fontFamily: fonts.bold },
  errorBanner: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md, alignItems: 'flex-start' },
  errorText: { flex: 1, fontSize: 13, color: colors.danger, lineHeight: 18 },
  generateBtn: { flexDirection: 'row', borderRadius: radius.md, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xs, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  generateBtnText: { color: colors.onPrimary, fontFamily: fonts.bold, fontSize: 16 },
  quotaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  quotaText: { fontSize: 13, color: colors.textMuted },

  // gerando
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  loadingIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  loadingTitle: { fontSize: 20, fontFamily: fonts.extrabold, color: colors.text, marginTop: spacing.md },
  loadingSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  // revisão
  draftCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, ...shadow.soft, borderWidth: 1, borderColor: colors.borderSoft },
  draftHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  draftIndex: { fontSize: 12, fontFamily: fonts.bold, color: colors.textFaint },
  draftActions: { flexDirection: 'row', gap: spacing.lg },
  draftFront: { fontSize: 16, fontFamily: fonts.semibold, color: colors.text, lineHeight: 23 },
  draftBack: { fontSize: 16, fontFamily: fonts.semibold, color: colors.primary, lineHeight: 23 },
  flipHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  flipHintText: { fontSize: 11, color: colors.textFaint },
  keywordChip: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5 },
  keywordText: { fontSize: 12, fontFamily: fonts.bold, color: colors.primary },
  keywordPt: { fontSize: 12, color: colors.textMuted },
  draftNotes: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic', lineHeight: 18 },
  editInput: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: 14, color: colors.text, textAlignVertical: 'top' },
  doneEditBtn: { flexDirection: 'row', backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: spacing.sm, alignItems: 'center', justifyContent: 'center', gap: 6 },
  doneEditText: { color: colors.onPrimary, fontFamily: fonts.bold, fontSize: 13 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: 15, color: colors.text },
  discardBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  discardText: { fontSize: 14, fontFamily: fonts.semibold, color: colors.textMuted },
});
