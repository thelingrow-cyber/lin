import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="study/[deckId]" />
        <Stack.Screen name="deck/[deckId]" />
        <Stack.Screen name="session-done" />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
