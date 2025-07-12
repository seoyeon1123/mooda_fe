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
  saveSelectedPersonalityId: (id: string) => Promise<void>;
  loadUserData: () => Promise<void>;
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
        const currentId = get().selectedPersonalityId;
        if (currentId !== id) {
          set({ selectedPersonalityId: id, personalityChanged: true });
        }
      },
      saveSelectedPersonalityId: async (id) => {
        // 모든 성격(기본 + 커스텀)을 로컬 스토리지에만 저장
        const currentId = get().selectedPersonalityId;
        if (currentId !== id) {
          set({ selectedPersonalityId: id, personalityChanged: true });
        }
      },
      loadUserData: async () => {
        try {
          const response = await fetch('/api/user');
          if (response.ok) {
            const userData = await response.json();
            set({
              user: {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                image: userData.image,
              },
              selectedPersonalityId: userData.selectedPersonalityId || 'MUNI',
            });
          }
        } catch (error) {
          console.error('사용자 데이터 로드 실패:', error);
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
