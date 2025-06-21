// stores/userStore.ts
import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  image?: string;
}

interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => {
    console.log('✅ Zustand setUser 호출됨:', user);
    set({ user });
  },

  clearUser: () => set({ user: null }),
}));

export default useUserStore;
