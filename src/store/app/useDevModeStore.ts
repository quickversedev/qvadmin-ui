import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

import {zustandMmkvStorage} from '../../services/storage/MMKV/zustandMmkvStorage';

interface DevModeState {
  isDevMode: boolean;
  enableDevMode: () => void;
  disableDevMode: () => void;
}

export const useDevModeStore = create<DevModeState>()(
  persist(
    set => ({
      isDevMode: false,
      enableDevMode: () => set({isDevMode: true}),
      disableDevMode: () => set({isDevMode: false}),
    }),
    {
      name: 'dev-mode-storage',
      storage: createJSONStorage(() => zustandMmkvStorage),
      partialize: state => ({isDevMode: state.isDevMode}),
    },
  ),
);
