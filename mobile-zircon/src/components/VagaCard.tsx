import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Bookmark, Check } from 'lucide-react-native';
import { FONTS, RADII, useZirconTheme } from '@/constants/classical';
import { MODALITY_LABEL, formatBRL, formatRelativeDays, getInitials } from '@/lib/format';
import { useAuthStore } from '@/stores/authStore';
import { useSavedStore, useUserSavedIds } from '@/stores/savedStore';
import { useToastStore } from '@/stores/toastStore';
import { Tag } from '@/components/ZirconUI';
import type { Opportunity } from '@/types/api';

export function VagaCard({
  opportunity,
  applied,
  onPress,
}: {
  opportunity: Opportunity;
  applied?: boolean;
  onPress: () => void;
}) {
  const { palette } = useZirconTheme();
  const userId = useAuthStore((s) => s.user?.id);
  const savedIds = useUserSavedIds();
  const isSaved = savedIds.includes(opportunity.id);
  const toggleSaved = useSavedStore((s) => s.toggleSaved);
  const showToast = useToastStore((s) => s.showToast);

  const companyLabel = opportunity.company_name || opportunity.company_sector || 'Empresa parceira';
  const initials = getInitials(companyLabel);

  const handleToggleSave = () => {
    const added = toggleSaved(userId, opportunity.id);
    showToast(added ? 'Vaga salva' : 'Removida dos salvos');
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        gap: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: palette.divider,
        borderRadius: RADII.md,
        backgroundColor: pressed ? palette.surface : 'transparent',
      })}
    >
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
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
          <Text style={{ fontFamily: FONTS.headingSemi, fontSize: 15, color: palette.accent700 }}>{initials}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: palette.textMuted }}>{companyLabel}</Text>
          <Text style={{ fontFamily: FONTS.headingSemi, fontSize: 21, lineHeight: 24, color: palette.text }}>
            {opportunity.job_title}
          </Text>
        </View>

        <Pressable
          onPress={handleToggleSave}
          hitSlop={10}
          accessibilityLabel={isSaved ? 'Remover dos salvos' : 'Salvar vaga'}
          style={{ padding: 6 }}
        >
          <Bookmark
            size={20}
            color={isSaved ? palette.accent : palette.textMuted}
            fill={isSaved ? palette.accent : 'transparent'}
          />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        <Tag label={MODALITY_LABEL[opportunity.work_modality]} tone="accent" />
        {opportunity.company_sector ? <Tag label={opportunity.company_sector} tone="neutral" /> : null}
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: palette.divider,
        }}
      >
        <Text style={{ fontFamily: FONTS.headingSemi, fontSize: 19, color: palette.text }}>
          {formatBRL(opportunity.payment_value)}
          {opportunity.payment_value ? (
            <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: palette.textMuted }}> /mês</Text>
          ) : null}
        </Text>
        <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: palette.textMuted }}>
          {formatRelativeDays(opportunity.created_at)}
        </Text>
      </View>

      {applied ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4 }}>
          <Check size={14} color={palette.accent700} />
          <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: palette.accent700 }}>Você se candidatou</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
