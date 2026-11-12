import React, { type ComponentRef, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle, ChevronLeft, Mail } from 'lucide-react-native';
import { FONTS, RADII, useZirconTheme } from '@/constants/classical';
import { authApi } from '@/services/endpoints';
import { getApiErrorMessage } from '@/lib/api';
import { useToastStore } from '@/stores/toastStore';
import { EditorialButton } from '@/components/ZirconUI';

export default function VerifyEmailScreen() {
  const { palette } = useZirconTheme();
  const router = useRouter();
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const showToast = useToastStore((s) => s.showToast);

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(60);
  const refs = useRef<Array<ComponentRef<typeof TextInput> | null>>([]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  const code = otp.join('');

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Código deve ter 6 dígitos');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await authApi.verifyEmail(code);
      router.replace({ pathname: '/(auth)/login', params: { verifiedEmail: email } });
    } catch (err) {
      setError(getApiErrorMessage(err));
      setOtp(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendIn > 0) return;
    try {
      await authApi.resendVerification(email);
      setResendIn(60);
      setOtp(['', '', '', '', '', '']);
      setError('');
      showToast('Novo código enviado');
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg, paddingHorizontal: 24, paddingBottom: 32 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable
          onPress={() => router.replace('/(auth)/welcome')}
          style={{ width: 44, height: 44, marginLeft: -12, justifyContent: 'center', alignItems: 'center' }}
        >
          <ChevronLeft size={24} color={palette.text} />
        </Pressable>

        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            borderWidth: 1,
            borderColor: palette.accent,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 16,
            marginBottom: 20,
          }}
        >
          <Mail size={22} color={palette.accent} />
        </View>

        <Text style={{ fontFamily: FONTS.heading, fontSize: 34, color: palette.text, marginBottom: 8 }}>
          Confirme seu e-mail
        </Text>
        <Text style={{ fontFamily: FONTS.body, fontSize: 15, color: palette.textMuted, marginBottom: 26 }}>
          Digite o código de 6 dígitos enviado para <Text style={{ color: palette.text }}>{email || 'seu e-mail'}</Text>.
        </Text>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={digit}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
              style={{
                flex: 1,
                height: 58,
                borderWidth: 1,
                borderRadius: RADII.md,
                borderColor: error ? palette.danger : digit ? palette.accent : palette.divider,
                fontFamily: FONTS.heading,
                fontSize: 28,
                color: palette.text,
              }}
              onChangeText={(txt) => {
                const digits = txt.replace(/\D/g, '');
                const next = [...otp];
                if (digits.length > 1) {
                  digits
                    .slice(0, 6 - i)
                    .split('')
                    .forEach((c, idx) => {
                      next[i + idx] = c;
                    });
                  setOtp(next);
                  setError('');
                  refs.current[Math.min(5, i + digits.length)]?.focus();
                } else {
                  next[i] = digits;
                  setOtp(next);
                  setError('');
                  if (digits && i < 5) refs.current[i + 1]?.focus();
                }
              }}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
                  const next = [...otp];
                  next[i - 1] = '';
                  setOtp(next);
                  refs.current[i - 1]?.focus();
                }
              }}
            />
          ))}
        </View>

        {error ? (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <AlertCircle size={16} color={palette.danger} />
            <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: palette.danger }}>{error}</Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: palette.textMuted }}>Não chegou?</Text>
          <Pressable disabled={resendIn > 0} onPress={handleResend}>
            <Text
              style={{
                fontFamily: FONTS.headingSemi,
                fontSize: 14,
                color: palette.accent,
                opacity: resendIn > 0 ? 0.45 : 1,
              }}
            >
              {resendIn > 0 ? `Reenviar em 0:${String(resendIn).padStart(2, '0')}` : 'Reenviar código'}
            </Text>
          </Pressable>
        </View>

        <View style={{ flex: 1 }} />

        <EditorialButton
          label={busy ? 'Verificando…' : 'Confirmar'}
          disabled={busy || code.length !== 6}
          onPress={handleVerify}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
