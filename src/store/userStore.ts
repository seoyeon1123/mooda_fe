// stores/userStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  selectedPersonalityId: string;
  personalityChanged: boolean;
  setUser: (user: UserState['user']) => void;
  clearUser: () => void;
  setSelectedPersonalityId: (id: string) => void;
  ackPersonalityChange: () => void;
}

const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      selectedPersonalityId: 'MUNI',
      personalityChanged: false,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      setSelectedPersonalityId: (id) => {
        if (get().selectedPersonalityId !== id) {
          set({ selectedPersonalityId: id, personalityChanged: true });
        }
      },
      ackPersonalityChange: () => set({ personalityChanged: false }),
    }),
    {
      name: 'user-settings-storage',
      partialize: (state) => ({
        user: state.user,
        selectedPersonalityId: state.selectedPersonalityId,
      }),
    }
  )
);

export default useUserStore;
