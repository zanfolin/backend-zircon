import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { CheckCircle2, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useAllApplications, useMyOpportunities, useOpportunityMutations } from '../hooks/useZirconQueries';
import { MODALITY_LABEL, OPPORTUNITY_STATUS_META, formatBRL, formatDate } from '../lib/format';
import { getApiErrorMessage } from '../lib/api';
import { FinalizeVagaDialog } from '../components/FinalizeVagaDialog';
import type { Opportunity, OpportunityStatus } from '../types/api';

interface VagasPageProps {
  onOpenNew: () => void;
  onEditOpportunity: (opportunity: Opportunity) => void;
}

const columnHelper = createColumnHelper<Opportunity>();

export function VagasPage({ onOpenNew, onEditOpportunity }: VagasPageProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const showToast = useUIStore((s) => s.showToast);
  const isAdmin = user?.user_type === 'ADMIN';

  const { data: opportunities = [], isLoading } = useMyOpportunities(isAdmin);
  const { data: applications = [] } = useAllApplications(isAdmin, opportunities);
  const { updateMutation, deleteMutation, adminStatusMutation } = useOpportunityMutations();

  const [statusFilter, setStatusFilter] = useState<'TODAS' | OpportunityStatus>('TODAS');
  const [search, setSearch] = useState('');
  const [finalizingOpp, setFinalizingOpp] = useState<Opportunity | null>(null);

  const countsByVacancy = useMemo(() => {
    const map = new Map<number, number>();
    for (const app of applications) {
      if (app.status === 'CANCELADA') continue;
      map.set(app.vacancy_id, (map.get(app.vacancy_id) || 0) + 1);
    }
    return map;
  }, [applications]);

  const approvedByVacancy = useMemo(() => {
    const map = new Map<number, number>();
    for (const app of applications) {
      if (app.status === 'APROVADA') {
        map.set(app.vacancy_id, (map.get(app.vacancy_id) || 0) + 1);
      }
    }
    return map;
  }, [applications]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return opportunities.filter((v) => {
      if (statusFilter !== 'TODAS' && v.status !== statusFilter) return false;
      if (q && !(v.job_title + ' ' + (v.company_sector || '')).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [opportunities, statusFilter, search]);

  const handleTogglePause = async (opp: Opportunity) => {
    const nextStatus = opp.status === 'ATIVA' ? 'PAUSADA' : 'ATIVA';
    try {
      await updateMutation.mutateAsync({ id: opp.id, payload: { status: nextStatus } });
      showToast(nextStatus === 'PAUSADA' ? 'Vaga pausada' : 'Vaga reativada');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const handleAdminStatus = async (opp: Opportunity, status: OpportunityStatus) => {
    if (status === 'FINALIZADA') {
      setFinalizingOpp(opp);
      return;
    }
    try {
      await adminStatusMutation.mutateAsync({ id: opp.id, status });
      showToast('Status da vaga atualizado');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const handleDelete = async (opp: Opportunity) => {
    if (!window.confirm(`Excluir a vaga "${opp.job_title}"?`)) return;
    try {
      await deleteMutation.mutateAsync(opp.id);
      showToast('Vaga excluída com sucesso');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('job_title', {
        header: 'Vaga',
        cell: (info) => (
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 600, lineHeight: 1.2 }}>
              {info.getValue()}
            </div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              {info.row.original.company_sector || 'Sem setor'}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('work_modality', {
        header: 'Modalidade',
        cell: (info) => MODALITY_LABEL[info.getValue()],
      }),
      columnHelper.accessor('payment_value', {
        header: () => <div style={{ textAlign: 'right' }}>Remuneração</div>,
        cell: (info) => (
          <div className="tnum" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
            {formatBRL(info.getValue())}
          </div>
        ),
      }),
      columnHelper.display({
        id: 'candidates',
        header: () => <div style={{ textAlign: 'right' }}>Candidatos</div>,
        cell: ({ row }) => {
          const count = countsByVacancy.get(row.original.id) || 0;
          return (
            <div style={{ textAlign: 'right' }}>
              <button
                type="button"
                className="btn btn-ghost tnum"
                onClick={() => navigate(`/candidatos?vagaId=${row.original.id}`)}
              >
                {count}
              </button>
            </div>
          );
        },
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const opp = info.row.original;
          if (isAdmin && opp.status !== 'FINALIZADA') {
            return (
              <select
                className="input"
                style={{ minHeight: 30, padding: '3px 8px', fontSize: 12, width: 'auto' }}
                value={opp.status}
                onChange={(e) => handleAdminStatus(opp, e.target.value as OpportunityStatus)}
              >
                {(Object.keys(OPPORTUNITY_STATUS_META) as OpportunityStatus[]).map((st) => (
                  <option key={st} value={st}>
                    {OPPORTUNITY_STATUS_META[st].label}
                  </option>
                ))}
              </select>
            );
          }
          const meta = OPPORTUNITY_STATUS_META[opp.status];
          return <span className={`tag ${meta.tagClass}`}>{meta.label}</span>;
        },
      }),
      columnHelper.accessor('created_at', {
        header: 'Publicada',
        cell: (info) => <span className="tnum text-muted">{formatDate(info.getValue())}</span>,
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const opp = row.original;
          const isFinalized = opp.status === 'FINALIZADA';
          const canToggle = !isAdmin && (opp.status === 'ATIVA' || opp.status === 'PAUSADA');
          const hasApproved = (approvedByVacancy.get(opp.id) || 0) > 0;
          const canFinalize = (opp.status === 'ATIVA' || opp.status === 'PAUSADA') && hasApproved;

          if (isFinalized) {
            return (
              <div style={{ textAlign: 'right' }}>
                <span className="text-muted" style={{ fontSize: 12 }}>
                  Encerrada
                </span>
              </div>
            );
          }

          return (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, whiteSpace: 'nowrap' }}>
              {canFinalize && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ fontSize: 12, padding: '5px 10px' }}
                  onClick={() => setFinalizingOpp(opp)}
                >
                  <CheckCircle2 size={14} /> Finalizar
                </button>
              )}
              {canToggle && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: 13 }}
                  onClick={() => handleTogglePause(opp)}
                >
                  {opp.status === 'ATIVA' ? 'Pausar' : 'Reativar'}
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                style={{ width: 30, height: 30 }}
                title="Editar vaga"
                onClick={() => onEditOpportunity(opp)}
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                style={{ width: 30, height: 30 }}
                title="Excluir vaga"
                onClick={() => handleDelete(opp)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        },
      }),
    ],
    [approvedByVacancy, countsByVacancy, isAdmin, navigate, onEditOpportunity],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  const tabs: Array<{ key: 'TODAS' | OpportunityStatus; label: string; count: number }> = [
    { key: 'TODAS', label: 'Todas', count: opportunities.length },
    ...(Object.keys(OPPORTUNITY_STATUS_META) as OpportunityStatus[]).map((st) => ({
      key: st,
      label: OPPORTUNITY_STATUS_META[st].label,
      count: opportunities.filter((o) => o.status === st).length,
    })),
  ];

  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 18,
        }}
      >
        <div className="seg">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className="seg-opt"
              data-active={statusFilter === t.key}
              onClick={() => {
                setStatusFilter(t.key);
                table.setPageIndex(0);
              }}
            >
              <span>{t.label}</span>
              <span className="tnum" style={{ fontSize: 11, opacity: 0.6 }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: 10, opacity: 0.55 }} />
          <input
            className="input"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              table.setPageIndex(0);
            }}
            placeholder="Buscar por título ou setor"
            style={{ paddingLeft: 32 }}
          />
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isLoading && filteredData.length === 0 && (
        <div style={{ padding: '56px 0', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 6px' }}>Nenhuma vaga por aqui</h4>
          <p className="text-muted" style={{ margin: '0 0 16px' }}>
            Ajuste os filtros ou publique uma nova vaga.
          </p>
          {!isAdmin && (
            <button type="button" className="btn btn-primary" onClick={onOpenNew}>
              <Plus size={16} /> Nova vaga
            </button>
          )}
        </div>
      )}

      {filteredData.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, fontSize: 13 }}>
          <span className="text-muted tnum">
            Página {pageIndex + 1} de {Math.max(1, pageCount)} · {filteredData.length} vagas
          </span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-icon"
              style={{ width: 32, height: 32 }}
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-icon"
              style={{ width: 32, height: 32 }}
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      <FinalizeVagaDialog
        open={finalizingOpp !== null}
        opportunity={finalizingOpp}
        applications={applications}
        onClose={() => setFinalizingOpp(null)}
      />
    </>
  );
}
