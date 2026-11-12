import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, CheckCircle2, Mail, Phone, ShieldCheck, X } from 'lucide-react';
import { applicationApi, opportunityApi } from '../services/endpoints';
import { useApplicationStatusMutation, useOpportunityMutations } from '../hooks/useZirconQueries';
import { useUIStore } from '../stores/uiStore';
import { getApiErrorMessage } from '../lib/api';
import {
  APPLICATION_STATUS_META,
  MODALITY_LABEL,
  formatBRL,
  formatDate,
  getInitials,
  resolveAvatarUrl,
} from '../lib/format';
import type { ApplicationStatus } from '../types/api';

interface ReviewDialogProps {
  applicationId: number | null;
  onClose: () => void;
}

export function ReviewDialog({ applicationId, onClose }: ReviewDialogProps) {
  const showToast = useUIStore((s) => s.showToast);
  const statusMutation = useApplicationStatusMutation();
  const { finalizeMutation } = useOpportunityMutations();
  const [confirmFinalize, setConfirmFinalize] = useState(false);

  useEffect(() => {
    setConfirmFinalize(false);
  }, [applicationId]);

  const { data: app, isLoading } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => applicationApi.getById(applicationId!),
    enabled: applicationId !== null,
  });

  const { data: opportunity } = useQuery({
    queryKey: ['opportunity', app?.vacancy_id],
    queryFn: () => opportunityApi.getById(app!.vacancy_id),
    enabled: Boolean(app?.vacancy_id),
  });

  if (applicationId === null) return null;

  const isVacancyClosed = opportunity?.status === 'FINALIZADA' || opportunity?.status === 'CANCELADA';

  const handleStatus = async (status: Exclude<ApplicationStatus, 'PENDENTE'>) => {
    if (!app) return;
    try {
      await statusMutation.mutateAsync({ id: app.id, status });
      showToast('Status atualizado · o profissional foi notificado por e-mail');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const handleFinalizeVacancy = async () => {
    if (!app) return;
    try {
      const res = await finalizeMutation.mutateAsync({
        id: app.vacancy_id,
        winningApplicationId: app.id,
      });
      const rejectedText = res.rejectedCount
        ? ` · ${res.rejectedCount} outra(s) candidatura(s) encerrada(s) sem aprovação`
        : '';
      showToast(`Vaga finalizada com sucesso${rejectedText}`);
      setConfirmFinalize(false);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const statusMeta = app ? APPLICATION_STATUS_META[app.status] : null;
  const isFinal = app ? ['APROVADA', 'REJEITADA', 'CANCELADA'].includes(app.status) : false;
  const avatarSrc = resolveAvatarUrl(app?.professional_avatar);

  const historySteps = app
    ? [
        { label: 'Candidatura enviada', date: formatDate(app.created_at), active: true, pending: false },
        ...(app.status === 'EM_ANALISE' || app.status === 'APROVADA' || app.status === 'REJEITADA'
          ? [{ label: 'Em análise', date: formatDate(app.updated_at), active: true, pending: false }]
          : app.status === 'PENDENTE'
            ? [{ label: 'Em análise', date: 'Próxima etapa', active: false, pending: true }]
            : []),
        ...(isFinal
          ? [{ label: APPLICATION_STATUS_META[app.status].label, date: formatDate(app.updated_at), active: true, pending: false }]
          : []),
        ...(app.status === 'APROVADA'
          ? [
              opportunity?.status === 'FINALIZADA'
                ? { label: 'Vaga finalizada', date: formatDate(opportunity.updated_at), active: true, pending: false }
                : { label: 'Finalizar vaga', date: 'Aguardando confirmação', active: false, pending: true },
            ]
          : []),
      ]
    : [];

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(940px, 100%)', padding: 0, gap: 0, maxHeight: 'calc(100vh - 40px)', overflow: 'auto' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            padding: '22px 28px 18px',
            borderBottom: '1px solid var(--color-divider)',
          }}
        >
          <div>
            <div className="card-kicker tnum">
              Candidatura nº {applicationId} {app?.company_name ? `· ${app.company_name}` : ''}
            </div>
            <h3 style={{ margin: '4px 0 0' }}>{app?.job_title || 'Carregando detalhes…'}</h3>
          </div>
          <button type="button" className="btn btn-secondary btn-icon" onClick={onClose} title="Fechar">
            <X size={16} />
          </button>
        </div>

        {isLoading || !app ? (
          <div style={{ padding: 48, textAlign: 'center' }} className="text-muted">
            Carregando perfil do profissional…
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))' }}>
              <div style={{ padding: 28, borderRight: '1px solid var(--color-divider)' }}>
                <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 20 }}>
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={app.professional_name || 'Profissional'}
                      className="plate"
                      style={{ width: 76, height: 76, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <span
                      style={{
                        width: 76,
                        height: 76,
                        flexShrink: 0,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: '50%',
                        border: '1px solid var(--color-accent)',
                        color: 'var(--color-accent-700)',
                        fontFamily: 'var(--font-heading)',
                        fontSize: 28,
                      }}
                    >
                      {getInitials(app.professional_name || app.professional_email)}
                    </span>
                  )}
                  <div>
                    <h2 style={{ margin: '0 0 6px' }}>{app.professional_name || 'Profissional'}</h2>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {statusMeta && <span className={`tag ${statusMeta.tagClass}`}>{statusMeta.label}</span>}
                      {app.status === 'APROVADA' && opportunity?.status === 'FINALIZADA' && (
                        <span className="tag tag-accent-2">Vaga finalizada</span>
                      )}
                    </div>
                  </div>
                </div>

                <h6 className="text-muted" style={{ margin: '0 0 8px' }}>
                  Sobre
                </h6>
                <p style={{ textAlign: 'justify', margin: '0 0 24px' }}>
                  {app.professional_bio || 'O profissional ainda não adicionou uma biografia.'}
                </p>

                <h6 className="text-muted" style={{ margin: '0 0 4px' }}>
                  Contato
                </h6>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {app.professional_email && (
                    <a
                      href={`mailto:${app.professional_email}`}
                      style={{
                        display: 'flex',
                        gap: 10,
                        alignItems: 'center',
                        padding: '9px 0',
                        borderBottom: '1px solid var(--color-divider)',
                        textDecoration: 'none',
                        color: 'var(--color-text)',
                      }}
                    >
                      <Mail size={15} style={{ opacity: 0.55 }} />
                      {app.professional_email}
                    </a>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'center',
                      padding: '9px 0',
                      borderBottom: '1px solid var(--color-divider)',
                    }}
                  >
                    <Phone size={15} style={{ opacity: 0.55 }} />
                    {app.professional_phone || 'Não informado'}
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '9px 0' }}>
                    <ShieldCheck size={15} style={{ opacity: 0.55 }} />
                    Cadastro verificado
                  </div>
                </div>
              </div>

              <div style={{ padding: 28 }}>
                <h6 className="text-muted" style={{ margin: '0 0 4px' }}>
                  Detalhes
                </h6>
                <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 26 }}>
                  {[
                    ['Remuneração', formatBRL(app.payment_value)],
                    ['Modalidade', app.work_modality ? MODALITY_LABEL[app.work_modality] : '—'],
                    ['Setor', app.company_sector || '—'],
                    ['Candidatura em', formatDate(app.created_at)],
                    ['Expira em', isFinal ? '—' : formatDate(app.expiration_date)],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '9px 0',
                        borderBottom: '1px solid var(--color-divider)',
                        fontSize: 13,
                      }}
                    >
                      <span className="text-muted">{k}</span>
                      <span className="tnum" style={{ textAlign: 'right' }}>
                        {v}
                      </span>
                    </div>
                  ))}
                </div>

                <h6 className="text-muted" style={{ margin: '0 0 12px' }}>
                  Histórico
                </h6>
                <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--color-divider)', marginLeft: 5 }}>
                  {historySteps.map((step, i) => (
                    <div key={`${step.label}-${i}`} style={{ position: 'relative', padding: '0 0 16px 20px', opacity: step.pending ? 0.55 : 1 }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: -6,
                          top: 4,
                          width: 11,
                          height: 11,
                          borderRadius: '50%',
                          border: `1.5px solid ${step.pending ? 'var(--color-divider)' : 'var(--color-accent)'}`,
                          background: step.active ? 'var(--color-accent)' : 'var(--color-surface)',
                        }}
                      />
                      <div style={{ fontSize: 14 }}>{step.label}</div>
                      <div className="text-muted tnum" style={{ fontSize: 12 }}>
                        {step.date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
                flexWrap: 'wrap',
                padding: '16px 28px',
                borderTop: '1px solid var(--color-divider)',
              }}
            >
              <span className="text-muted" style={{ fontSize: 12, maxWidth: 440 }}>
                {isVacancyClosed
                  ? `Vaga ${opportunity?.status === 'FINALIZADA' ? 'finalizada' : 'cancelada'} — não aceita novas alterações nem reabertura.`
                  : app.status === 'APROVADA'
                    ? 'Aprovada. O profissional visualiza o e-mail da empresa; quando concluir a seleção, finalize a vaga para encerrar as demais candidaturas.'
                    : isFinal
                      ? 'Status final — não pode mais ser alterado.'
                      : 'Toda mudança de status envia um e-mail automático ao profissional.'}
              </span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {!isVacancyClosed && app.status === 'PENDENTE' && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={statusMutation.isPending}
                    onClick={() => handleStatus('EM_ANALISE')}
                  >
                    Iniciar análise
                  </button>
                )}
                {!isVacancyClosed && !isFinal && (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={statusMutation.isPending}
                      onClick={() => handleStatus('REJEITADA')}
                    >
                      <X size={15} /> Rejeitar
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={statusMutation.isPending}
                      onClick={() => handleStatus('APROVADA')}
                    >
                      <Check size={15} /> Aprovar candidatura
                    </button>
                  </>
                )}
                {!isVacancyClosed && app.status === 'APROVADA' && !confirmFinalize && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setConfirmFinalize(true)}
                  >
                    <CheckCircle2 size={15} /> Finalizar vaga com este candidato
                  </button>
                )}
                {!isVacancyClosed && app.status === 'APROVADA' && confirmFinalize && (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setConfirmFinalize(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={finalizeMutation.isPending}
                      onClick={handleFinalizeVacancy}
                    >
                      <CheckCircle2 size={15} />
                      {finalizeMutation.isPending ? 'Finalizando…' : 'Confirmar (rejeita demais)'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
