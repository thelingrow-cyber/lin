import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

const PRIMARY = colors.primary;

function translateAuthError(msg: string): string {
  if (!msg) return 'Ocorreu um erro. Tente novamente.';
  const m = msg.toLowerCase();
  if (m.includes('user already registered') || m.includes('already registered'))
    return 'Este email já está cadastrado. Tente entrar com sua senha.';
  if (m.includes('invalid login credentials') || m.includes('invalid credentials'))
    return 'Email ou senha incorretos.';
  if (m.includes('email not confirmed'))
    return 'Confirme seu email antes de entrar. Verifique sua caixa de entrada.';
  if (m.includes('password should be at least'))
    return 'A senha deve ter pelo menos 6 caracteres.';
  if (m.includes('unable to validate email address'))
    return 'Email inválido. Verifique e tente novamente.';
  if (m.includes('network') || m.includes('fetch'))
    return 'Sem conexão com a internet. Verifique sua rede.';
  return 'Ocorreu um erro. Tente novamente.';
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmail = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Preencha email e senha.');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        Alert.alert('Conta criada!', 'Verifique seu email para confirmar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (e: any) {
      Alert.alert('Erro', translateAuthError(e.message));
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
      });
      if (error) throw error;
      if (credential.fullName?.givenName) {
        await supabase.auth.updateUser({
          data: {
            full_name: `${credential.fullName.givenName ?? ''} ${credential.fullName.familyName ?? ''}`.trim(),
          },
        });
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Erro', translateAuthError(e.message));
      }
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'lingrow://login',
        },
      });
      if (error) throw error;
      if (data?.url) {
        await Linking.openURL(data.url);
      }
    } catch (e: any) {
      Alert.alert('Erro', translateAuthError(e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoWrap}
        >
          <Ionicons name="leaf" size={40} color={colors.onPrimary} />
        </LinearGradient>
        <Text style={styles.title}>Lingrow</Text>
        <Text style={styles.sub}>Aprenda inglês com flashcards inteligentes</Text>

        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={14}
            style={styles.appleBtn}
            onPress={handleApple}
          />
        )}

        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle} disabled={loading}>
          <Text style={styles.googleBtnText}>G  Continuar com Google</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={colors.textFaint}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={colors.textFaint}
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={handleEmail} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.primaryBtnText}>{isSignUp ? 'Criar conta' : 'Entrar'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.toggleBtn}>
          <Text style={styles.toggleText}>
            {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Criar agora'}
          </Text>
        </TouchableOpacity>

        <View style={styles.privacyBtn}>
          <Text style={styles.privacyText}>Ao continuar, você concorda com nossa </Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.notion.so/Pol-tica-de-Privacidade-Lingrow-2efa44f320bd4399a11610f0803f0e8d')}>
            <Text style={styles.privacyLink}>Política de Privacidade</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  logoWrap: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', shadowColor: PRIMARY, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  title: { fontSize: 32, fontFamily: fonts.extrabold, color: PRIMARY, textAlign: 'center' },
  sub: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: 8 },
  appleBtn: {
    height: 52,
    borderRadius: 14,
  },
  googleBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  googleBtnText: { fontSize: 16, fontFamily: fonts.semibold, color: colors.text },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 13, color: colors.textFaint },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
  },
  primaryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: colors.surface, fontFamily: fonts.bold, fontSize: 16 },
  toggleBtn: { alignItems: 'center', marginTop: 4 },
  toggleText: { color: PRIMARY, fontFamily: fonts.semibold, fontSize: 14 },
  privacyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 },
  privacyText: { color: colors.textFaint, fontSize: 12 },
  privacyLink: { color: colors.textFaint, fontSize: 12, textDecorationLine: 'underline' },
});
