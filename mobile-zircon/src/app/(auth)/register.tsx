import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { FONTS, useZirconTheme } from '@/constants/classical';
import { authApi } from '@/services/endpoints';
import { getApiErrorMessage } from '@/lib/api';
import { maskCPFInput } from '@/lib/format';
import { registerProfessionalSchema } from '@/lib/validation';
import { EditorialButton, EditorialInput } from '@/components/ZirconUI';

export default function RegisterScreen() {
  const { palette } = useZirconTheme();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const handleRegister = async () => {
    setErrors({});
    const digits = cpf.replace(/\D/g, '');
    const parsed = registerProfessionalSchema.safeParse({
      full_name: fullName.trim(),
      document_number: digits,
      email: email.trim(),
      phone_number: phone.trim() || undefined,
      password,
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        next[String(issue.path[0] || 'form')] = issue.message;
      }
      setErrors(next);
      return;
    }

    setBusy(true);
    try {
      await authApi.register(parsed.data);
      router.replace({ pathname: '/(auth)/verify', params: { email: parsed.data.email } });
    } catch (err) {
      const msg = getApiErrorMessage(err);
      if (msg.toLowerCase().includes('e-mail')) setErrors({ email: msg });
      else if (msg.toLowerCase().includes('documento') || msg.toLowerCase().includes('cpf'))
        setErrors({ document_number: msg });
      else setErrors({ form: msg });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 36 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 44, height: 44, marginLeft: -12, justifyContent: 'center', alignItems: 'center' }}
          >
            <ChevronLeft size={24} color={palette.text} />
          </Pressable>

          <Text style={{ fontFamily: FONTS.heading, fontSize: 36, color: palette.text, marginTop: 10, marginBottom: 6 }}>
            Criar conta
          </Text>
          <Text style={{ fontFamily: FONTS.body, fontSize: 15, color: palette.textMuted, marginBottom: 22 }}>
            Seu CPF é validado no cadastro.
          </Text>

          <View style={{ gap: 14 }}>
            <EditorialInput
              label="Nome completo"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Marina Albuquerque"
              error={errors.full_name}
            />
            <EditorialInput
              label="CPF"
              value={cpf}
              onChangeText={(t) => setCpf(maskCPFInput(t))}
              keyboardType="numeric"
              placeholder="000.000.000-00"
              error={errors.document_number}
            />
            <EditorialInput
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="voce@email.com"
              error={errors.email}
            />
            <EditorialInput
              label="Celular"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="(11)99999-9999"
            />
            <EditorialInput
              label="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Mínimo 8 caracteres, maiúscula, número e símbolo"
              error={errors.password}
            />

            {errors.form ? (
              <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: palette.danger }}>{errors.form}</Text>
            ) : null}

            <EditorialButton
              label={busy ? 'Criando conta…' : 'Criar conta'}
              disabled={busy}
              onPress={handleRegister}
              style={{ marginTop: 8 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
