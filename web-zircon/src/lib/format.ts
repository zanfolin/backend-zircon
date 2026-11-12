import type { ApplicationStatus, DocumentType, OpportunityStatus, UserStatus, UserType, WorkModality } from '../types/api';

export function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'A combinar';
  }
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString('pt-BR');
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter((w) => w.length > 2 || w === w.toUpperCase());
  const source = parts.length ? parts : name.trim().split(/\s+/);
  return source
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function formatDocumentMasked(type: DocumentType, raw: string | null | undefined): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (type === 'CNPJ' && digits.length === 14) {
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  if (type === 'CPF' && digits.length === 11) {
    return `•••.${digits.slice(3, 6)}.${digits.slice(6, 9)}-••`;
  }
  return raw || '—';
}

export function resolveAvatarUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) return avatarUrl;
  const base = import.meta.env.VITE_UPLOADS_BASE_URL || '';
  return `${base}${avatarUrl}`;
}

export const MODALITY_LABEL: Record<WorkModality, string> = {
  HOME_OFFICE: 'Home office',
  HIBRIDO: 'Híbrido',
  PRESENCIAL: 'Presencial',
};

export const OPPORTUNITY_STATUS_META: Record<OpportunityStatus, { label: string; tagClass: string }> = {
  ATIVA: { label: 'Ativa', tagClass: 'tag-accent' },
  PAUSADA: { label: 'Pausada', tagClass: 'tag-outline' },
  FINALIZADA: { label: 'Finalizada', tagClass: 'tag-accent-2' },
  CANCELADA: { label: 'Cancelada', tagClass: 'tag-neutral' },
};

export const APPLICATION_STATUS_META: Record<ApplicationStatus, { label: string; tagClass: string }> = {
  PENDENTE: { label: 'Pendente', tagClass: 'tag-neutral' },
  EM_ANALISE: { label: 'Em análise', tagClass: 'tag-accent-2' },
  APROVADA: { label: 'Aprovada', tagClass: 'tag-accent' },
  REJEITADA: { label: 'Rejeitada', tagClass: 'tag-outline' },
  CANCELADA: { label: 'Cancelada', tagClass: 'tag-neutral' },
};

export const USER_TYPE_META: Record<UserType, { label: string; tagClass: string }> = {
  ADMIN: { label: 'Admin', tagClass: 'tag-outline' },
  EMPRESA: { label: 'Empresa', tagClass: 'tag-accent-2' },
  PROFISSIONAL: { label: 'Profissional', tagClass: 'tag-accent' },
};

export const USER_STATUS_META: Record<UserStatus, { label: string; tagClass: string }> = {
  ATIVO: { label: 'Ativo', tagClass: 'tag-accent' },
  INATIVO: { label: 'Inativo', tagClass: 'tag-neutral' },
  BLOQUEADO: { label: 'Bloqueado', tagClass: 'tag-outline' },
};
