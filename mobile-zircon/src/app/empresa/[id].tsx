import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Lock, Mail, ShieldCheck } from 'lucide-react-native';
import { FONTS, RADII, useZirconTheme } from '@/constants/classical';
import { MODALITY_LABEL, formatBRL, getInitials } from '@/lib/format';
import { useCompanyOpportunities, useMyApplicationsQuery } from '@/hooks/useZirconQueries';

export default function EmpresaProfileScreen() {
  const { palette } = useZirconTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; name?: string; email?: string; sector?: string }>();
  const companyId = Number(params.id);

  const { data: openOpportunities = [], isLoading } = useCompanyOpportunities(companyId);
  const { data: myApplications = [] } = useMyApplicationsQuery();

  const hasAppliedToCompany = useMemo(() => {
    const oppIds = new Set(openOpportunities.map((o) => o.id));
    return myApplications.some((a) => oppIds.has(a.vacancy_id) || a.opportunity_user_id === companyId);
  }, [myApplications, openOpportunities, companyId]);

  const companyName = params.name || openOpportunities[0]?.company_sector || `Empresa #${companyId}`;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={24} color={palette.text} />
        </Pressable>
        <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: palette.textMuted }}>Empresa</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        <View style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.divider }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderWidth: 1,
              borderColor: palette.accent,
              borderRadius: RADII.lg,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ fontFamily: FONTS.heading, fontSize: 28, color: palette.accent700 }}>
              {getInitials(companyName)}
            </Text>
          </View>
          <Text style={{ fontFamily: FONTS.heading, fontSize: 34, color: palette.text, marginBottom: 4 }}>
            {companyName}
          </Text>
          <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: palette.textMuted }}>
            {params.sector || 'Marketplace Zircon'}
          </Text>
        </View>

        <View style={{ borderBottomWidth: 1, borderBottomColor: palette.divider, marginBottom: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: palette.divider,
            }}
          >
            <Mail size={16} color={palette.textMuted} />
            {hasAppliedToCompany && params.email ? (
              <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: palette.text }}>{params.email}</Text>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Lock size={14} color={palette.textMuted} />
                <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: palette.textMuted }}>
                  Visível após sua candidatura
                </Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 }}>
            <ShieldCheck size={16} color={palette.textMuted} />
            <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: palette.text }}>Documento verificado</Text>
          </View>
        </View>

        <Text
          style={{
            fontFamily: FONTS.headingSemi,
            fontSize: 11,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: palette.textMuted,
            marginBottom: 10,
          }}
        >
          Vagas abertas · {openOpportunities.length}
        </Text>

        {isLoading ? (
          <ActivityIndicator color={palette.accent} style={{ marginTop: 20 }} />
        ) : (
          <View style={{ borderTopWidth: 1, borderTopColor: palette.divider }}>
            {openOpportunities.map((v) => (
              <Pressable
                key={v.id}
                onPress={() => router.push(`/vaga/${v.id}`)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: palette.divider,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONTS.headingSemi, fontSize: 18, color: palette.text }}>
                    {v.job_title}
                  </Text>
                  <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: palette.textMuted }}>
                    {MODALITY_LABEL[v.work_modality]} · {formatBRL(v.payment_value)}
                  </Text>
                </View>
                <ChevronRight size={16} color={palette.textMuted} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
