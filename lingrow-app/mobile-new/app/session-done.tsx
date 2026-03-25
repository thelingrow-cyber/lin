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

const PRIMARY = '#7C3AED';

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
    if (studiedCount >= 20) return 'Incrível! Você foi além hoje! 🚀';
    if (studiedCount >= 10) return 'Ótimo trabalho! Consistência é tudo! 💪';
    return 'Você está construindo um hábito poderoso! 🔥';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* emoji animado */}
        <Animated.View style={[styles.emojiContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.emoji}>🎉</Text>
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
              <Ionicons name="flame" size={24} color="#F59E0B" />
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
              <Ionicons name="refresh" size={20} color="#fff" />
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
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'space-between', padding: 32 },
  emojiContainer: { marginTop: 24 },
  emoji: { fontSize: 80 },
  content: { alignItems: 'center', gap: 12 },
  title: { fontSize: 30, fontWeight: '800', color: '#111827', textAlign: 'center' },
  sub: { fontSize: 17, color: '#6B7280', textAlign: 'center' },
  highlight: { color: PRIMARY, fontWeight: '700' },
  motivation: { fontSize: 15, color: '#6B7280', fontStyle: 'italic', textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: { fontSize: 28, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
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
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  secondaryBtnText: { fontWeight: '700', fontSize: 17, color: '#111827' },
});
