import { router, type Href } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

const PRIMARY = colors.primary;
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

  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir conta',
      'Essa ação é irreversível. Sua conta e todos os seus dados (decks, progresso, configurações) serão apagados permanentemente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const { error } = await supabase.functions.invoke('delete-account');
              if (error) throw error;

              // signOut depois do sucesso — se a exclusão falhar, a sessão
              // continua válida e o usuário pode tentar de novo.
              await signOut();
              router.replace('/login');
              Alert.alert('Conta excluída', 'Sua conta e seus dados foram apagados permanentemente.');
            } catch (e: any) {
              Alert.alert(
                'Erro ao excluir conta',
                e.message ?? 'Não foi possível excluir sua conta agora. Tente novamente em instantes.'
              );
            } finally {
              setDeleting(false);
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

        <TouchableOpacity style={styles.premiumBtn} onPress={() => router.push('/meu-ingles' as Href)}>
          <Ionicons name="sparkles-outline" size={20} color={PRIMARY} />
          <Text style={styles.premiumText}>Meu Inglês</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Áudio e Pronúncia</Text>
          <Text style={styles.cardSub}>O áudio utiliza pronúncia em inglês americano (EN-US) com velocidade padrão.</Text>
        </View>

        <TouchableOpacity style={styles.feedbackBtn} onPress={() => Linking.openURL(FEEDBACK_URL)}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.success} />
          <Text style={styles.feedbackText}>Enviar feedback</Text>
          <Ionicons name="open-outline" size={16} color={colors.textFaint} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL(PRIVACY_URL)}>
          <Ionicons name="shield-checkmark-outline" size={20} color={PRIMARY} />
          <Text style={styles.linkText}>Política de Privacidade</Text>
          <Ionicons name="open-outline" size={16} color={colors.textFaint} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} disabled={deleting}>
          <Ionicons name="trash-outline" size={20} color={colors.textFaint} />
          <Text style={styles.deleteText}>{deleting ? 'Excluindo…' : 'Excluir minha conta'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 20, gap: 16 },
  title: { fontSize: 26, fontFamily: fonts.extrabold, color: PRIMARY },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, gap: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  cardSub: { fontSize: 13, color: colors.textMuted },
  feedbackBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.successSoft, borderRadius: 16, padding: 18 },
  feedbackText: { flex: 1, fontSize: 16, fontFamily: fonts.semibold, color: colors.success },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.primarySoft, borderRadius: 16, padding: 18 },
  linkText: { flex: 1, fontSize: 16, fontFamily: fonts.semibold, color: PRIMARY },
  premiumBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: colors.border },
  premiumText: { flex: 1, fontSize: 16, fontFamily: fonts.semibold, color: colors.text },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.dangerSoft, borderRadius: 16, padding: 18 },
  logoutText: { fontSize: 16, fontFamily: fonts.bold, color: colors.danger },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 18 },
  deleteText: { fontSize: 15, fontFamily: fonts.semibold, color: colors.textFaint },
});
