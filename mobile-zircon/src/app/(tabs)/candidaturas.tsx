import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail } from 'lucide-react-native';
import { FONTS, RADII, useZirconTheme } from '@/constants/classical';
import { APPLICATION_STATUS_META, formatDate } from '@/lib/format';
import { getApiErrorMessage } from '@/lib/api';
import { useCancelApplicationMutation, useMyApplicationsQuery } from '@/hooks/useZirconQueries';
import { useToastStore } from '@/stores/toastStore';
import { BottomSheetModal, Tag } from '@/components/ZirconUI';
import type { ApplicationStatus } from '@/types/api';

function getProgressSteps(status: ApplicationStatus) {
  const indexMap: Record<ApplicationStatus, number> = {
    PENDENTE: 0,
    EM_ANALISE: 1,
    APROVADA: 2,
    REJEITADA: 2,
    CANCELADA: 0,
  };
  const currentIdx = indexMap[status];
  const lastLabel = status === 'REJEITADA' ? 'Rejeitada' : status === 'CANCELADA' ? 'Cancelada' : 'Aprovada';
  return ['Enviada', 'Em análise', lastLabel].map((label, idx) => ({
    label,
    reached: idx <= currentIdx,
    mutedEnd: (status === 'REJEITADA' || status === 'CANCELADA') && idx === 2,
  }));
}

export default function ApplicationsScreen() {
  const { palette } = useZirconTheme();
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);

  const [tab, setTab] = useState<'open' | 'closed'>('open');
  const [cancelId, setCancelId] = useState<number | null>(null);

  const { data: applications = [], refetch, isRefetching } = useMyApplicationsQuery();
  const cancelMutation = useCancelApplicationMutation();

  const openApps = useMemo(
    () => applications.filter((a) => a.status === 'PENDENTE' || a.status === 'EM_ANALISE'),
    [applications],
  );
  const closedApps = useMemo(
    () => applications.filter((a) => a.status !== 'PENDENTE' && a.status !== 'EM_ANALISE'),
    [applications],
  );

  const currentList = tab === 'open' ? openApps : closedApps;

  const handleConfirmCancel = async () => {
    if (cancelId === null) return;
    try {
      await cancelMutation.mutateAsync(cancelId);
      setCancelId(null);
      showToast('Candidatura cancelada');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.bg }}>
      <FlatList
        data={currentList}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, gap: 12, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} tintColor={palette.accent} />}
        ListHeaderComponent={
          <View>
            <Text style={{ fontFamily: FONTS.heading, fontSize: 30, color: palette.text, marginBottom: 16 }}>
              Candidaturas
            </Text>

            <View
              style={{
                flexDirection: 'row',
                borderWidth: 1,
                borderColor: palette.divider,
                borderRadius: RADII.md,
                overflow: 'hidden',
                marginBottom: 8,
              }}
            >
              {(
                [
                  ['open', 'Em andamento', openApps.length],
                  ['closed', 'Encerradas', closedApps.length],
                ] as const
              ).map(([key, label, count], i) => {
                const active = tab === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setTab(key)}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 6,
                      paddingVertical: 11,
                      borderLeftWidth: i > 0 ? 1 : 0,
                      borderLeftColor: palette.divider,
                      backgroundColor: active ? palette.accent100 : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 13,
                        color: active ? palette.accent700 : palette.text,
                      }}
                    >
                      {label}
                    </Text>
                    <Text style={{ fontFamily: FONTS.body, fontSize: 11, color: palette.textMuted }}>{count}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const statusMeta = APPLICATION_STATUS_META[item.status];
          const steps = getProgressSteps(item.status);
          const canCancel = item.status === 'PENDENTE' || item.status === 'EM_ANALISE';

          return (
            <View
              style={{
                borderWidth: 1,
                borderColor: palette.divider,
                borderRadius: RADII.md,
              }}
            >
              <Pressable onPress={() => router.push(`/vaga/${item.vacancy_id}`)} style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: palette.textMuted }}>
                    {item.company_name || item.company_sector || 'Empresa'}
                  </Text>
                  <Tag label={statusMeta.label} tone={statusMeta.tone} />
                </View>

                <Text style={{ fontFamily: FONTS.headingSemi, fontSize: 20, color: palette.text, marginBottom: 14 }}>
                  {item.job_title || `Vaga #${item.vacancy_id}`}
                </Text>

                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {steps.map((st) => (
                    <View key={st.label} style={{ flex: 1 }}>
                      <View
                        style={{
                          height: 3,
                          borderRadius: 2,
                          marginBottom: 6,
                          backgroundColor: st.reached
                            ? st.mutedEnd
                              ? palette.neutral400
                              : palette.accent
                            : palette.divider,
                        }}
                      />
                      <Text
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 11,
                          color: st.reached ? palette.text : palette.textMuted,
                        }}
                      >
                        {st.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </Pressable>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderTopWidth: 1,
                  borderTopColor: palette.divider,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Mail size={14} color={palette.textMuted} />
                  <Text numberOfLines={1} style={{ fontFamily: FONTS.body, fontSize: 12, color: palette.textSoft, flex: 1 }}>
                    {item.company_email || 'Contato disponível'}
                  </Text>
                </View>
                {canCancel ? (
                  <Pressable onPress={() => setCancelId(item.id)} style={{ paddingVertical: 4, paddingHorizontal: 8 }}>
                    <Text style={{ fontFamily: FONTS.headingSemi, fontSize: 13, color: palette.accent }}>Cancelar</Text>
                  </Pressable>
                ) : (
                  <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: palette.textMuted }}>
                    {formatDate(item.created_at)}
                  </Text>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={{ paddingVertical: 56, alignItems: 'center' }}>
            <Text style={{ fontFamily: FONTS.headingSemi, fontSize: 20, color: palette.text, marginBottom: 6 }}>
              Nada por aqui
            </Text>
            <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: palette.textMuted, textAlign: 'center' }}>
              {tab === 'open'
                ? 'Candidate-se a uma vaga para acompanhar aqui.'
                : 'Candidaturas aprovadas, rejeitadas ou canceladas aparecem aqui.'}
            </Text>
          </View>
        }
      />

      <BottomSheetModal
        visible={cancelId !== null}
        title="Cancelar candidatura?"
        body="A empresa deixará de avaliar seu perfil para esta vaga."
        confirmLabel={cancelMutation.isPending ? 'Cancelando…' : 'Cancelar candidatura'}
        busy={cancelMutation.isPending}
        danger
        onConfirm={handleConfirmCancel}
        onClose={() => setCancelId(null)}
      />
    </SafeAreaView>
  );
}
