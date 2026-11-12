import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { ApplicationStatus, WorkModality } from '@/types/api';

export function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'A combinar';
  }
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString('pt-BR');
}

export function formatShortDate(iso: string | null | undefined): string {
  return formatDate(iso).slice(0, 5);
}

export function formatRelativeDays(iso: string | null | undefined): string {
  if (!iso) return '';
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (diff <= 0) return 'hoje';
  if (diff === 1) return 'ontem';
  if (diff < 7) return `há ${diff} dias`;
  if (diff < 30) return `há ${Math.floor(diff / 7)} sem.`;
  return `há ${Math.floor(diff / 30)} mês`;
}

export function maskCPFInput(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

export function maskCPFDisplay(raw: string | null | undefined): string {
  const d = (raw || '').replace(/\D/g, '');
  if (d.length !== 11) return raw || '—';
  return `•••.${d.slice(3, 6)}.${d.slice(6, 9)}-••`;
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

export function getDefaultHost(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip) return `http://${ip}:3000`;
  }
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
}

export function resolveAvatarUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;
  const base = (process.env.EXPO_PUBLIC_UPLOADS_BASE_URL || getDefaultHost()).replace(/\/+$/, '');
  const localMatch = avatarUrl.match(/^https?:\/\/(?:localhost|127\.0\.0\.1|10\.0\.2\.2)(?::\d+)?(\/.*)$/i);
  if (localMatch) {
    return `${base}${localMatch[1]}`;
  }
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }
  return `${base}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
}

export const MODALITY_LABEL: Record<WorkModality, string> = {
  HOME_OFFICE: 'Home office',
  HIBRIDO: 'Híbrido',
  PRESENCIAL: 'Presencial',
};

export const APPLICATION_STATUS_META: Record<
  ApplicationStatus,
  { label: string; tone: 'neutral' | 'accent' | 'accent2' | 'outline' }
> = {
  PENDENTE: { label: 'Pendente', tone: 'neutral' },
  EM_ANALISE: { label: 'Em análise', tone: 'accent2' },
  APROVADA: { label: 'Aprovada', tone: 'accent' },
  REJEITADA: { label: 'Rejeitada', tone: 'outline' },
  CANCELADA: { label: 'Cancelada', tone: 'neutral' },
};
