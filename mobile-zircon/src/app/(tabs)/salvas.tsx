import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueries } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bookmark } from 'lucide-react-native';
import { FONTS, RADII, useZirconTheme } from '@/constants/classical';
import { formatBRL, getInitials } from '@/lib/format';
import { opportunityApi } from '@/services/endpoints';
import { useAuthStore } from '@/stores/authStore';
import { useSavedStore, useUserSavedIds } from '@/stores/savedStore';
import { useToastStore } from '@/stores/toastStore';
import { EditorialButton } from '@/components/ZirconUI';

export default function SavedScreen() {
  const { palette } = useZirconTheme();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const savedIds = useUserSavedIds();
  const toggleSaved = useSavedStore((s) => s.toggleSaved);
  const showToast = useToastStore((s) => s.showToast);

  const queries = useQueries({
    queries: savedIds.map((id) => ({
      queryKey: ['opportunity', id],
      queryFn: () => opportunityApi.getById(id),
      staleTime: 60_000,
    })),
  });

  const savedItems = queries.map((q) => q.data).filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.bg }}>
      <FlatList
        data={savedItems}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, gap: 12, flexGrow: 1 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontFamily: FONTS.heading, fontSize: 30, color: palette.text, marginBottom: 4 }}>
              Vagas salvas
            </Text>
            <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: palette.textMuted }}>
              {savedIds.length} {savedIds.length === 1 ? 'vaga guardada' : 'vagas guardadas'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const company = item.company_name || item.company_sector || 'Empresa parceira';
          return (
            <Pressable
              onPress={() => router.push(`/vaga/${item.id}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: palette.divider,
                borderRadius: RADII.md,
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderWidth: 1,
                  borderColor: palette.divider,
                  borderRadius: RADII.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: FONTS.headingSemi, fontSize: 15, color: palette.accent700 }}>
                  {getInitials(company)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTS.headingSemi, fontSize: 18, color: palette.text }}>
                  {item.job_title}
                </Text>
                <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: palette.textMuted }}>
                  {company} · {formatBRL(item.payment_value)}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  toggleSaved(userId, item.id);
                  showToast('Removida dos salvos');
                }}
                hitSlop={10}
                style={{ padding: 8 }}
              >
                <Bookmark size={20} color={palette.accent} fill={palette.accent} />
              </Pressable>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 64, gap: 10 }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                borderWidth: 1,
                borderColor: palette.divider,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bookmark size={22} color={palette.textMuted} />
            </View>
            <Text style={{ fontFamily: FONTS.headingSemi, fontSize: 20, color: palette.text }}>Nenhuma vaga salva</Text>
            <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: palette.textMuted, textAlign: 'center' }}>
              Toque no marcador de uma vaga para guardá-la aqui.
            </Text>
            <EditorialButton
              label="Explorar vagas"
              onPress={() => router.replace('/(tabs)')}
              style={{ marginTop: 8, paddingHorizontal: 24 }}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}
