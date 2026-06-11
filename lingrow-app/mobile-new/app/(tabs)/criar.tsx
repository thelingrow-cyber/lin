import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
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

import { getDecks, saveCard, Deck } from '@/store/lingrow';
import { colors, fonts } from '@/theme';

const PRIMARY = colors.primary;

export default function CriarScreen() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [notes, setNotes] = useState('');
  const [showDeckPicker, setShowDeckPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const all = await getDecks();
    setDecks(all.filter((d) => d.id !== 'deck-1000-frases'));
    if (!selectedDeck) {
      const manual = all.find((d) => d.id !== 'deck-1000-frases');
      if (manual) setSelectedDeck(manual);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const save = async () => {
    if (!front.trim() || !back.trim()) {
      Alert.alert('Atenção', 'Frente e verso são obrigatórios.');
      return;
    }
    if (!selectedDeck) {
      Alert.alert('Atenção', 'Selecione um deck.');
      return;
    }
    setSaving(true);
    try {
      await saveCard({
        id: `card-${Date.now()}`,
        deckId: selectedDeck.id,
        front: front.trim(),
        back: back.trim(),
        notes: notes.trim() || undefined,
        position: Date.now(),
      });
      setFront('');
      setBack('');
      setNotes('');
      Alert.alert('Card criado ✔', 'Seu card foi adicionado com sucesso!');
    } catch (e: any) {
      Alert.alert('Erro ao salvar card', e.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.title}>Criar Novo Card</Text>
        <Text style={styles.sub}>Adicione uma nova frase ao seu vocabulário</Text>

        <View style={styles.card}>
          {/* deck picker */}
          <Text style={styles.label}>Deck</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowDeckPicker(!showDeckPicker)}>
            <View style={[styles.pickerDot, { backgroundColor: selectedDeck?.color ?? PRIMARY }]} />
            <Text style={styles.pickerText}>{selectedDeck?.name ?? 'Selecione um deck'}</Text>
            <Ionicons name="chevron-down" size={18} color={colors.textFaint} />
          </TouchableOpacity>

          {showDeckPicker && (
            <View style={styles.dropdownList}>
              {decks.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={styles.dropdownItem}
                  onPress={() => { setSelectedDeck(d); setShowDeckPicker(false); }}
                >
                  <View style={[styles.pickerDot, { backgroundColor: d.color }]} />
                  <Text style={styles.dropdownItemText}>{d.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* front */}
          <Text style={[styles.label, { marginTop: 16 }]}>Frente (Inglês)</Text>
          <TextInput
            style={styles.textarea}
            placeholder="I've been working on this project for months..."
            value={front}
            onChangeText={setFront}
            multiline
            numberOfLines={3}
            maxLength={200}
            placeholderTextColor={colors.textFaint}
          />

          {/* back */}
          <Text style={styles.label}>Verso (Português)</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Eu tenho trabalhado neste projeto há meses..."
            value={back}
            onChangeText={setBack}
            multiline
            numberOfLines={3}
            maxLength={200}
            placeholderTextColor={colors.textFaint}
          />

          {/* notes */}
          <Text style={styles.label}>Notas (opcional)</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Adicione observações, contexto ou dicas de uso..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            maxLength={300}
            placeholderTextColor={colors.textFaint}
          />

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={save} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Criar Card'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  backBtn: { marginBottom: 4 },
  title: { fontSize: 26, fontFamily: fonts.extrabold, color: PRIMARY },
  sub: { fontSize: 14, color: colors.textMuted },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, gap: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  label: { fontSize: 14, fontFamily: fonts.semibold, color: colors.text },
  picker: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 12, gap: 8 },
  pickerDot: { width: 12, height: 12, borderRadius: 6 },
  pickerText: { flex: 1, fontSize: 15, color: colors.text },
  dropdownList: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden', marginTop: -4 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  dropdownItemText: { fontSize: 15, color: colors.text },
  textarea: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 15, color: colors.text, textAlignVertical: 'top', minHeight: 80 },
  saveBtn: { backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: colors.surface, fontFamily: fonts.bold, fontSize: 16 },
});
