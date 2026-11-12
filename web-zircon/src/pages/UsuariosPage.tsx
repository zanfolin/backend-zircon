import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Check, ChevronLeft, ChevronRight, Clock, Search } from 'lucide-react';
import { userApi } from '../services/endpoints';
import { useAdminUsers } from '../hooks/useZirconQueries';
import { useUIStore } from '../stores/uiStore';
import { getApiErrorMessage } from '../lib/api';
import { USER_STATUS_META, USER_TYPE_META, formatDate, formatDocumentMasked, getInitials } from '../lib/format';
import type { User, UserStatus, UserType } from '../types/api';

const columnHelper = createColumnHelper<User>();

export function UsuariosPage() {
  const qc = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const { data: users = [], isLoading } = useAdminUsers(true);

  const [roleFilter, setRoleFilter] = useState<'TODOS' | UserType>('TODOS');
  const [search, setSearch] = useState('');

  const updateUserMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: UserStatus }) => userApi.adminUpdateUser(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'TODOS' && u.user_type !== roleFilter) return false;
      if (q && !(String(u.full_name || '') + ' ' + u.email + ' ' + u.document_number).toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [users, roleFilter, search]);

  const handleToggleBlock = async (u: User) => {
    const nextStatus: UserStatus = u.status === 'BLOQUEADO' ? 'ATIVO' : 'BLOQUEADO';
    try {
      await updateUserMutation.mutateAsync({ id: u.id, status: nextStatus });
      showToast(nextStatus === 'BLOQUEADO' ? `${u.full_name || u.email} foi bloqueado` : `${u.full_name || u.email} foi reativado`);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('full_name', {
        header: 'Usuário',
        cell: ({ row }) => {
          const u = row.original;
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
                  background: 'var(--color-neutral-100)',
                  color: 'var(--color-neutral-800)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {getInitials(u.full_name || u.email)}
              </span>
              <div>
                <div>{u.full_name || 'Sem nome'}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  {u.email}
                </div>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('user_type', {
        header: 'Tipo',
        cell: (info) => {
          const meta = USER_TYPE_META[info.getValue()];
          return <span className={`tag ${meta.tagClass}`}>{meta.label}</span>;
        },
      }),
      columnHelper.accessor('document_number', {
        header: 'Documento',
        cell: ({ row }) => (
          <span className="tnum" style={{ fontSize: 13 }}>
            <span style={{ fontSize: 11, opacity: 0.6, marginRight: 6 }}>{row.original.document_type}</span>
            {formatDocumentMasked(row.original.document_type, row.original.document_number)}
          </span>
        ),
      }),
      columnHelper.accessor('verified_email', {
        header: 'E-mail',
        cell: (info) => {
          const ok = Boolean(info.getValue());
          return (
            <span
              style={{
                display: 'inline-flex',
                gap: 6,
                alignItems: 'center',
                fontSize: 13,
                color: ok ? 'var(--color-text)' : 'var(--color-accent-700)',
              }}
            >
              {ok ? <Check size={14} /> : <Clock size={14} />}
              {ok ? 'Verificado' : 'Pendente'}
            </span>
          );
        },
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const meta = USER_STATUS_META[info.getValue()];
          return <span className={`tag ${meta.tagClass}`}>{meta.label}</span>;
        },
      }),
      columnHelper.accessor('created_at', {
        header: 'Cadastro',
        cell: (info) => <span className="tnum text-muted">{formatDate(info.getValue())}</span>,
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const u = row.original;
          if (u.user_type === 'ADMIN') return null;
          return (
            <div style={{ textAlign: 'right' }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: 13 }}
                disabled={updateUserMutation.isPending}
                onClick={() => handleToggleBlock(u)}
              >
                {u.status === 'BLOQUEADO' ? 'Desbloquear' : 'Bloquear'}
              </button>
            </div>
          );
        },
      }),
    ],
    [updateUserMutation.isPending],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  const tabs: Array<{ key: 'TODOS' | UserType; label: string; count: number }> = [
    { key: 'TODOS', label: 'Todos', count: users.length },
    { key: 'EMPRESA', label: 'Empresas', count: users.filter((u) => u.user_type === 'EMPRESA').length },
    { key: 'PROFISSIONAL', label: 'Profissionais', count: users.filter((u) => u.user_type === 'PROFISSIONAL').length },
    { key: 'ADMIN', label: 'Admin', count: users.filter((u) => u.user_type === 'ADMIN').length },
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
              data-active={roleFilter === t.key}
              onClick={() => {
                setRoleFilter(t.key);
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
            placeholder="Buscar por nome, e-mail ou documento"
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

      {!isLoading && filtered.length === 0 && (
        <div style={{ padding: '48px 0', textAlign: 'center' }} className="text-muted">
          Nenhum usuário encontrado com esses filtros.
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, fontSize: 13 }}>
          <span className="text-muted tnum">
            Página {pageIndex + 1} de {Math.max(1, pageCount)} · {filtered.length} usuários
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
