import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bookmark, Check, ChevronLeft, ChevronRight, Mail } from 'lucide-react-native';
import { FONTS, RADII, useZirconTheme } from '@/constants/classical';
import { APPLICATION_STATUS_META, MODALITY_LABEL, formatBRL, formatShortDate, getInitials } from '@/lib/format';
import { getApiErrorMessage } from '@/lib/api';
import { useApplyMutation, useMyApplicationsQuery, useOpportunityDetail } from '@/hooks/useZirconQueries';
import { useAuthStore } from '@/stores/authStore';
import { useSavedStore, useUserSavedIds } from '@/stores/savedStore';
import { useToastStore } from '@/stores/toastStore';
import { BottomSheetModal, EditorialButton, Tag } from '@/components/ZirconUI';

export default function VagaDetailScreen() {
  const { palette } = useZirconTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const vacancyId = Number(id);

  const showToast = useToastStore((s) => s.showToast);
  const userId = useAuthStore((s) => s.user?.id);
  const savedIds = useUserSavedIds();
  const toggleSaved = useSavedStore((s) => s.toggleSaved);
  const saved = savedIds.includes(vacancyId);

  const { data: opportunity, isLoading } = useOpportunityDetail(vacancyId);
  const { data: applications = [] } = useMyApplicationsQuery();
  const applyMutation = useApplyMutation();

  const [applySheetOpen, setApplySheetOpen] = useState(false);

  const existingApplication = useMemo(
    () => applications.find((a) => a.vacancy_id === vacancyId),
    [applications, vacancyId],
  );

  const handleConfirmApply = async () => {
    try {
      await applyMutation.mutateAsync(vacancyId);
      setApplySheetOpen(false);
      showToast('Candidatura enviada');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  if (isLoading || !opportunity) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={palette.accent} />
      </SafeAreaView>
    );
  }

  const companyName = opportunity.company_name || opportunity.company_sector || 'Empresa parceira';
  const benefits = (opportunity.benefits_text || '')
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean);

  const appMeta = existingApplication ? APPLICATION_STATUS_META[existingApplication.status] : null;
  const vacancyNotOpen = opportunity.status !== 'ATIVA';
  const closedLabel =
    opportunity.status === 'FINALIZADA'
      ? 'Vaga finalizada'
      : opportunity.status === 'CANCELADA'
        ? 'Vaga cancelada'
        : 'Vaga pausada';

  const ctaLabel = existingApplication
    ? existingApplication.status === 'CANCELADA'
      ? 'Candidatura cancelada'
      : 'Candidatura enviada'
    : vacancyNotOpen
      ? closedLabel
      : 'Candidatar-se';

  const ctaDisabled = Boolean(existingApplication) || vacancyNotOpen;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: palette.bg }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 10,
          paddingVertical: 4,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={24} color={palette.text} />
        </Pressable>
        <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: palette.textMuted }}>Detalhes da vaga</Text>
        <Pressable
          onPress={() => {
            const added = toggleSaved(userId, vacancyId);
            showToast(added ? 'Vaga salva' : 'Removida dos salvos');
          }}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Bookmark
            size={22}
            color={saved ? palette.accent : palette.text}
            fill={saved ? palette.accent : 'transparent'}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }}>
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/empresa/[id]',
              params: {
                id: String(opportunity.user_id),
                name: companyName,
                email: opportunity.company_email || '',
                sector: opportunity.company_sector || '',
              },
            })
          }
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 }}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderWidth: 1,
              borderColor: palette.divider,
              borderRadius: RADII.md,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: FONTS.headingSemi, fontSize: 17, color: palette.accent700 }}>
              {getInitials(companyName)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONTS.body, fontSize: 15, color: palette.text }}>{companyName}</Text>
            <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: palette.accent700 }}>Ver perfil da empresa</Text>
          </View>
          <ChevronRight size={16} color={palette.textMuted} />
        </Pressable>

        <Text style={{ fontFamily: FONTS.heading, fontSize: 34, lineHeight: 37, color: palette.text, marginBottom: 14 }}>
          {opportunity.job_title}
        </Text>

        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          <Tag label={MODALITY_LABEL[opportunity.work_modality]} tone="accent" />
          {opportunity.company_sector ? <Tag label={opportunity.company_sector} tone="neutral" /> : null}
          {vacancyNotOpen ? <Tag label={closedLabel} tone="outline" /> : null}
        </View>

        <View
          style={{
            flexDirection: 'row',
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: palette.divider,
            marginBottom: 24,
          }}
        >
          <View style={{ flex: 1, paddingVertical: 14 }}>
            <Text
              style={{
                fontFamily: FONTS.headingSemi,
                fontSize: 11,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: palette.textMuted,
              }}
            >
              Remuneração
            </Text>
            <Text style={{ fontFamily: FONTS.heading, fontSize: 24, color: palette.text }}>
              {formatBRL(opportunity.payment_value)}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              paddingVertical: 14,
              paddingLeft: 16,
              borderLeftWidth: 1,
              borderLeftColor: palette.divider,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.headingSemi,
                fontSize: 11,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: palette.textMuted,
              }}
            >
              Publicada
            </Text>
            <Text style={{ fontFamily: FONTS.heading, fontSize: 24, color: palette.text }}>
              {formatShortDate(opportunity.created_at)}
            </Text>
          </View>
        </View>

        <Text
          style={{
            fontFamily: FONTS.headingSemi,
            fontSize: 11,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: palette.textMuted,
            marginBottom: 8,
          }}
        >
          Sobre a vaga
        </Text>
        <Text style={{ fontFamily: FONTS.body, fontSize: 15, lineHeight: 24, color: palette.text, marginBottom: 22 }}>
          {opportunity.job_description || 'Sem descrição detalhada informada.'}
        </Text>

        {benefits.length > 0 ? (
          <View style={{ marginBottom: 22 }}>
            <Text
              style={{
                fontFamily: FONTS.headingSemi,
                fontSize: 11,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: palette.textMuted,
                marginBottom: 6,
              }}
            >
              Benefícios
            </Text>
            {benefits.map((b) => (
              <View
                key={b}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: palette.divider,
                }}
              >
                <Check size={15} color={palette.accent} />
                <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: palette.text }}>{b}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {existingApplication && appMeta ? (
          <View
            style={{
              padding: 14,
              borderWidth: 1,
              borderColor: palette.accent,
              borderRadius: RADII.md,
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: palette.text }}>Sua candidatura</Text>
              <Tag label={appMeta.label} tone={appMeta.tone} />
            </View>
            {opportunity.company_email ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Mail size={14} color={palette.accent700} />
                <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: palette.accent700 }}>
                  {opportunity.company_email}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 24,
          backgroundColor: palette.bg,
          borderTopWidth: 1,
          borderTopColor: palette.divider,
        }}
      >
        <EditorialButton
          label={ctaLabel}
          disabled={ctaDisabled}
          onPress={() => setApplySheetOpen(true)}
        />
      </View>

      <BottomSheetModal
        visible={applySheetOpen}
        title="Enviar candidatura?"
        body={`${companyName} receberá seu perfil — nome, bio, e-mail e celular — e será avisada por e-mail. Você passa a ver o contato da empresa.`}
        confirmLabel={applyMutation.isPending ? 'Enviando…' : 'Enviar candidatura'}
        busy={applyMutation.isPending}
        onConfirm={handleConfirmApply}
        onClose={() => setApplySheetOpen(false)}
      />
    </SafeAreaView>
  );
}
