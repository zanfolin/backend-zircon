import { create } from 'zustand';

interface ToastItem {
  id: number;
  message: string;
  variant?: 'default' | 'error';
}

interface UIState {
  toasts: ToastItem[];
  showToast: (message: string, variant?: 'default' | 'error') => void;
  dismissToast: (id: number) => void;
}

let nextToastId = 1;

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  showToast: (message, variant = 'default') => {
    const id = nextToastId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
