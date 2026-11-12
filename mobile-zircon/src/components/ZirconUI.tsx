import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Check, AlertCircle } from 'lucide-react-native';
import { FONTS, RADII, useZirconTheme } from '@/constants/classical';
import { useToastStore } from '@/stores/toastStore';

export function ZirconMark({ size = 18 }: { size?: number }) {
  const { palette } = useZirconTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderWidth: 1.5,
        borderColor: palette.accent,
        transform: [{ rotate: '45deg' }],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: size + 6,
          height: size + 6,
          borderWidth: 1,
          borderColor: palette.accent2,
          position: 'absolute',
        }}
      />
    </View>
  );
}

export function Tag({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'accent' | 'accent2' | 'outline';
}) {
  const { palette } = useZirconTheme();

  const styleByTone: Record<typeof tone, { bg: string; fg: string; borderColor?: string }> = {
    accent: { bg: palette.accent100, fg: palette.accent800 },
    accent2: { bg: palette.accent2100, fg: palette.accent2800 },
    neutral: { bg: palette.neutral100, fg: palette.neutral800 },
    outline: { bg: 'transparent', fg: palette.accent, borderColor: palette.accent },
  };

  const c = styleByTone[tone];
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 3,
        backgroundColor: c.bg,
        borderWidth: c.borderColor ? 1 : 0,
        borderColor: c.borderColor,
      }}
    >
      <Text style={{ fontFamily: FONTS.body, fontSize: 11, color: c.fg }}>{label}</Text>
    </View>
  );
}

export function EditorialButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { palette } = useZirconTheme();

  const borderColor =
    variant === 'primary'
      ? palette.accent
      : variant === 'secondary'
        ? palette.divider
        : variant === 'danger'
          ? palette.danger
          : 'transparent';

  const textColor =
    variant === 'primary'
      ? palette.accent
      : variant === 'danger'
        ? palette.danger
        : variant === 'ghost'
          ? palette.accent
          : palette.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          height: 50,
          borderRadius: RADII.md,
          borderWidth: variant === 'ghost' ? 0 : 1,
          borderColor,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 18,
          opacity: disabled ? 0.45 : pressed ? 0.72 : 1,
        },
        style,
      ]}
    >
      <Text style={{ fontFamily: FONTS.headingSemi, fontSize: 17, color: textColor }}>{label}</Text>
    </Pressable>
  );
}

export function EditorialInput({
  label,
  error,
  multiline,
  style,
  ...props
}: TextInputProps & {
  label: string;
  error?: string;
}) {
  const { palette } = useZirconTheme();
  return (
    <View style={{ gap: 5 }}>
      <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: palette.textSoft }}>{label}</Text>
      <TextInput
        placeholderTextColor={palette.textMuted}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          {
            minHeight: multiline ? 108 : 48,
            paddingHorizontal: 12,
            paddingVertical: multiline ? 12 : 8,
            borderWidth: 1,
            borderColor: error ? palette.danger : palette.divider,
            borderRadius: RADII.md,
            fontFamily: FONTS.body,
            fontSize: 16,
            color: palette.text,
          },
          style,
        ]}
        {...props}
      />
      {error ? <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: palette.danger }}>{error}</Text> : null}
    </View>
  );
}

export function ToastBanner() {
  const { palette } = useZirconTheme();
  const { message, variant, hideToast } = useToastStore();
  if (!message) return null;

  return (
    <Pressable
      onPress={hideToast}
      style={[
        styles.toast,
        {
          backgroundColor: palette.surface,
          borderColor: variant === 'error' ? palette.danger : palette.divider,
        },
      ]}
    >
      {variant === 'error' ? (
        <AlertCircle size={17} color={palette.danger} />
      ) : (
        <Check size={17} color={palette.accent} />
      )}
      <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: palette.text, flex: 1 }}>{message}</Text>
    </Pressable>
  );
}

export function BottomSheetModal({
  visible,
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
  busy = false,
  danger = false,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
  danger?: boolean;
}) {
  const { palette } = useZirconTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: palette.overlay }]} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[styles.sheet, { backgroundColor: palette.surface, borderColor: palette.divider }]}
        >
          <View style={[styles.handle, { backgroundColor: palette.divider }]} />
          <Text style={{ fontFamily: FONTS.heading, fontSize: 26, color: palette.text, marginBottom: 8 }}>{title}</Text>
          <Text style={{ fontFamily: FONTS.body, fontSize: 14, lineHeight: 21, color: palette.textSoft, marginBottom: 22 }}>
            {body}
          </Text>
          <View style={{ gap: 10 }}>
            <EditorialButton
              label={confirmLabel}
              variant={danger ? 'danger' : 'primary'}
              disabled={busy}
              onPress={onConfirm}
            />
            <EditorialButton label="Voltar" variant="secondary" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 54,
    left: 16,
    right: 16,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: RADII.lg,
    borderWidth: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 34,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
  },
});
