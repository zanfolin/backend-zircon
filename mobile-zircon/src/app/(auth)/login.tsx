import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle, Check, ChevronLeft } from 'lucide-react-native';
import { FONTS, RADII, useZirconTheme } from '@/constants/classical';
import { authApi } from '@/services/endpoints';
import { getApiErrorMessage } from '@/lib/api';
import { loginSchema, validatePasswordStrength } from '@/lib/validation';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { EditorialButton, EditorialInput } from '@/components/ZirconUI';

export default function LoginScreen() {
  const { palette } = useZirconTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ verifiedEmail?: string }>();
  const setSession = useAuthStore((s) => s.setSession);
  const showToast = useToastStore((s) => s.showToast);

  const [email, setEmail] = useState(params.verifiedEmail || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Forgot password modal
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'reset'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotErr, setForgotErr] = useState('');

  const handleLogin = async () => {
    setError('');
    const parsed = loginSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Dados inválidos');
      return;
    }

    setBusy(true);
    try {
      const res = await authApi.login(parsed.data);
      const { user, accessToken, refreshToken } = res.data;

      if (user.user_type !== 'PROFISSIONAL') {
        setError('Empresas e administradores acessam pelo painel web.');
        return;
      }

      setSession({ user, accessToken, refreshToken });
      showToast('Login realizado com sucesso');
      router.replace('/(tabs)');
    } catch (err) {
      const msg = getApiErrorMessage(err);
      if (msg.toLowerCase().includes('não verificado')) {
        router.push({ pathname: '/(auth)/verify', params: { email: email.trim() } });
        return;
      }
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleSendForgot = async () => {
    setForgotErr('');
    if (!/^\S+@\S+\.\S+$/.test(forgotEmail.trim())) {
      setForgotErr('Informe um e-mail válido');
      return;
    }
    setBusy(true);
    try {
      await authApi.forgotPassword(forgotEmail.trim());
      setForgotStep('reset');
      showToast('Instruções enviadas ao seu e-mail');
    } catch (err) {
      setForgotErr(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async () => {
    setForgotErr('');
    if (!resetToken.trim()) {
      setForgotErr('Informe o token recebido');
      return;
    }
    const pwErr = validatePasswordStrength(newPassword);
    if (pwErr) {
      setForgotErr(pwErr);
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotErr('As senhas não conferem');
      return;
    }
    setBusy(true);
    try {
      await authApi.resetPassword({
        token: resetToken.trim(),
        password: newPassword,
        confirmPassword,
      });
      setForgotOpen(false);
      setForgotStep('email');
      showToast('Senha redefinida com sucesso');
    } catch (err) {
      setForgotErr(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 44, height: 44, marginLeft: -12, justifyContent: 'center', alignItems: 'center' }}
          >
            <ChevronLeft size={24} color={palette.text} />
          </Pressable>

          <Text style={{ fontFamily: FONTS.heading, fontSize: 36, color: palette.text, marginTop: 14, marginBottom: 6 }}>
            Entrar
          </Text>
          <Text style={{ fontFamily: FONTS.body, fontSize: 15, color: palette.textMuted, marginBottom: 24 }}>
            Bem-vindo de volta.
          </Text>

          {params.verifiedEmail ? (
            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                alignItems: 'center',
                padding: 12,
                marginBottom: 18,
                borderWidth: 1,
                borderColor: palette.accent,
                borderRadius: RADII.md,
              }}
            >
              <Check size={16} color={palette.accent700} />
              <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: palette.accent700, flex: 1 }}>
                E-mail verificado. Entre para continuar.
              </Text>
            </View>
          ) : null}

          <View style={{ gap: 16, flex: 1 }}>
            <EditorialInput
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="voce@email.com"
            />
            <EditorialInput
              label="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />

            {error ? (
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={16} color={palette.danger} />
                <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: palette.danger, flex: 1 }}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => {
                setForgotEmail(email);
                setForgotStep('email');
                setForgotErr('');
                setForgotOpen(true);
              }}
              style={{ alignSelf: 'flex-start', paddingVertical: 6 }}
            >
              <Text style={{ fontFamily: FONTS.headingSemi, fontSize: 14, color: palette.accent }}>
                Esqueci minha senha
              </Text>
            </Pressable>

            <View style={{ flex: 1, minHeight: 24 }} />

            <EditorialButton label={busy ? 'Entrando…' : 'Entrar'} disabled={busy} onPress={handleLogin} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={forgotOpen} transparent animationType="fade" onRequestClose={() => setForgotOpen(false)}>
        <Pressable
          onPress={() => setForgotOpen(false)}
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: palette.overlay }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: palette.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 22,
              paddingBottom: 34,
              gap: 14,
            }}
          >
            <Text style={{ fontFamily: FONTS.heading, fontSize: 26, color: palette.text }}>Redefinir senha</Text>
            {forgotStep === 'email' ? (
              <>
                <EditorialInput
                  label="E-mail da conta"
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {forgotErr ? <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: palette.danger }}>{forgotErr}</Text> : null}
                <EditorialButton label={busy ? 'Enviando…' : 'Enviar token'} disabled={busy} onPress={handleSendForgot} />
              </>
            ) : (
              <>
                <EditorialInput label="Token recebido por e-mail" value={resetToken} onChangeText={setResetToken} />
                <EditorialInput label="Nova senha" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
                <EditorialInput
                  label="Confirmar senha"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
                {forgotErr ? <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: palette.danger }}>{forgotErr}</Text> : null}
                <EditorialButton label={busy ? 'Salvando…' : 'Confirmar nova senha'} disabled={busy} onPress={handleResetPassword} />
              </>
            )}
            <EditorialButton label="Fechar" variant="secondary" onPress={() => setForgotOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
