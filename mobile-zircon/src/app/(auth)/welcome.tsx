import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONTS, useZirconTheme } from '@/constants/classical';
import { EditorialButton, ZirconMark } from '@/components/ZirconUI';

export default function WelcomeScreen() {
  const { palette } = useZirconTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg, paddingHorizontal: 28, paddingVertical: 32 }}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View style={{ marginBottom: 42, marginLeft: 8 }}>
          <ZirconMark size={28} />
        </View>
        <Text
          style={{
            fontFamily: FONTS.headingSemi,
            fontSize: 12,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: palette.accent700,
            marginBottom: 14,
          }}
        >
          Zircon para profissionais
        </Text>
        <Text
          style={{
            fontFamily: FONTS.heading,
            fontSize: 46,
            lineHeight: 48,
            color: palette.text,
            marginBottom: 20,
          }}
        >
          Trabalho remoto, escolhido a dedo.
        </Text>
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 15,
            lineHeight: 24,
            color: palette.textSoft,
          }}
        >
          Encontre vagas home office em design, conteúdo e tecnologia. Candidate-se em um toque e acompanhe cada resposta.
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        <EditorialButton label="Criar conta" variant="primary" onPress={() => router.push('/(auth)/register')} />
        <EditorialButton label="Já tenho conta" variant="secondary" onPress={() => router.push('/(auth)/login')} />
      </View>
    </SafeAreaView>
  );
}
