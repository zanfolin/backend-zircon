import React, { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Check, ChevronRight, Lock, LogOut, Moon, Pencil, Sun } from 'lucide-react-native';
import { FONTS, RADII, useZirconTheme } from '@/constants/classical';
import { authApi, userApi } from '@/services/endpoints';
import { getApiErrorMessage } from '@/lib/api';
import { formatDate, getInitials, maskCPFDisplay, resolveAvatarUrl } from '@/lib/format';
import { changePasswordSchema, updateProfileSchema } from '@/lib/validation';
import { useAuthStore } from '@/stores/authStore';
import { useSavedStore } from '@/stores/savedStore';
import { useThemeStore } from '@/stores/themeStore';
import { useToastStore } from '@/stores/toastStore';
import { useMeQuery } from '@/hooks/useZirconQueries';
import { BottomSheetModal, EditorialButton, EditorialInput } from '@/components/ZirconUI';

export default function ProfileScreen() {
  const { palette, dark } = useZirconTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const { user, setUser, clear } = useAuthStore();
  const clearUserSaved = useSavedStore((s) => s.clearUserSaved);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const showToast = useToastStore((s) => s.showToast);

  const { data: me } = useMeQuery();
  const currentUser = me || user;

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.phone_number || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [profileErr, setProfileErr] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  const [sheet, setSheet] = useState<'logout' | 'delete' | null>(null);
  const [busyAction, setBusyAction] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setFullName(currentUser.full_name || '');
    setPhone(currentUser.phone_number || '');
    setBio(currentUser.bio || '');
  }, [currentUser?.id, currentUser?.full_name, currentUser?.phone_number, currentUser?.bio]);

  const updateProfileMutation = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (updated) => {
      setUser(updated);
      qc.invalidateQueries({ queryKey: ['me'] });
      setEditing(false);
      showToast('Perfil atualizado');
    },
  });

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('Permita acesso às fotos para alterar seu avatar', 'error');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (res.canceled || !res.assets[0]) return;

    const asset = res.assets[0];
    setUploadingAvatar(true);
    try {
      const updated = await userApi.uploadAvatar({
        uri: asset.uri,
        name: asset.fileName || 'avatar.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
      setUser(updated);
      qc.invalidateQueries({ queryKey: ['me'] });
      showToast('Foto atualizada');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setProfileErr('');
    const parsed = updateProfileSchema.safeParse({
      full_name: fullName.trim(),
      phone_number: phone.trim() || undefined,
      bio: bio.trim() || undefined,
    });
    if (!parsed.success) {
      setProfileErr(parsed.error.issues[0]?.message || 'Dados inválidos');
      return;
    }
    try {
      await updateProfileMutation.mutateAsync(parsed.data);
    } catch (err) {
      setProfileErr(getApiErrorMessage(err));
    }
  };

  const handleChangePassword = async () => {
    setPwErr('');
    const parsed = changePasswordSchema.safeParse({
      currentPassword: curPw,
      newPassword: newPw,
      confirmPassword: confirmPw,
    });
    if (!parsed.success) {
      setPwErr(parsed.error.issues[0]?.message || 'Dados inválidos');
      return;
    }
    setPwBusy(true);
    try {
      await userApi.changePassword(parsed.data);
      setPasswordModalOpen(false);
      setCurPw('');
      setNewPw('');
      setConfirmPw('');
      showToast('Senha alterada com sucesso');
    } catch (err) {
      setPwErr(getApiErrorMessage(err));
    } finally {
      setPwBusy(false);
    }
  };

  const handleConfirmSheet = async () => {
    setBusyAction(true);
    try {
      if (sheet === 'logout') {
        await authApi.logout().catch(() => {});
        clear();
        qc.clear();
        setSheet(null);
        router.replace('/(auth)/welcome');
      } else if (sheet === 'delete') {
        await userApi.deleteAccount();
        clearUserSaved(currentUser?.id);
        clear();
        qc.clear();
        setSheet(null);
        showToast('Conta excluída');
        router.replace('/(auth)/welcome');
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setBusyAction(false);
    }
  };

  const avatarSrc = resolveAvatarUrl(currentUser?.avatar_url);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36 }}>
        <View style={{ alignItems: 'center', paddingVertical: 14 }}>
          <View style={{ position: 'relative', marginBottom: 14 }}>
            {avatarSrc ? (
              <Image
                source={{ uri: avatarSrc }}
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 52,
                  borderWidth: 4,
                  borderColor: palette.surface,
                }}
              />
            ) : (
              <View
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 52,
                  borderWidth: 1,
                  borderColor: palette.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: FONTS.heading, fontSize: 38, color: palette.accent700 }}>
                  {getInitials(currentUser?.full_name || currentUser?.email)}
                </Text>
              </View>
            )}

            <Pressable
              onPress={handlePickAvatar}
              disabled={uploadingAvatar}
              accessibilityLabel="Alterar foto"
              style={{
                position: 'absolute',
                right: -4,
                bottom: -2,
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: palette.accent,
                backgroundColor: palette.bg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Camera size={18} color={palette.accent} />
            </Pressable>
          </View>

          <Text style={{ fontFamily: FONTS.heading, fontSize: 28, color: palette.text, marginBottom: 4 }}>
            {currentUser?.full_name || 'Profissional'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: palette.textSoft }}>{currentUser?.email}</Text>
            <Check size={14} color={palette.accent} />
          </View>
        </View>

        {!editing ? (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontFamily: FONTS.body, fontSize: 14, lineHeight: 22, color: palette.text, marginBottom: 18 }}>
              {currentUser?.bio || 'Adicione uma breve descrição sobre sua experiência para as empresas.'}
            </Text>
            <View style={{ borderTopWidth: 1, borderTopColor: palette.divider, marginBottom: 18 }}>
              {[
                ['Celular', currentUser?.phone_number || 'Não informado'],
                ['CPF', maskCPFDisplay(currentUser?.document_number)],
                ['Membro desde', formatDate(currentUser?.created_at)],
              ].map(([k, v]) => (
                <View
                  key={k}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: palette.divider,
                  }}
                >
                  <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: palette.textMuted }}>{k}</Text>
                  <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: palette.text }}>{v}</Text>
                </View>
              ))}
            </View>
            <Pressable
              onPress={() => setEditing(true)}
              style={{
                height: 46,
                borderRadius: RADII.md,
                borderWidth: 1,
                borderColor: palette.divider,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Pencil size={15} color={palette.text} />
              <Text style={{ fontFamily: FONTS.headingSemi, fontSize: 16, color: palette.text }}>Editar perfil</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 14, marginBottom: 26 }}>
            <EditorialInput label="Nome completo" value={fullName} onChangeText={setFullName} />
            <EditorialInput label="Celular" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <EditorialInput label="Sobre você" value={bio} onChangeText={setBio} multiline />
            {profileErr ? <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: palette.danger }}>{profileErr}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <EditorialButton
                label="Cancelar"
                variant="secondary"
                onPress={() => setEditing(false)}
                style={{ flex: 1, height: 46 }}
              />
              <EditorialButton
                label={updateProfileMutation.isPending ? 'Salvando…' : 'Salvar'}
                disabled={updateProfileMutation.isPending}
                onPress={handleSaveProfile}
                style={{ flex: 1, height: 46 }}
              />
            </View>
          </View>
        )}

        <Text
          style={{
            fontFamily: FONTS.headingSemi,
            fontSize: 12,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: palette.textMuted,
            marginBottom: 6,
          }}
        >
          Preferências
        </Text>

        <View style={{ borderTopWidth: 1, borderTopColor: palette.divider }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              minHeight: 54,
              borderBottomWidth: 1,
              borderBottomColor: palette.divider,
            }}
          >
            {dark ? <Sun size={18} color={palette.textSoft} /> : <Moon size={18} color={palette.textSoft} />}
            <Text style={{ flex: 1, fontFamily: FONTS.body, fontSize: 15, color: palette.text }}>Tema escuro</Text>
            <Switch
              value={dark}
              onValueChange={toggleTheme}
              trackColor={{ false: palette.divider, true: palette.accent100 }}
              thumbColor={dark ? palette.accent : palette.neutral400}
            />
          </View>

          <Pressable
            onPress={() => {
              setPwErr('');
              setPasswordModalOpen(true);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              minHeight: 54,
              borderBottomWidth: 1,
              borderBottomColor: palette.divider,
            }}
          >
            <Lock size={18} color={palette.textSoft} />
            <Text style={{ flex: 1, fontFamily: FONTS.body, fontSize: 15, color: palette.text }}>Alterar senha</Text>
            <ChevronRight size={16} color={palette.textMuted} />
          </Pressable>

          <Pressable
            onPress={() => setSheet('logout')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              minHeight: 54,
              borderBottomWidth: 1,
              borderBottomColor: palette.divider,
            }}
          >
            <LogOut size={18} color={palette.textSoft} />
            <Text style={{ flex: 1, fontFamily: FONTS.body, fontSize: 15, color: palette.text }}>Sair</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => setSheet('delete')} style={{ alignSelf: 'center', marginTop: 20, padding: 8 }}>
          <Text style={{ fontFamily: FONTS.headingSemi, fontSize: 14, color: palette.danger }}>Excluir minha conta</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={passwordModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordModalOpen(false)}
      >
        <Pressable
          onPress={() => setPasswordModalOpen(false)}
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: palette.overlay }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: palette.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 22,
              paddingBottom: 34,
              gap: 14,
            }}
          >
            <Text style={{ fontFamily: FONTS.heading, fontSize: 26, color: palette.text }}>Alterar senha</Text>
            <EditorialInput label="Senha atual" value={curPw} onChangeText={setCurPw} secureTextEntry />
            <EditorialInput label="Nova senha" value={newPw} onChangeText={setNewPw} secureTextEntry />
            <EditorialInput label="Confirmar nova senha" value={confirmPw} onChangeText={setConfirmPw} secureTextEntry />
            {pwErr ? <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: palette.danger }}>{pwErr}</Text> : null}
            <EditorialButton label={pwBusy ? 'Salvando…' : 'Salvar senha'} disabled={pwBusy} onPress={handleChangePassword} />
            <EditorialButton label="Voltar" variant="secondary" onPress={() => setPasswordModalOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>

      <BottomSheetModal
        visible={sheet === 'logout'}
        title="Sair do Zircon?"
        body="Sua sessão será encerrada neste aparelho e o token de acesso descartado."
        confirmLabel={busyAction ? 'Saindo…' : 'Sair'}
        busy={busyAction}
        onConfirm={handleConfirmSheet}
        onClose={() => setSheet(null)}
      />

      <BottomSheetModal
        visible={sheet === 'delete'}
        title="Excluir sua conta?"
        body="Seu perfil deixa de aparecer para as empresas e suas candidaturas em andamento são encerradas."
        confirmLabel={busyAction ? 'Excluindo…' : 'Excluir conta'}
        busy={busyAction}
        danger
        onConfirm={handleConfirmSheet}
        onClose={() => setSheet(null)}
      />
    </SafeAreaView>
  );
}
