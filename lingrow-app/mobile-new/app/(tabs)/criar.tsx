import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
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

const PRIMARY = '#7C3AED';

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
    setSaving(false);
    Alert.alert('Card criado ✔', 'Seu card foi adicionado com sucesso!');
  };

  return (
    <SafeAreaView style={styles.safe}>
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
            <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
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
            placeholderTextColor="#9CA3AF"
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
            placeholderTextColor="#9CA3AF"
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
            placeholderTextColor="#9CA3AF"
          />

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={save} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Criar Card'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  backBtn: { marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', color: PRIMARY },
  sub: { fontSize: 14, color: '#6B7280' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  label: { fontSize: 14, fontWeight: '600', color: '#111827' },
  picker: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, gap: 8 },
  pickerDot: { width: 12, height: 12, borderRadius: 6 },
  pickerText: { flex: 1, fontSize: 15, color: '#111827' },
  dropdownList: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden', marginTop: -4 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownItemText: { fontSize: 15, color: '#111827' },
  textarea: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, fontSize: 15, color: '#111827', textAlignVertical: 'top', minHeight: 80 },
  saveBtn: { backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
