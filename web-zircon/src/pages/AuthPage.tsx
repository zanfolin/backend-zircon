import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Check, Mail } from 'lucide-react';
import { authApi } from '../services/endpoints';
import { getApiErrorMessage } from '../lib/api';
import { loginSchema, registerSchema, validatePasswordStrength } from '../lib/validation';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { ZirconMark } from '../components/ZirconMark';

type AuthScreen = 'login' | 'register' | 'verify' | 'forgot' | 'reset';

export function AuthPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const showToast = useUIStore((s) => s.showToast);

  const [screen, setScreen] = useState<AuthScreen>('login');
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState('');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register state
  const [docType, setDocType] = useState<'CNPJ' | 'CPF' | 'Passaporte'>('CNPJ');
  const [docNumber, setDocNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  // Verify OTP state
  const [verifyEmailAddr, setVerifyEmailAddr] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Forgot / Reset password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setScreen('reset');
      return;
    }

    const codeParam = (params.get('code') || '').replace(/\D/g, '').slice(0, 6);
    const emailParam = params.get('email') || '';
    if (window.location.pathname === '/verify-email' || codeParam) {
      if (emailParam) setVerifyEmailAddr(emailParam);
      if (codeParam.length === 6) {
        setOtp(codeParam.split(''));
        setScreen('verify');
        setBusy(true);
        authApi
          .verifyEmail(codeParam)
          .then(() => {
            setBanner('E-mail verificado com sucesso. Entre para continuar.');
            if (emailParam) setLoginEmail(emailParam);
            setScreen('login');
          })
          .catch((err) => {
            setOtpError(getApiErrorMessage(err));
          })
          .finally(() => {
            setBusy(false);
          });
      } else {
        setScreen('verify');
      }
    }
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setBanner('');

    const parsed = loginSchema.safeParse({ email: loginEmail.trim(), password: loginPassword });
    if (!parsed.success) {
      setLoginError(parsed.error.issues[0]?.message || 'Dados inválidos');
      return;
    }

    setBusy(true);
    try {
      const res = await authApi.login(parsed.data);
      const { user, accessToken, refreshToken } = res.data;

      if (user.user_type === 'PROFISSIONAL') {
        setLoginError('Profissionais acessam o Zircon pelo app mobile Expo.');
        return;
      }

      setSession({ user, accessToken, refreshToken });
      showToast('Login realizado com sucesso');
      navigate('/dashboard');
    } catch (err) {
      const msg = getApiErrorMessage(err);
      if (msg.toLowerCase().includes('não verificado')) {
        setVerifyEmailAddr(loginEmail.trim());
        setOtp(['', '', '', '', '', '']);
        setOtpError('');
        setResendIn(0);
        setScreen('verify');
        return;
      }
      setLoginError(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrors({});

    const cleanedDoc = docType === 'Passaporte' ? docNumber.trim() : docNumber.replace(/\D/g, '');
    const parsed = registerSchema.safeParse({
      email: regEmail.trim(),
      password: regPassword,
      document_type: docType,
      document_number: cleanedDoc,
      full_name: fullName.trim(),
      phone_number: phone.trim() || undefined,
    });

    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || 'form');
        errs[key] = issue.message;
      }
      setRegErrors(errs);
      return;
    }

    setBusy(true);
    try {
      await authApi.register({
        ...parsed.data,
        user_type: 'EMPRESA',
      });
      setVerifyEmailAddr(parsed.data.email);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      setResendIn(60);
      setScreen('verify');
      navigate(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`, { replace: true });
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (err) {
      const msg = getApiErrorMessage(err);
      if (msg.toLowerCase().includes('e-mail')) {
        setRegErrors({ email: msg });
      } else if (msg.toLowerCase().includes('documento')) {
        setRegErrors({ document_number: msg });
      } else {
        setRegErrors({ form: msg });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setOtpError('Código deve ter 6 dígitos');
      return;
    }

    setBusy(true);
    setOtpError('');
    try {
      await authApi.verifyEmail(code);
      setBanner('E-mail verificado. Entre para continuar.');
      setLoginEmail(verifyEmailAddr);
      setLoginPassword('');
      setScreen('login');
      navigate('/login', { replace: true });
    } catch (err) {
      setOtpError(getApiErrorMessage(err));
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 0);
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    const targetEmail = verifyEmailAddr.trim();
    if (!/^\S+@\S+\.\S+$/.test(targetEmail)) {
      setOtpError('Informe um e-mail válido para enviar o código');
      return;
    }
    if (resendIn > 0) return;
    try {
      await authApi.resendVerification(targetEmail);
      setResendIn(60);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      showToast('Novo código e link enviados para seu e-mail');
    } catch (err) {
      setOtpError(getApiErrorMessage(err));
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await authApi.forgotPassword(forgotEmail.trim());
      setForgotSent(true);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    const pwErr = validatePasswordStrength(resetPassword);
    if (pwErr) {
      setResetError(pwErr);
      return;
    }
    if (resetPassword !== resetConfirm) {
      setResetError('As senhas não conferem');
      return;
    }

    setBusy(true);
    try {
      await authApi.resetPassword({
        token: resetToken.trim(),
        password: resetPassword,
        confirmPassword: resetConfirm,
      });
      setBanner('Senha redefinida com sucesso. Entre para continuar.');
      setScreen('login');
    } catch (err) {
      setResetError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 48,
          padding: '44px 56px',
          borderRight: '1px solid var(--color-divider)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <ZirconMark size={16} />
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.01em' }}>
            Zircon
          </span>
        </div>

        <div style={{ maxWidth: 520 }}>
          <h6 style={{ margin: '0 0 18px', color: 'var(--color-accent-700)' }}>Marketplace de trabalho remoto</h6>
          <h1 style={{ fontSize: 56, fontWeight: 400, lineHeight: 1.02, margin: '0 0 26px', textWrap: 'balance' }}>
            Talento remoto, contratado com critério.
          </h1>
          <p
            style={{
              textAlign: 'justify',
              hyphens: 'auto',
              maxWidth: 440,
              color: 'color-mix(in srgb, var(--color-text) 68%, transparent)',
              margin: 0,
            }}
          >
            Publique vagas home office, acompanhe cada candidatura e decida com o perfil completo do profissional em
            mãos. Documentos validados no cadastro, e-mail verificado por código e notificações automáticas a cada
            mudança de status.
          </p>
        </div>

        <div
          className="text-muted"
          style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', fontSize: 12 }}
        >
          <span>Painel para Empresas e Administração</span>
          <span>Profissionais acessam pelo app Zircon</span>
        </div>
      </div>

      <div style={{ display: 'grid', placeItems: 'center', padding: '48px 32px' }}>
        <div style={{ width: '100%', maxWidth: 390 }}>
          {screen === 'login' && (
            <>
              <h2 style={{ margin: '0 0 6px' }}>Entrar</h2>
              <p className="text-muted" style={{ margin: '0 0 28px' }}>
                Acesse o painel da sua empresa ou administração.
              </p>
              {banner && (
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    padding: '10px 12px',
                    marginBottom: 20,
                    border: '1px solid var(--color-accent)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 13,
                    color: 'var(--color-accent-700)',
                  }}
                >
                  <Check size={16} />
                  <span>{banner}</span>
                </div>
              )}

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="field">
                  <label htmlFor="login-email">E-mail</label>
                  <input
                    id="login-email"
                    className="input"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="voce@empresa.com.br"
                  />
                </div>
                <div className="field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <label htmlFor="login-password">Senha</label>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontSize: 12, padding: '0 4px' }}
                      onClick={() => {
                        setForgotSent(false);
                        setForgotEmail(loginEmail);
                        setScreen('forgot');
                      }}
                    >
                      Esqueci a senha
                    </button>
                  </div>
                  <input
                    id="login-password"
                    className="input"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                {loginError && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--z-danger)' }}>
                    <AlertCircle size={15} />
                    <span>{loginError}</span>
                  </div>
                )}
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 11, fontSize: 15 }} disabled={busy}>
                  {busy ? 'Entrando…' : 'Entrar'}
                </button>
              </form>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, fontSize: 12 }} className="text-muted">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Seed:</span>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ fontSize: 12 }}
                    onClick={() => {
                      setLoginEmail('admin@admin.com');
                      setLoginPassword('Senha123!');
                      setLoginError('');
                    }}
                  >
                    Preencher Admin
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: 12 }}
                  onClick={() => {
                    setVerifyEmailAddr(loginEmail.trim());
                    setOtp(['', '', '', '', '', '']);
                    setOtpError('');
                    setResendIn(0);
                    setScreen('verify');
                  }}
                >
                  Verificar e-mail / Reenviar código
                </button>
              </div>

              <hr className="hr" style={{ margin: '24px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span className="text-muted">Ainda não tem conta?</span>
                <button type="button" className="btn btn-secondary" onClick={() => setScreen('register')}>
                  Cadastrar empresa
                </button>
              </div>
            </>
          )}

          {screen === 'register' && (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ margin: '0 0 18px -4px' }}
                onClick={() => setScreen('login')}
              >
                <ArrowLeft size={16} /> Voltar
              </button>
              <h2 style={{ margin: '0 0 6px' }}>Cadastrar empresa</h2>
              <p className="text-muted" style={{ margin: '0 0 24px' }}>
                Validamos o documento e enviamos um código ao seu e-mail.
              </p>

              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="field">
                  <label>Tipo de documento</label>
                  <div className="seg">
                    {(['CNPJ', 'CPF', 'Passaporte'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        className="seg-opt"
                        data-active={docType === t}
                        onClick={() => setDocType(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="reg-doc">{docType}</label>
                  <input
                    id="reg-doc"
                    className="input tnum"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder={docType === 'CNPJ' ? '00.000.000/0001-00' : docType === 'CPF' ? '000.000.000-00' : 'AB123456'}
                  />
                  {regErrors.document_number && (
                    <div style={{ fontSize: 12, marginTop: 5, color: 'var(--z-danger)' }}>{regErrors.document_number}</div>
                  )}
                </div>

                <div className="field">
                  <label htmlFor="reg-name">Razão social ou nome</label>
                  <input
                    id="reg-name"
                    className="input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Lumen Estúdio Digital"
                  />
                  {regErrors.full_name && (
                    <div style={{ fontSize: 12, marginTop: 5, color: 'var(--z-danger)' }}>{regErrors.full_name}</div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="field">
                    <label htmlFor="reg-email">E-mail</label>
                    <input
                      id="reg-email"
                      className="input"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="rh@empresa.com"
                    />
                    {regErrors.email && <div style={{ fontSize: 12, marginTop: 5, color: 'var(--z-danger)' }}>{regErrors.email}</div>}
                  </div>
                  <div className="field">
                    <label htmlFor="reg-phone">Telefone</label>
                    <input
                      id="reg-phone"
                      className="input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11)99999-9999"
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="reg-pw">Senha</label>
                  <input
                    id="reg-pw"
                    className="input"
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres, maiúscula, número e símbolo"
                  />
                  {regErrors.password && (
                    <div style={{ fontSize: 12, marginTop: 5, color: 'var(--z-danger)' }}>{regErrors.password}</div>
                  )}
                </div>

                {regErrors.form && <div style={{ fontSize: 13, color: 'var(--z-danger)' }}>{regErrors.form}</div>}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: 11, fontSize: 15, marginTop: 6 }}
                  disabled={busy}
                >
                  {busy ? 'Criando conta…' : 'Criar conta'}
                </button>
              </form>
            </>
          )}

          {screen === 'verify' && (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ margin: '0 0 18px -4px' }}
                onClick={() => setScreen('login')}
              >
                <ArrowLeft size={16} /> Voltar
              </button>
              <div
                style={{
                  width: 44,
                  height: 44,
                  display: 'grid',
                  placeItems: 'center',
                  border: '1px solid var(--color-accent)',
                  borderRadius: '50%',
                  color: 'var(--color-accent)',
                  marginBottom: 18,
                }}
              >
                <Mail size={18} />
              </div>
              <h2 style={{ margin: '0 0 6px' }}>Verifique seu e-mail</h2>
              <p className="text-muted" style={{ margin: '0 0 18px' }}>
                {verifyEmailAddr
                  ? 'Digite o código de 6 dígitos enviado para o seu e-mail ou solicite um novo código abaixo.'
                  : 'Informe o e-mail da conta para solicitar o código ou digite o código já recebido.'}
              </p>

              <div className="field" style={{ marginBottom: 16 }}>
                <label htmlFor="verify-email">E-mail da conta</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    id="verify-email"
                    className="input"
                    type="email"
                    value={verifyEmailAddr}
                    onChange={(e) => setVerifyEmailAddr(e.target.value)}
                    placeholder="empresa@dominio.com.br"
                  />
                  <button
                    type="button"
                    className="btn btn-secondary tnum"
                    style={{ whiteSpace: 'nowrap' }}
                    disabled={resendIn > 0}
                    onClick={handleResend}
                  >
                    {resendIn > 0 ? `0:${String(resendIn).padStart(2, '0')}` : 'Enviar código'}
                  </button>
                </div>
              </div>

              <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                  {otp.map((val, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      value={val}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      aria-label={`Dígito ${i + 1}`}
                      className="input tnum"
                      style={{
                        height: 58,
                        textAlign: 'center',
                        padding: 0,
                        fontFamily: 'var(--font-heading)',
                        fontSize: 30,
                        borderColor: otpError ? 'var(--z-danger)' : val ? 'var(--color-accent)' : 'var(--color-divider)',
                      }}
                      onChange={(e) => {
                        const d = e.target.value.replace(/\D/g, '');
                        const next = [...otp];
                        if (d.length > 1) {
                          d.slice(0, 6 - i)
                            .split('')
                            .forEach((ch, idx) => {
                              next[i + idx] = ch;
                            });
                          setOtp(next);
                          setOtpError('');
                          otpRefs.current[Math.min(5, i + d.length)]?.focus();
                        } else {
                          next[i] = d;
                          setOtp(next);
                          setOtpError('');
                          if (d && i < 5) otpRefs.current[i + 1]?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[i] && i > 0) {
                          const next = [...otp];
                          next[i - 1] = '';
                          setOtp(next);
                          otpRefs.current[i - 1]?.focus();
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                        if (!pasted) return;
                        e.preventDefault();
                        const next = ['', '', '', '', '', ''];
                        pasted.split('').forEach((ch, idx) => {
                          next[idx] = ch;
                        });
                        setOtp(next);
                        setOtpError('');
                        otpRefs.current[Math.min(5, pasted.length)]?.focus();
                      }}
                    />
                  ))}
                </div>

                {otpError && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--z-danger)' }}>
                    <AlertCircle size={15} />
                    <span>{otpError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: 11, fontSize: 15 }}
                  disabled={busy || otp.join('').length !== 6}
                >
                  {busy ? 'Verificando…' : 'Confirmar código'}
                </button>
              </form>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, fontSize: 13 }}>
                <span className="text-muted">Não recebeu o código?</span>
                <button
                  type="button"
                  className="btn btn-ghost tnum"
                  disabled={resendIn > 0}
                  onClick={handleResend}
                >
                  {resendIn > 0 ? `Reenviar em 0:${String(resendIn).padStart(2, '0')}` : 'Reenviar código'}
                </button>
              </div>
            </>
          )}

          {screen === 'forgot' && (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ margin: '0 0 18px -4px' }}
                onClick={() => setScreen('login')}
              >
                <ArrowLeft size={16} /> Voltar
              </button>
              <h2 style={{ margin: '0 0 6px' }}>Redefinir senha</h2>
              {!forgotSent ? (
                <>
                  <p className="text-muted" style={{ margin: '0 0 24px' }}>
                    Informe o e-mail da conta. Enviaremos um token/link para criar uma nova senha.
                  </p>
                  <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="field">
                      <label htmlFor="forgot-email">E-mail</label>
                      <input
                        id="forgot-email"
                        className="input"
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="voce@empresa.com.br"
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 11, fontSize: 15 }} disabled={busy}>
                      {busy ? 'Enviando…' : 'Enviar link'}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <p style={{ margin: '12px 0 24px', textAlign: 'justify' }}>
                    Se houver uma conta para <span style={{ color: 'var(--color-accent-700)' }}>{forgotEmail}</span>, o
                    token de redefinição foi enviado por e-mail.
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setScreen('login')}>
                      Voltar ao login
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => setScreen('reset')}>
                      Tenho o token
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {screen === 'reset' && (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ margin: '0 0 18px -4px' }}
                onClick={() => setScreen('login')}
              >
                <ArrowLeft size={16} /> Voltar
              </button>
              <h2 style={{ margin: '0 0 6px' }}>Criar nova senha</h2>
              <p className="text-muted" style={{ margin: '0 0 24px' }}>
                Cole o token recebido por e-mail e defina a nova senha.
              </p>
              <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="field">
                  <label htmlFor="reset-token">Token</label>
                  <input
                    id="reset-token"
                    className="input"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="reset-pw">Nova senha</label>
                  <input
                    id="reset-pw"
                    className="input"
                    type="password"
                    required
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="reset-confirm">Confirmar senha</label>
                  <input
                    id="reset-confirm"
                    className="input"
                    type="password"
                    required
                    value={resetConfirm}
                    onChange={(e) => setResetConfirm(e.target.value)}
                  />
                </div>
                {resetError && <div style={{ fontSize: 13, color: 'var(--z-danger)' }}>{resetError}</div>}
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 11, fontSize: 15 }} disabled={busy}>
                  {busy ? 'Salvando…' : 'Redefinir senha'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
