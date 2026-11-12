import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, LogOut, RefreshCw, Upload } from 'lucide-react';
import { authApi, userApi } from '../services/endpoints';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { changePasswordSchema, updateProfileSchema } from '../lib/validation';
import { getApiErrorMessage } from '../lib/api';
import { getInitials, resolveAvatarUrl } from '../lib/format';
import { useMeQuery } from '../hooks/useZirconQueries';

export function ConfiguracoesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, refreshToken, tokenIssuedAt, setUser, setSession, clear } = useAuthStore();
  const showToast = useUIStore((s) => s.showToast);
  const { data: me } = useMeQuery();
  const currentUser = me || user;

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phone_number || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [profileErr, setProfileErr] = useState('');

  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [avatarErr, setAvatarErr] = useState('');

  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwErr, setPwErr] = useState('');

  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    if (!currentUser) return;
    setFullName(currentUser.full_name || '');
    setPhoneNumber(currentUser.phone_number || '');
    setBio(currentUser.bio || '');
  }, [currentUser?.id, currentUser?.full_name, currentUser?.phone_number, currentUser?.bio]);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const updateProfileMutation = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (updated) => {
      setUser(updated);
      qc.invalidateQueries({ queryKey: ['me'] });
      showToast('Perfil atualizado com sucesso');
    },
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErr('');
    const parsed = updateProfileSchema.safeParse({
      full_name: fullName.trim(),
      phone_number: phoneNumber.trim() || undefined,
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarErr('');

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarErr('Use uma imagem JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarErr('A imagem precisa ter até 5 MB.');
      return;
    }

    setUploadPct(0);
    try {
      const updated = await userApi.uploadAvatar(file, setUploadPct);
      setUser(updated);
      qc.invalidateQueries({ queryKey: ['me'] });
      showToast('Foto atualizada com sucesso');
    } catch (err) {
      setAvatarErr(getApiErrorMessage(err));
    } finally {
      setUploadPct(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
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
    try {
      await userApi.changePassword(parsed.data);
      setCurPw('');
      setNewPw('');
      setConfirmPw('');
      showToast('Senha alterada com sucesso');
    } catch (err) {
      setPwErr(getApiErrorMessage(err));
    }
  };

  const handleManualRefresh = async () => {
    if (!refreshToken) return;
    try {
      const res = await authApi.refresh(refreshToken);
      setSession({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      });
      showToast('Token de acesso renovado');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    clear();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Tem certeza que deseja excluir sua conta? Esta ação desativa seu acesso.')) return;
    try {
      await userApi.deleteAccount();
      clear();
      showToast('Conta excluída com sucesso');
      navigate('/login');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const elapsedSec = tokenIssuedAt ? Math.floor((nowMs - tokenIssuedAt) / 1000) : 0;
  const remainingSec = Math.max(0, 15 * 60 - elapsedSec);
  const remainingLabel = `${Math.floor(remainingSec / 60)}m ${String(remainingSec % 60).padStart(2, '0')}s`;
  const avatarSrc = resolveAvatarUrl(currentUser?.avatar_url);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 920 }}>
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 260px) minmax(0, 1fr)',
          gap: 40,
          paddingBottom: 36,
          borderBottom: '1px solid var(--color-divider)',
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 6px' }}>Perfil</h3>
          <p className="text-muted" style={{ fontSize: 13, textAlign: 'justify' }}>
            Exibido aos profissionais na página da vaga e no aplicativo mobile.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Avatar"
                className="plate"
                style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <span
                style={{
                  width: 88,
                  height: 88,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '50%',
                  border: '1px dashed var(--color-divider)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 30,
                  color: 'var(--color-accent-700)',
                  flexShrink: 0,
                }}
              >
                {getInitials(currentUser?.full_name || currentUser?.email)}
              </span>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                disabled={uploadPct !== null}
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={15} /> {uploadPct !== null ? `Enviando ${uploadPct}%` : 'Alterar imagem'}
              </button>
              <span className="text-muted" style={{ fontSize: 12 }}>
                JPEG, PNG ou WebP · até 5 MB
              </span>
              {avatarErr && <span style={{ fontSize: 12, color: 'var(--z-danger)' }}>{avatarErr}</span>}
            </div>
          </div>

          <div className="field">
            <label htmlFor="pf-name">Nome / Razão social</label>
            <input id="pf-name" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label htmlFor="pf-email">E-mail de login</label>
              <input id="pf-email" className="input" value={currentUser?.email || ''} disabled />
            </div>
            <div className="field">
              <label htmlFor="pf-phone">Telefone</label>
              <input id="pf-phone" className="input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="pf-bio">Sobre</label>
            <textarea
              id="pf-bio"
              className="input"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Conte aos profissionais como é trabalhar com vocês."
            />
          </div>

          {profileErr && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--z-danger)' }}>
              <AlertCircle size={15} />
              <span>{profileErr}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span className="text-muted tnum" style={{ fontSize: 12 }}>
              {currentUser?.document_type} {currentUser?.document_number} · não editável
            </span>
            <button type="submit" className="btn btn-primary" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? 'Salvando…' : 'Salvar perfil'}
            </button>
          </div>
        </form>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 260px) minmax(0, 1fr)',
          gap: 40,
          padding: '36px 0',
          borderBottom: '1px solid var(--color-divider)',
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 6px' }}>Senha</h3>
          <p className="text-muted" style={{ fontSize: 13, textAlign: 'justify' }}>
            Use pelo menos 8 caracteres com maiúscula, minúscula, número e caractere especial.
          </p>
        </div>

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label htmlFor="pw-cur">Senha atual</label>
            <input
              id="pw-cur"
              className="input"
              type="password"
              value={curPw}
              onChange={(e) => setCurPw(e.target.value)}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label htmlFor="pw-new">Nova senha</label>
              <input
                id="pw-new"
                className="input"
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="pw-cf">Confirmar nova senha</label>
              <input
                id="pw-cf"
                className="input"
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
              />
            </div>
          </div>
          {pwErr && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--z-danger)' }}>
              <AlertCircle size={15} />
              <span>{pwErr}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-secondary">
              Alterar senha
            </button>
          </div>
        </form>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 260px) minmax(0, 1fr)',
          gap: 40,
          padding: '36px 0',
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 6px' }}>Sessão</h3>
          <p className="text-muted" style={{ fontSize: 13, textAlign: 'justify' }}>
            O acesso é renovado automaticamente via refresh token enquanto você utiliza o painel.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-divider)' }}>
            <span>Token de acesso</span>
            <span className="tnum text-muted">renova em {remainingLabel}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-divider)' }}>
            <span>Sessão (refresh token)</span>
            <span className="tnum text-muted">válida por 7 dias</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-danger" onClick={handleDeleteAccount}>
              Excluir conta
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-ghost" onClick={handleManualRefresh}>
                <RefreshCw size={15} /> Renovar agora
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleLogout}>
                <LogOut size={15} /> Encerrar sessão
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
