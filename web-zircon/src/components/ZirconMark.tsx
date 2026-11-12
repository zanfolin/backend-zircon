import { Check, AlertCircle, X } from 'lucide-react';
import { useUIStore } from '../stores/uiStore';

export function ZirconMark({ size = 14 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: '1.5px solid var(--color-accent)',
        transform: 'rotate(45deg)',
        outline: '1px solid var(--color-accent-2)',
        outlineOffset: 2,
        flexShrink: 0,
      }}
    />
  );
}

export function ToastContainer() {
  const { toasts, dismissToast } = useUIStore();
  if (!toasts.length) return null;

  return (
    <div
      style={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            padding: '12px 16px',
            background: 'var(--color-surface)',
            border: `1px solid ${t.variant === 'error' ? 'var(--z-danger)' : 'var(--color-divider)'}`,
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            fontSize: 13,
            maxWidth: 380,
          }}
        >
          <span style={{ color: t.variant === 'error' ? 'var(--z-danger)' : 'var(--color-accent)' }}>
            {t.variant === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
          </span>
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            aria-label="Fechar notificação"
            style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'inherit', opacity: 0.6 }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
