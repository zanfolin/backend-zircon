import { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, FileText, LayoutDashboard, LogOut, Moon, Plus, Settings, Sun, Users } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useUIStore } from '../stores/uiStore';
import { authApi } from '../services/endpoints';
import { getInitials, resolveAvatarUrl } from '../lib/format';
import { useAllApplications, useMeQuery, useMyOpportunities } from '../hooks/useZirconQueries';
import { ZirconMark } from '../components/ZirconMark';

interface AppShellProps {
  onOpenNewVaga: () => void;
}

const PAGE_TITLES: Record<string, { kicker: string; title: string; adminTitle?: string }> = {
  '/dashboard': { kicker: 'Zircon · Painel', title: 'Visão geral' },
  '/vagas': { kicker: 'Zircon · Gestão', title: 'Minhas vagas', adminTitle: 'Todas as vagas' },
  '/candidatos': { kicker: 'Zircon · Seleção', title: 'Candidatos', adminTitle: 'Candidaturas' },
  '/usuarios': { kicker: 'Zircon · Administração', title: 'Usuários' },
  '/configuracoes': { kicker: 'Zircon · Conta', title: 'Configurações' },
};

export function AppShell({ onOpenNewVaga }: AppShellProps) {
  const { user, clear } = useAuthStore();
  const { dark, toggle } = useThemeStore();
  const showToast = useUIStore((s) => s.showToast);
  const navigate = useNavigate();
  const location = useLocation();

  const { data: me } = useMeQuery();
  const currentUser = me || user;
  const isAdmin = currentUser?.user_type === 'ADMIN';

  const { data: opportunities } = useMyOpportunities(isAdmin);
  const { data: applications } = useAllApplications(isAdmin, opportunities);

  const pendingCount = (applications || []).filter((a) => a.status === 'PENDENTE').length;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on stateless JWT logout
    }
    clear();
    showToast('Sessão encerrada');
    navigate('/login');
  };

  const navItems = isAdmin
    ? [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/usuarios', label: 'Usuários', icon: Users },
        { to: '/vagas', label: 'Vagas', icon: Briefcase },
        { to: '/candidatos', label: 'Candidaturas', icon: FileText, badge: pendingCount },
        { to: '/configuracoes', label: 'Configurações', icon: Settings },
      ]
    : [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/vagas', label: 'Minhas vagas', icon: Briefcase },
        { to: '/candidatos', label: 'Candidatos', icon: Users, badge: pendingCount },
        { to: '/configuracoes', label: 'Configurações', icon: Settings },
      ];

  const meta = PAGE_TITLES[location.pathname] || { kicker: 'Zircon', title: 'Painel' };
  const pageTitle = isAdmin && meta.adminTitle ? meta.adminTitle : meta.title;
  const avatarSrc = resolveAvatarUrl(currentUser?.avatar_url);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '248px minmax(0, 1fr)', minHeight: '100vh' }}>
      <aside
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 30,
          padding: '26px 16px 20px',
          borderRight: '1px solid var(--color-divider)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 10px' }}>
          <ZirconMark size={13} />
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 23, fontWeight: 600 }}>Zircon</span>
          <span
            className="tag tag-outline"
            style={{ marginLeft: 'auto', fontSize: 10, letterSpacing: '0.08em', padding: '2px 7px' }}
          >
            {isAdmin ? 'ADMIN' : 'EMPRESA'}
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  background: isActive ? 'color-mix(in srgb, var(--color-accent) 11%, transparent)' : 'transparent',
                  color: isActive ? 'var(--color-accent-700)' : 'var(--color-text)',
                  fontSize: 14,
                })}
              >
                <Icon size={17} strokeWidth={1.6} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge ? (
                  <span
                    className="tnum"
                    style={{
                      fontSize: 11,
                      padding: '1px 7px',
                      borderRadius: 10,
                      border: '1px solid var(--color-accent)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 8px 0',
            borderTop: '1px solid var(--color-divider)',
          }}
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="Avatar"
              style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <span
              style={{
                width: 34,
                height: 34,
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                borderRadius: '50%',
                background: 'var(--color-accent-100)',
                color: 'var(--color-accent-800)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {getInitials(currentUser?.full_name || currentUser?.email)}
            </span>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser?.full_name || 'Conta Zircon'}
            </div>
            <div
              className="text-muted"
              style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {currentUser?.email}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            style={{ width: 32, height: 32 }}
            title="Sair"
            onClick={handleLogout}
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      <main style={{ minWidth: 0 }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
            padding: '30px 40px 20px',
            borderBottom: '1px solid var(--color-divider)',
          }}
        >
          <div>
            <h6 className="text-muted" style={{ margin: '0 0 6px' }}>
              {meta.kicker}
            </h6>
            <h1 style={{ margin: 0, fontSize: 40 }}>{pageTitle}</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {!isAdmin && (
              <button type="button" className="btn btn-primary" onClick={onOpenNewVaga}>
                <Plus size={16} /> Nova vaga
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-icon"
              onClick={toggle}
              title="Alternar tema claro/escuro"
              aria-label="Alternar tema"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        <div style={{ padding: '32px 40px 72px', maxWidth: 1320 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
