import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useAllApplications, useMyOpportunities } from '../hooks/useZirconQueries';
import { APPLICATION_STATUS_META, formatDate, getInitials } from '../lib/format';
import type { Application, ApplicationStatus } from '../types/api';

interface CandidatosPageProps {
  onOpenReview: (applicationId: number) => void;
}

const columnHelper = createColumnHelper<Application>();

export function CandidatosPage({ onOpenReview }: CandidatosPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.user_type === 'ADMIN';

  const { data: opportunities = [] } = useMyOpportunities(isAdmin);
  const { data: applications = [], isLoading } = useAllApplications(isAdmin, opportunities);

  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'FINALIZADA' | ApplicationStatus>('TODOS');
  const [vacancyFilter, setVacancyFilter] = useState<string>(searchParams.get('vagaId') || 'all');

  useEffect(() => {
    const param = searchParams.get('vagaId');
    if (param) setVacancyFilter(param);
  }, [searchParams]);

  const byVacancy = useMemo(() => {
    return applications.filter((a) => vacancyFilter === 'all' || String(a.vacancy_id) === vacancyFilter);
  }, [applications, vacancyFilter]);

  const filtered = useMemo(() => {
    if (statusFilter === 'TODOS') return byVacancy;
    if (statusFilter === 'FINALIZADA') {
      return byVacancy.filter((a) => a.status === 'APROVADA' && a.opportunity_status === 'FINALIZADA');
    }
    return byVacancy.filter((a) => a.status === statusFilter);
  }, [byVacancy, statusFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('professional_name', {
        header: 'Profissional',
        cell: ({ row }) => {
          const app = row.original;
          const name = app.professional_name || `Profissional #${app.user_id}`;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '50%',
                  background: 'var(--color-accent-100)',
                  color: 'var(--color-accent-800)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {getInitials(name)}
              </span>
              <div>
                <div>{name}</div>
                {app.professional_email && (
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {app.professional_email}
                  </div>
                )}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('job_title', {
        header: 'Vaga',
        cell: ({ row }) => row.original.job_title || `Vaga #${row.original.vacancy_id}`,
      }),
      ...(isAdmin
        ? [
            columnHelper.accessor('company_name', {
              header: 'Empresa',
              cell: (info) => info.getValue() || '—',
            }),
          ]
        : []),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => {
          const app = row.original;
          const meta = APPLICATION_STATUS_META[app.status];
          const isVacancyFinalized = app.status === 'APROVADA' && app.opportunity_status === 'FINALIZADA';
          return (
            <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
              <span className={`tag ${meta.tagClass}`}>{meta.label}</span>
              {isVacancyFinalized && <span className="tag tag-accent-2">Finalizada</span>}
            </div>
          );
        },
      }),
      columnHelper.accessor('created_at', {
        header: 'Recebida',
        cell: (info) => <span className="tnum text-muted">{formatDate(info.getValue())}</span>,
      }),
      columnHelper.accessor('expiration_date', {
        header: 'Expira',
        cell: ({ row }) => {
          const isFinal = ['APROVADA', 'REJEITADA', 'CANCELADA'].includes(row.original.status);
          return <span className="tnum text-muted">{isFinal ? '—' : formatDate(row.original.expiration_date)}</span>;
        },
      }),
      columnHelper.display({
        id: 'chevron',
        header: '',
        cell: () => (
          <div style={{ textAlign: 'right', opacity: 0.5 }}>
            <ChevronRight size={15} />
          </div>
        ),
      }),
    ],
    [isAdmin],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  const tabs: Array<{ key: 'TODOS' | 'FINALIZADA' | ApplicationStatus; label: string; count: number }> = [
    { key: 'TODOS', label: 'Todas', count: byVacancy.length },
    ...(['PENDENTE', 'EM_ANALISE', 'APROVADA'] as ApplicationStatus[]).map((st) => ({
      key: st,
      label: APPLICATION_STATUS_META[st].label,
      count: byVacancy.filter((a) => a.status === st).length,
    })),
    {
      key: 'FINALIZADA',
      label: 'Finalizadas',
      count: byVacancy.filter((a) => a.status === 'APROVADA' && a.opportunity_status === 'FINALIZADA').length,
    },
    {
      key: 'REJEITADA',
      label: APPLICATION_STATUS_META.REJEITADA.label,
      count: byVacancy.filter((a) => a.status === 'REJEITADA').length,
    },
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

        <div style={{ width: 300, maxWidth: '100%' }}>
          <select
            className="input"
            value={vacancyFilter}
            onChange={(e) => {
              const val = e.target.value;
              setVacancyFilter(val);
              table.setPageIndex(0);
              if (val === 'all') setSearchParams({});
              else setSearchParams({ vagaId: val });
            }}
          >
            <option value="all">Todas as vagas</option>
            {opportunities.map((opp) => (
              <option key={opp.id} value={String(opp.id)}>
                {opp.job_title}
              </option>
            ))}
          </select>
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
              <tr key={row.id} onClick={() => onOpenReview(row.original.id)} style={{ cursor: 'pointer' }}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isLoading && filtered.length === 0 && (
        <div style={{ padding: '56px 0', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 6px' }}>Nenhuma candidatura encontrada</h4>
          <p className="text-muted" style={{ margin: 0 }}>
            Quando profissionais se candidatarem, você recebe um e-mail e elas aparecem aqui.
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, fontSize: 13 }}>
          <span className="text-muted tnum">
            Página {pageIndex + 1} de {Math.max(1, pageCount)} · {filtered.length} candidaturas
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
    </>
  );
}
