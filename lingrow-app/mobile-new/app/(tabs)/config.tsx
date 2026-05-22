import { router } from 'expo-router';
import React from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';

const PRIMARY = '#7C3AED';
const PRIVACY_URL = 'https://www.notion.so/Pol-tica-de-Privacidade-Lingrow-2efa44f320bd4399a11610f0803f0e8d';
const FEEDBACK_URL = 'https://wa.me/5592984296972?text=Feedback%20Lingrow%3A%20';

export default function ConfigScreen() {
  const { signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir conta',
      'Essa ação é irreversível. Todos os seus dados serão apagados permanentemente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session?.user?.id) throw new Error('Usuário não autenticado');
              const userId = session.user.id;

              // apaga todos os dados do usuário
              const { data: userDecks } = await supabase.from('decks').select('id').eq('user_id', userId);
              if (userDecks && userDecks.length > 0) {
                const deckIds = userDecks.map((d: any) => d.id);
                await supabase.from('cards').delete().in('deck_id', deckIds);
              }
              await supabase.from('card_progress').delete().eq('user_id', userId);
              await supabase.from('decks').delete().eq('user_id', userId);
              await supabase.from('user_settings').delete().eq('user_id', userId);

              await signOut();
              router.replace('/login');
              Alert.alert('Conta excluída', 'Seus dados foram apagados com sucesso.');
            } catch (e: any) {
              Alert.alert('Erro', e.message ?? 'Não foi possível excluir a conta. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Configurações</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Áudio e Pronúncia</Text>
          <Text style={styles.cardSub}>O áudio utiliza pronúncia em inglês americano (EN-US) com velocidade padrão.</Text>
        </View>

        <TouchableOpacity style={styles.feedbackBtn} onPress={() => Linking.openURL(FEEDBACK_URL)}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#10B981" />
          <Text style={styles.feedbackText}>Enviar feedback</Text>
          <Ionicons name="open-outline" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL(PRIVACY_URL)}>
          <Ionicons name="shield-checkmark-outline" size={20} color={PRIMARY} />
          <Text style={styles.linkText}>Política de Privacidade</Text>
          <Ionicons name="open-outline" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={20} color="#9CA3AF" />
          <Text style={styles.deleteText}>Excluir minha conta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20, gap: 16 },
  title: { fontSize: 26, fontWeight: '800', color: PRIMARY },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cardSub: { fontSize: 13, color: '#6B7280' },
  feedbackBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F0FDF4', borderRadius: 16, padding: 18 },
  feedbackText: { flex: 1, fontSize: 16, fontWeight: '600', color: '#10B981' },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F5F3FF', borderRadius: 16, padding: 18 },
  linkText: { flex: 1, fontSize: 16, fontWeight: '600', color: PRIMARY },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FEF2F2', borderRadius: 16, padding: 18 },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#EF4444' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 18 },
  deleteText: { fontSize: 15, fontWeight: '600', color: '#9CA3AF' },
});
