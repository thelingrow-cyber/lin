import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '@/context/auth';
import { getSettings } from '@/store/lingrow';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const { session, loading } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace('/login');
      setChecked(true);
      return;
    }
    // verificar onboarding
    getSettings(session.user.id).then((s) => {
      if (!s.onboardingDone) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
      setChecked(true);
    });
  }, [session, loading]);

  return (
    <>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="study/[deckId]" options={{ headerShown: false }} />
        <Stack.Screen name="deck/[deckId]" options={{ headerShown: false }} />
        <Stack.Screen name="session-done" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
