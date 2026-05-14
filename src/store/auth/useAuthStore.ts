import {persist, createJSONStorage} from 'zustand/middleware';
import {zustandMmkvStorage} from '../../services/storage/MMKV/zustandMmkvStorage';
import {create} from 'zustand';

type AuthData = {
  jwt: string;
  phone: string | number;
  empId: string;
  newUser: boolean;
};

interface AuthState {
  isAuthenticated: boolean;
  authData: AuthData | null;
  setAuthData: (authData: AuthData) => void;
  clearAuthData: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      isAuthenticated: false,
      authData: null,
      setAuthData: (authData: AuthData) =>
        set({authData, isAuthenticated: true}),
      clearAuthData: () => set({authData: null, isAuthenticated: false}),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandMmkvStorage),
    },
  ),
);

export default useAuthStore;
