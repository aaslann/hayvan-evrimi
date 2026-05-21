import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const storage =
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
    ? createJSONStorage(() => localStorage)
    : createJSONStorage(() => require('@react-native-async-storage/async-storage').default);

interface MonetizationStore {
  adFree: boolean;
  bonusUndos: number;
  setAdFree: (v: boolean) => void;
  addBonusUndo: () => void;
  consumeBonusUndo: () => boolean; // false dönerse bakiye yok
}

export const useMonetizationStore = create<MonetizationStore>()(
  persist(
    (set, get) => ({
      adFree: false,
      bonusUndos: 0,

      setAdFree: (v) => set({ adFree: v }),

      addBonusUndo: () => set((s) => ({ bonusUndos: s.bonusUndos + 1 })),

      consumeBonusUndo: () => {
        if (get().bonusUndos <= 0) return false;
        set((s) => ({ bonusUndos: s.bonusUndos - 1 }));
        return true;
      },
    }),
    {
      name: 'hayvan-monetization-v1',
      storage,
      partialize: (s) => ({ adFree: s.adFree, bonusUndos: s.bonusUndos }),
    },
  ),
);
