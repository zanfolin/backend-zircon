import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';
import { Lora_400Regular, Lora_600SemiBold } from '@expo-google-fonts/lora';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useZirconTheme } from '@/constants/classical';
import { useAuthStore } from '@/stores/authStore';
import { ToastBanner } from '@/components/ZirconUI';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RootNavigator() {
  const { palette, dark } = useZirconTheme();
  const { accessToken, user, hydrated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_600SemiBold,
    Lora_400Regular,
    Lora_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded && hydrated) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, hydrated]);

  useEffect(() => {
    if (!hydrated || !fontsLoaded) return;
    const inAuthGroup = segments[0] === '(auth)';
    const isProfessional = Boolean(accessToken && user && user.user_type === 'PROFISSIONAL');

    if (!isProfessional && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (isProfessional && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [hydrated, fontsLoaded, accessToken, user, segments, router]);

  if (!fontsLoaded || !hydrated) return null;

  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.bg },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="vaga/[id]" />
        <Stack.Screen name="empresa/[id]" />
      </Stack>
      <ToastBanner />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
