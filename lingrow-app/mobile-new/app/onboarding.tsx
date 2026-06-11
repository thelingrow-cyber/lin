import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { saveSettings } from '@/store/lingrow';
import { Analytics } from '@/lib/analytics';
import { colors, fonts } from '@/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'leaf' as const,
    iconColor: colors.primary,
    iconBg: colors.primarySoft,
    title: 'Bem-vindo ao Lingrow',
    subtitle: 'Aprenda inglês com frases reais do dia a dia, do jeito certo.',
  },
  {
    icon: 'bulb' as const,
    iconColor: colors.info,
    iconBg: colors.infoSoft,
    title: 'Revisão inteligente',
    subtitle:
      'O app lembra quando você precisa revisar cada frase. Estude poucos minutos por dia e evolua de verdade.',
  },
  {
    icon: 'flame' as const,
    iconColor: colors.accent,
    iconBg: colors.accentSoft,
    title: 'Constância é tudo',
    subtitle:
      'Estude todos os dias e veja seu inglês crescer. Comece agora com suas primeiras frases.',
  },
];

export default function OnboardingScreen() {
  const [current, setCurrent] = useState(0);
  const listRef = useRef<FlatList>(null);

  const isLast = current === SLIDES.length - 1;

  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    const next = current + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setCurrent(next);
  };

  const finish = async () => {
    try {
      await saveSettings({ onboardingDone: true });
    } catch {
      // mesmo com erro, prossegue — usuário não deve ficar preso no onboarding
    }
    Analytics.onboardingCompleted();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
              <Ionicons name={item.icon} size={52} color={item.iconColor} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity style={styles.btn} onPress={next} activeOpacity={0.85}>
        <Text style={styles.btnText}>{isLast ? 'Começar agora' : 'Próximo'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide: {
    justifyContent: 'center',
    width,
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  iconWrap: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontFamily: fonts.bold, color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 16, color: colors.textMuted, textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', gap: 8, marginVertical: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 24, backgroundColor: colors.primary },
  btn: {
    marginHorizontal: 24,
    marginBottom: 16,
    width: width - 48,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 17, fontFamily: fonts.bold },
});
