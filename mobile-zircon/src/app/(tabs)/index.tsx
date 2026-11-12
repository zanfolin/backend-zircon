import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { FONTS, RADII, useZirconTheme } from '@/constants/classical';
import { getInitials, resolveAvatarUrl } from '@/lib/format';
import { useAuthStore } from '@/stores/authStore';
import { useInfiniteOpportunities, useMeQuery, useMyApplicationsQuery, useSectorsQuery } from '@/hooks/useZirconQueries';
import { VagaCard } from '@/components/VagaCard';

export default function HomeScreen() {
  const { palette } = useZirconTheme();
  const router = useRouter();
  const storedUser = useAuthStore((s) => s.user);
  const { data: me } = useMeQuery();
  const currentUser = me || storedUser;

  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('Todas');

  const { data: sectors = [] } = useSectorsQuery();
  const { data: applications = [] } = useMyApplicationsQuery();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteOpportunities({
    company_sector: selectedSector === 'Todas' ? undefined : selectedSector,
    search: search.trim() || undefined,
  });

  const opportunities = useMemo(() => {
    return data?.pages.flatMap((p) => p.opportunities) ?? [];
  }, [data]);

  const totalCount = data?.pages[0]?.pagination.total ?? opportunities.length;
  const appliedVacancyIds = useMemo(() => new Set(applications.map((a) => a.vacancy_id)), [applications]);
  const sectorChips = useMemo(() => ['Todas', ...sectors], [sectors]);

  const firstName = (currentUser?.full_name || 'Profissional').split(' ')[0];
  const avatarSrc = resolveAvatarUrl(currentUser?.avatar_url);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.bg }}>
      <FlatList
        data={opportunities}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24, gap: 12 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} tintColor={palette.accent} />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 18,
              }}
            >
              <View>
                <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: palette.textMuted }}>
                  Olá, {firstName}
                </Text>
                <Text style={{ fontFamily: FONTS.heading, fontSize: 30, color: palette.text }}>Vagas para você</Text>
              </View>
              <Pressable
                onPress={() => router.push('/(tabs)/perfil')}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: palette.divider,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {avatarSrc ? (
                  <Image source={{ uri: avatarSrc }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Text style={{ fontFamily: FONTS.headingSemi, fontSize: 16, color: palette.accent700 }}>
                    {getInitials(currentUser?.full_name || currentUser?.email)}
                  </Text>
                )}
              </Pressable>
            </View>

            <View style={{ position: 'relative', marginBottom: 14 }}>
              <Search size={18} color={palette.textMuted} style={{ position: 'absolute', left: 13, top: 14 }} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Cargo, setor ou palavra-chave"
                placeholderTextColor={palette.textMuted}
                style={{
                  minHeight: 46,
                  paddingLeft: 40,
                  paddingRight: 14,
                  borderWidth: 1,
                  borderColor: palette.divider,
                  borderRadius: RADII.md,
                  fontFamily: FONTS.body,
                  fontSize: 15,
                  color: palette.text,
                }}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 18 }}
            >
              {sectorChips.map((sector) => {
                const active = selectedSector === sector;
                return (
                  <Pressable
                    key={sector}
                    onPress={() => setSelectedSector(sector)}
                    style={{
                      height: 34,
                      paddingHorizontal: 14,
                      borderRadius: 17,
                      borderWidth: 1,
                      borderColor: active ? palette.accent : palette.divider,
                      backgroundColor: active ? palette.accent100 : 'transparent',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 13,
                        color: active ? palette.accent700 : palette.text,
                      }}
                    >
                      {sector}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: palette.textMuted }}>
                {totalCount} {totalCount === 1 ? 'vaga aberta' : 'vagas abertas'}
              </Text>
              <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: palette.textMuted }}>Mais recentes</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <VagaCard
            opportunity={item}
            applied={appliedVacancyIds.has(item.id)}
            onPress={() => router.push(`/vaga/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <ActivityIndicator color={palette.accent} />
            </View>
          ) : (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <Text style={{ fontFamily: FONTS.headingSemi, fontSize: 20, color: palette.text, marginBottom: 6 }}>
                Nada encontrado
              </Text>
              <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: palette.textMuted }}>
                Tente outro termo ou setor.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={palette.accent} />
            </View>
          ) : opportunities.length > 0 && !hasNextPage ? (
            <Text style={{ textAlign: 'center', paddingVertical: 14, fontFamily: FONTS.body, fontSize: 12, color: palette.textMuted }}>
              Você viu todas as vagas
            </Text>
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}
