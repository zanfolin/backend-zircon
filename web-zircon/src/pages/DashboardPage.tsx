import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useAdminUsers, useAllApplications, useMyOpportunities } from '../hooks/useZirconQueries';
import { APPLICATION_STATUS_META, OPPORTUNITY_STATUS_META, formatDate, getInitials } from '../lib/format';
import type { OpportunityStatus } from '../types/api';

interface DashboardPageProps {
  onOpenReview: (applicationId: number) => void;
}

export function DashboardPage({ onOpenReview }: DashboardPageProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.user_type === 'ADMIN';

  const { data: opportunities = [] } = useMyOpportunities(isAdmin);
  const { data: applications = [] } = useAllApplications(isAdmin, opportunities);
  const { data: users = [] } = useAdminUsers(isAdmin);

  const activeOpportunities = opportunities.filter((v) => v.status === 'ATIVA').length;
  const finalizedOpportunities = opportunities.filter((v) => v.status === 'FINALIZADA').length;
  const pendingApplications = applications.filter((a) => a.status === 'PENDENTE').length;
  const approvedApplications = applications.filter((a) => a.status === 'APROVADA').length;
  const activeAppsCount = applications.filter((a) => a.status !== 'CANCELADA').length;

  const stats = isAdmin
    ? [
        {
          label: 'Usuários ativos',
          value: users.filter((u) => u.status === 'ATIVO').length,
          sub: `${users.filter((u) => !u.verified_email).length} aguardando verificação`,
        },
        {
          label: 'Empresas',
          value: users.filter((u) => u.user_type === 'EMPRESA').length,
          sub: `${users.filter((u) => u.status === 'BLOQUEADO').length} bloqueadas`,
        },
        {
          label: 'Profissionais',
          value: users.filter((u) => u.user_type === 'PROFISSIONAL').length,
          sub: 'cadastrados pelo app',
        },
        {
          label: 'Vagas ativas',
          value: activeOpportunities,
          sub: `de ${opportunities.length} publicadas`,
        },
      ]
    : [
        {
          label: 'Vagas ativas',
          value: activeOpportunities,
          sub: `de ${opportunities.length} publicadas`,
        },
        {
          label: 'Candidaturas',
          value: activeAppsCount,
          sub: 'recebidas no total',
        },
        {
          label: 'Aguardando',
          value: pendingApplications,
          sub: 'pendentes de análise',
        },
        {
          label: 'Aprovadas',
          value: approvedApplications,
          sub: `${finalizedOpportunities} vaga(s) finalizada(s)`,
        },
      ];

  const recentApps = applications.slice(0, 5);

  const breakdownSource: Array<[string, number]> = isAdmin
    ? [
        ['Profissionais', users.filter((u) => u.user_type === 'PROFISSIONAL').length],
        ['Empresas', users.filter((u) => u.user_type === 'EMPRESA').length],
        ['Administradores', users.filter((u) => u.user_type === 'ADMIN').length],
        ['Bloqueados', users.filter((u) => u.status === 'BLOQUEADO').length],
      ]
    : (Object.keys(OPPORTUNITY_STATUS_META) as OpportunityStatus[]).map((status) => [
        OPPORTUNITY_STATUS_META[status].label,
        opportunities.filter((o) => o.status === status).length,
      ]);

  const maxBreakdown = Math.max(1, ...breakdownSource.map(([, c]) => c));

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          borderTop: '1px solid var(--color-divider)',
          borderBottom: '1px solid var(--color-divider)',
          marginBottom: 44,
          overflow: 'hidden',
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              padding: '22px 24px 20px',
              borderLeft: '1px solid var(--color-divider)',
              marginLeft: -1,
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'color-mix(in srgb, var(--color-text) 60%, transparent)',
              }}
            >
              {s.label}
            </div>
            <div
              className="tnum"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 58,
                fontWeight: 400,
                lineHeight: 1.08,
                margin: '8px 0 2px',
              }}
            >
              {s.value}
            </div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: 44,
          alignItems: 'start',
        }}
      >
        <section style={{ gridColumn: 'span 2', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Candidaturas recentes</h3>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/candidatos')}>
              Ver todas <ChevronRight size={15} />
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Profissional</th>
                <th>Vaga</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Recebida</th>
              </tr>
            </thead>
            <tbody>
              {recentApps.map((app) => {
                const statusMeta = APPLICATION_STATUS_META[app.status];
                return (
                  <tr key={app.id} onClick={() => onOpenReview(app.id)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            width: 28,
                            height: 28,
                            flexShrink: 0,
                            display: 'grid',
                            placeItems: 'center',
                            borderRadius: '50%',
                            background: 'var(--color-accent-100)',
                            color: 'var(--color-accent-800)',
                            fontFamily: 'var(--font-heading)',
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          {getInitials(app.professional_name || app.professional_email || `U${app.user_id}`)}
                        </span>
                        <span>{app.professional_name || `Profissional #${app.user_id}`}</span>
                      </div>
                    </td>
                    <td style={{ color: 'color-mix(in srgb, var(--color-text) 75%, transparent)' }}>
                      {app.job_title || `Vaga #${app.vacancy_id}`}
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                        <span className={`tag ${statusMeta.tagClass}`}>{statusMeta.label}</span>
                        {app.status === 'APROVADA' && app.opportunity_status === 'FINALIZADA' && (
                          <span className="tag tag-accent-2">Finalizada</span>
                        )}
                      </div>
                    </td>
                    <td className="tnum text-muted" style={{ textAlign: 'right' }}>
                      {formatDate(app.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {recentApps.length === 0 && (
            <p className="text-muted" style={{ padding: '28px 0', textAlign: 'center', margin: 0 }}>
              Nenhuma candidatura recebida ainda.
            </p>
          )}
        </section>

        <section style={{ minWidth: 0 }}>
          <h3 style={{ margin: '0 0 18px' }}>{isAdmin ? 'Distribuição de usuários' : 'Status das vagas'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {breakdownSource.map(([label, count]) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 7 }}>
                  <span>{label}</span>
                  <span className="tnum text-muted">{count}</span>
                </div>
                <div style={{ position: 'relative', height: 1, background: 'var(--color-divider)' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: -1,
                      height: 3,
                      width: `${(count / maxBreakdown) * 100}%`,
                      background: 'var(--color-accent)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
