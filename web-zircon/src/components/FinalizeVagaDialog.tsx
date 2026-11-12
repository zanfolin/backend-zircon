import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useOpportunityMutations } from '../hooks/useZirconQueries';
import { useUIStore } from '../stores/uiStore';
import { getApiErrorMessage } from '../lib/api';
import { getInitials } from '../lib/format';
import type { Application, Opportunity } from '../types/api';

interface FinalizeVagaDialogProps {
  open: boolean;
  opportunity: Opportunity | null;
  applications: Application[];
  initialWinningAppId?: number | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function FinalizeVagaDialog({
  open,
  opportunity,
  applications,
  initialWinningAppId,
  onClose,
  onSuccess,
}: FinalizeVagaDialogProps) {
  const showToast = useUIStore((s) => s.showToast);
  const { finalizeMutation } = useOpportunityMutations();

  const vacancyApps = applications.filter((a) => opportunity && a.vacancy_id === opportunity.id);
  const approvedApps = vacancyApps.filter((a) => a.status === 'APROVADA');

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (initialWinningAppId && approvedApps.some((a) => a.id === initialWinningAppId)) {
      setSelectedId(initialWinningAppId);
    } else if (approvedApps.length > 0) {
      setSelectedId(approvedApps[0].id);
    } else {
      setSelectedId(null);
    }
  }, [open, opportunity?.id, initialWinningAppId, approvedApps.length]);

  if (!open || !opportunity) return null;

  const otherActiveCount = vacancyApps.filter(
    (a) => a.id !== selectedId && ['PENDENTE', 'EM_ANALISE', 'APROVADA'].includes(a.status),
  ).length;

  const handleConfirm = async () => {
    if (!selectedId) {
      setError('Selecione o candidato aprovado que ficará com a vaga.');
      return;
    }
    setError('');
    try {
      const res = await finalizeMutation.mutateAsync({
        id: opportunity.id,
        winningApplicationId: selectedId,
      });
      const rejectedText = res.rejectedCount
        ? ` · ${res.rejectedCount} candidatura(s) encerrada(s) sem aprovação`
        : '';
      showToast(`Vaga finalizada com sucesso${rejectedText}`);
      onClose();
      onSuccess?.();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(540px, 100%)', padding: '24px 28px', gap: 16 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div className="card-kicker">Finalizar vaga</div>
            <h3 style={{ fontSize: 24, marginTop: 2 }}>{opportunity.job_title}</h3>
          </div>
          <button type="button" className="btn btn-secondary btn-icon" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        {approvedApps.length === 0 ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: 'var(--z-danger)' }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              Para finalizar esta vaga, aprove pelo menos uma candidatura antes. Se quiser encerrar sem contratar,
              altere o status ou exclua a vaga.
            </span>
          </div>
        ) : (
          <>
            <p style={{ margin: 0, textAlign: 'justify', fontSize: 14 }}>
              {approvedApps.length === 1
                ? 'Confirme o candidato aprovado que permanecerá com sucesso na vaga:'
                : 'Há mais de uma candidatura aprovada. Escolha qual candidato ficará finalizado com sucesso:'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {approvedApps.map((app) => {
                const name = app.professional_name || app.professional_email || `Profissional #${app.user_id}`;
                const checked = selectedId === app.id;
                return (
                  <label
                    key={app.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      border: `1px solid ${checked ? 'var(--color-accent)' : 'var(--color-divider)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      background: checked ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)' : 'transparent',
                    }}
                  >
                    <input
                      type="radio"
                      name="winning-app"
                      checked={checked}
                      onChange={() => setSelectedId(app.id)}
                    />
                    <span
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        background: 'var(--color-accent-100)',
                        color: 'var(--color-accent-800)',
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 600,
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(name)}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14 }}>{name}</div>
                      {app.professional_email && (
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {app.professional_email}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            <div
              style={{
                padding: '10px 12px',
                border: '1px solid var(--color-divider)',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                color: 'color-mix(in srgb, var(--color-text) 78%, transparent)',
              }}
            >
              {otherActiveCount > 0
                ? `${otherActiveCount} outra(s) candidatura(s) em andamento ou aprovada(s) será(ão) encerrada(s) automaticamente como Rejeitada(s) com notificação por e-mail. `
                : ''}
              Após finalizada, a vaga não poderá ser reaberta.
            </div>
          </>
        )}

        {error && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--z-danger)' }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Voltar
          </button>
          {approvedApps.length > 0 && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={finalizeMutation.isPending || !selectedId}
              onClick={handleConfirm}
            >
              <CheckCircle2 size={15} />
              {finalizeMutation.isPending ? 'Finalizando…' : 'Confirmar finalização'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
