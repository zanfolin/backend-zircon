import { create } from 'zustand';

interface ToastState {
  message: string | null;
  variant: 'default' | 'error';
  showToast: (message: string, variant?: 'default' | 'error') => void;
  hideToast: () => void;
}

let timer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  variant: 'default',
  showToast: (message, variant = 'default') => {
    if (timer) clearTimeout(timer);
    set({ message, variant });
    timer = setTimeout(() => {
      set({ message: null });
    }, 2800);
  },
  hideToast: () => set({ message: null }),
}));
