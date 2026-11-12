import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { opportunitySchema } from '../lib/validation';
import { useOpportunityMutations } from '../hooks/useZirconQueries';
import { useUIStore } from '../stores/uiStore';
import { getApiErrorMessage } from '../lib/api';
import type { Opportunity, WorkModality } from '../types/api';

const SECTORS = [
  'Tecnologia',
  'Design',
  'Marketing',
  'Comunicação',
  'Educação',
  'Saúde',
  'Serviços',
  'Varejo',
  'Indústria',
];

const MODALITIES: Array<{ value: WorkModality; label: string }> = [
  { value: 'HOME_OFFICE', label: 'Home office' },
  { value: 'HIBRIDO', label: 'Híbrido' },
  { value: 'PRESENCIAL', label: 'Presencial' },
];

interface VagaDialogProps {
  open: boolean;
  opportunity: Opportunity | null;
  onClose: () => void;
}

export function VagaDialog({ open, opportunity, onClose }: VagaDialogProps) {
  const showToast = useUIStore((s) => s.showToast);
  const { createMutation, updateMutation } = useOpportunityMutations();

  const [jobTitle, setJobTitle] = useState('');
  const [companySector, setCompanySector] = useState('Tecnologia');
  const [paymentValue, setPaymentValue] = useState('');
  const [workModality, setWorkModality] = useState<WorkModality>('HOME_OFFICE');
  const [jobDescription, setJobDescription] = useState('');
  const [benefitsText, setBenefitsText] = useState('');
  const [paused, setPaused] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (opportunity) {
      setJobTitle(opportunity.job_title);
      setCompanySector(opportunity.company_sector || 'Tecnologia');
      setPaymentValue(opportunity.payment_value != null ? String(opportunity.payment_value) : '');
      setWorkModality(opportunity.work_modality);
      setJobDescription(opportunity.job_description || '');
      setBenefitsText(opportunity.benefits_text || '');
      setPaused(opportunity.status === 'PAUSADA');
    } else {
      setJobTitle('');
      setCompanySector('Tecnologia');
      setPaymentValue('');
      setWorkModality('HOME_OFFICE');
      setJobDescription('');
      setBenefitsText('');
      setPaused(false);
    }
    setErrors({});
  }, [open, opportunity]);

  if (!open) return null;

  const isFinalized = opportunity?.status === 'FINALIZADA';
  const isBusy = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFinalized) return;
    setErrors({});

    const parsed = opportunitySchema.safeParse({
      job_title: jobTitle.trim(),
      company_sector: companySector,
      job_description: jobDescription.trim() || undefined,
      payment_value: paymentValue === '' ? '' : Number(paymentValue),
      benefits_text: benefitsText.trim() || undefined,
      work_modality: workModality,
      status: paused ? 'PAUSADA' : opportunity?.status === 'FINALIZADA' || opportunity?.status === 'CANCELADA' ? opportunity.status : 'ATIVA',
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || 'form');
        nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    const payload = {
      job_title: parsed.data.job_title,
      company_sector: parsed.data.company_sector,
      job_description: parsed.data.job_description,
      payment_value: typeof parsed.data.payment_value === 'number' ? parsed.data.payment_value : undefined,
      benefits_text: parsed.data.benefits_text,
      work_modality: parsed.data.work_modality,
      status: parsed.data.status,
    };

    try {
      if (opportunity) {
        await updateMutation.mutateAsync({ id: opportunity.id, payload });
        showToast('Vaga atualizada com sucesso');
      } else {
        await createMutation.mutateAsync(payload);
        showToast('Vaga publicada com sucesso');
      }
      onClose();
    } catch (err) {
      setErrors({ form: getApiErrorMessage(err) });
    }
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <form
        className="dialog"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{ width: 'min(680px, 100%)', maxHeight: 'calc(100vh - 40px)', overflow: 'auto', gap: 16, padding: '24px 28px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="card-kicker">{opportunity ? 'Editar vaga' : 'Nova vaga'}</div>
            <h3 style={{ fontSize: 26, marginTop: 2 }}>{opportunity ? opportunity.job_title : 'Publicar oportunidade'}</h3>
          </div>
          <button type="button" className="btn btn-secondary btn-icon" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        <div className="field">
          <label htmlFor="vaga-title">Título da vaga</label>
          <input
            id="vaga-title"
            className="input"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Ex.: Desenvolvedor(a) Front-end React"
          />
          {errors.job_title && <div style={{ fontSize: 12, marginTop: 5, color: 'var(--z-danger)' }}>{errors.job_title}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label htmlFor="vaga-sector">Setor</label>
            <select
              id="vaga-sector"
              className="input"
              value={companySector}
              onChange={(e) => setCompanySector(e.target.value)}
            >
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="vaga-pay">Remuneração mensal (R$)</label>
            <input
              id="vaga-pay"
              className="input tnum"
              type="number"
              min="0"
              step="100"
              value={paymentValue}
              onChange={(e) => setPaymentValue(e.target.value)}
              placeholder="8000"
            />
            {errors.payment_value && <div style={{ fontSize: 12, marginTop: 5, color: 'var(--z-danger)' }}>{errors.payment_value}</div>}
          </div>
        </div>

        <div className="field">
          <label>Modalidade</label>
          <div className="seg">
            {MODALITIES.map((m) => (
              <button
                key={m.value}
                type="button"
                className="seg-opt"
                data-active={workModality === m.value}
                onClick={() => setWorkModality(m.value)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="vaga-desc">Descrição</label>
          <textarea
            id="vaga-desc"
            className="input"
            style={{ minHeight: 120 }}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Responsabilidades, requisitos e como é o dia a dia."
          />
        </div>

        <div className="field">
          <label htmlFor="vaga-benefits">Benefícios</label>
          <input
            id="vaga-benefits"
            className="input"
            value={benefitsText}
            onChange={(e) => setBenefitsText(e.target.value)}
            placeholder="Computador, cadeira ergonômica, plano de saúde"
          />
        </div>

        {errors.form && <div style={{ fontSize: 13, color: 'var(--z-danger)' }}>{errors.form}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
          {isFinalized ? (
            <span className="text-muted" style={{ fontSize: 13 }}>
              Vaga finalizada não pode ser alterada ou reaberta.
            </span>
          ) : (
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={paused} onChange={(e) => setPaused(e.target.checked)} />
              Salvar como pausada
            </label>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {isFinalized ? 'Fechar' : 'Cancelar'}
            </button>
            {!isFinalized && (
              <button type="submit" className="btn btn-primary" disabled={isBusy}>
                {isBusy ? 'Salvando…' : opportunity ? 'Salvar alterações' : 'Publicar vaga'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
