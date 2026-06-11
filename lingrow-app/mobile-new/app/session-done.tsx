import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts } from '@/theme';

const PRIMARY = colors.primary;

export default function SessionDoneScreen() {
  const { studied, deckId, streak } = useLocalSearchParams<{
    studied: string;
    deckId: string;
    streak: string;
  }>();

  const studiedCount = Number(studied ?? 0);
  const streakCount = Number(streak ?? 1);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const motivationText = () => {
    if (studiedCount >= 20) return 'Incrível! Você foi além hoje!';
    if (studiedCount >= 10) return 'Ótimo trabalho! Consistência é tudo!';
    return 'Você está construindo um hábito poderoso!';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* emoji animado */}
        <Animated.View style={[styles.emojiContainer, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.trophyWrap}>
            <Ionicons name="trophy" size={48} color={colors.accent} />
          </View>
        </Animated.View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Text style={styles.title}>Sessão concluída!</Text>
          <Text style={styles.sub}>
            Você estudou{' '}
            <Text style={styles.highlight}>{studiedCount} frases</Text> hoje.
          </Text>
          <Text style={styles.motivation}>{motivationText()}</Text>

          {/* stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="flash" size={24} color={PRIMARY} />
              <Text style={styles.statValue}>{studiedCount}</Text>
              <Text style={styles.statLabel}>Cards</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="flame" size={24} color={colors.accent} />
              <Text style={styles.statValue}>{streakCount}</Text>
              <Text style={styles.statLabel}>
                {streakCount === 1 ? 'dia' : 'dias'} seguidos
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* botões */}
        <View style={styles.buttons}>
          {deckId && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.replace({ pathname: '/study/[deckId]', params: { deckId } })}
            >
              <Ionicons name="refresh" size={20} color={colors.surface} />
              <Text style={styles.primaryBtnText}>Continuar estudando</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.secondaryBtnText}>Voltar para o início</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, alignItems: 'center', justifyContent: 'space-between', padding: 32 },
  emojiContainer: { marginTop: 24 },
  trophyWrap: { width: 104, height: 104, borderRadius: 52, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center', gap: 12 },
  title: { fontSize: 30, fontFamily: fonts.extrabold, color: colors.text, textAlign: 'center' },
  sub: { fontSize: 17, color: colors.textMuted, textAlign: 'center' },
  highlight: { color: PRIMARY, fontFamily: fonts.bold },
  motivation: { fontSize: 15, color: colors.textMuted, fontStyle: 'italic', textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: { fontSize: 28, fontFamily: fonts.extrabold, color: colors.text },
  statLabel: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  buttons: { width: '100%', gap: 12, marginBottom: 8 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    borderRadius: 16,
    paddingVertical: 18,
  },
  primaryBtnText: { color: colors.surface, fontFamily: fonts.bold, fontSize: 17 },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  secondaryBtnText: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
});
