import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useAuthStore } from '@/stores/authStore';

const EMPTY_IDS: number[] = [];

interface SavedState {
  savedByUser: Record<string, number[]>;
  toggleSaved: (userId: number | string | undefined, vacancyId: number) => boolean;
  clearUserSaved: (userId: number | string | undefined) => void;
}

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      savedByUser: {},
      toggleSaved: (userId, vacancyId) => {
        if (userId === undefined || userId === null) return false;
        const key = String(userId);
        const current = get().savedByUser[key] ?? EMPTY_IDS;
        const exists = current.includes(vacancyId);
        const next = exists ? current.filter((x) => x !== vacancyId) : [vacancyId, ...current];
        set({
          savedByUser: {
            ...get().savedByUser,
            [key]: next,
          },
        });
        return !exists;
      },
      clearUserSaved: (userId) => {
        if (userId === undefined || userId === null) return;
        const key = String(userId);
        const next = { ...get().savedByUser };
        delete next[key];
        set({ savedByUser: next });
      },
    }),
    {
      name: 'zircon-mobile-saved-v2',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function useUserSavedIds(): number[] {
  const userId = useAuthStore((s) => s.user?.id);
  return useSavedStore((s) => {
    if (userId === undefined || userId === null) return EMPTY_IDS;
    return s.savedByUser[String(userId)] ?? EMPTY_IDS;
  });
}
