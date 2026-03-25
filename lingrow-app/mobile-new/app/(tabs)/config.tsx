import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

import { getSettings, saveSettings, UserSettings } from '@/store/lingrow';

const PRIMARY = '#7C3AED';

const VOICES = [
  { id: 'en-US', label: '🇺🇸 Inglês Americano (EN-US)' },
  { id: 'en-GB', label: '🇬🇧 Inglês Britânico (EN-GB)' },
  { id: 'en-AU', label: '🇦🇺 Inglês Australiano (EN-AU)' },
];

export default function ConfigScreen() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [voice, setVoice] = useState('en-US');
  const [speed, setSpeed] = useState(1.0);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    const s = await getSettings();
    setSettings(s);
    setAutoPlay(s.autoPlay);
    setVoice(s.voiceVariant);
    setSpeed(s.playbackSpeed);
    setDirty(false);
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const saveConfig = async () => {
    await saveSettings({ autoPlay, voiceVariant: voice, playbackSpeed: speed });
    setDirty(false);
    Alert.alert('Salvo!', 'Configurações atualizadas com sucesso.');
  };

  const currentVoiceLabel = VOICES.find((v) => v.id === voice)?.label ?? voice;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.title}>Configurações</Text>
        <Text style={styles.sub}>Personalize sua experiência</Text>

        {/* audio card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Áudio e Pronúncia</Text>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Reprodução Automática</Text>
              <Text style={styles.rowSub}>Tocar áudio automaticamente durante revisão</Text>
            </View>
            <Switch
              value={autoPlay}
              onValueChange={(v) => { setAutoPlay(v); setDirty(true); }}
              trackColor={{ false: '#E5E7EB', true: PRIMARY + '66' }}
              thumbColor={autoPlay ? PRIMARY : '#9CA3AF'}
            />
          </View>

          <Text style={styles.fieldLabel}>Variante de Voz</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowVoicePicker(!showVoicePicker)}>
            <Text style={styles.pickerText}>{currentVoiceLabel}</Text>
            <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
          </TouchableOpacity>
          {showVoicePicker && (
            <View style={styles.dropdown}>
              {VOICES.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={styles.dropItem}
                  onPress={() => { setVoice(v.id); setShowVoicePicker(false); setDirty(true); }}
                >
                  <Text style={[styles.dropItemText, voice === v.id && { color: PRIMARY, fontWeight: '700' }]}>{v.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.speedHeader}>
            <Text style={styles.fieldLabel}>Velocidade de Reprodução</Text>
            <Text style={[styles.fieldLabel, { color: PRIMARY }]}>{speed.toFixed(1)}x</Text>
          </View>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0.5}
            maximumValue={2.0}
            step={0.1}
            value={speed}
            onValueChange={(v) => { setSpeed(parseFloat(v.toFixed(1))); setDirty(true); }}
            minimumTrackTintColor={PRIMARY}
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor={PRIMARY}
          />
          <View style={styles.speedLabels}>
            <Text style={styles.speedLabel}>0.5x (Mais lento)</Text>
            <Text style={styles.speedLabel}>2.0x (Mais rápido)</Text>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={load}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, !dirty && { opacity: 0.5 }]} onPress={saveConfig} disabled={!dirty}>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* restore card */}
        <TouchableOpacity
          style={styles.restoreCard}
          onPress={() => Alert.alert('Restaurar', 'Esta função estará disponível em breve.')}
          activeOpacity={0.85}
        >
          <View style={styles.restoreIcon}>
            <Ionicons name="server-outline" size={24} color="#3B82F6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.restoreTitle}>Restaurar Dados Antigos</Text>
            <Text style={styles.restoreSub}>Recupere seu progresso anterior</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>
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
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: '#111827' },
  rowSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  picker: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, gap: 8 },
  pickerText: { flex: 1, fontSize: 15, color: '#111827' },
  dropdown: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden' },
  dropItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropItemText: { fontSize: 15, color: '#111827' },
  speedHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  speedLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  speedLabel: { fontSize: 12, color: '#9CA3AF' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontWeight: '700', color: '#111827', fontSize: 15 },
  saveBtn: { flex: 1, backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  restoreCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  restoreIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  restoreTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  restoreSub: { fontSize: 13, color: '#6B7280' },
});
