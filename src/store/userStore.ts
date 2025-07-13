// stores/userStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSession } from 'next-auth/react';

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
        try {
          const session = await getSession();
          if (!session?.user?.id) {
            console.error('세션 정보가 없습니다.');
            return;
          }

          const response = await fetch(`http://localhost:8080/api/user`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: session.user.id,
              selectedPersonalityId: id,
            }),
            credentials: 'include',
          });

          if (response.ok) {
            set({ selectedPersonalityId: id, personalityChanged: true });
          } else {
            const errorData = await response.json();
            console.error('성격 저장 실패:', errorData);
          }
        } catch (error) {
          console.error('성격 저장 중 오류:', error);
        }
      },
      loadUserData: async () => {
        try {
          const session = await getSession();
          if (!session?.user?.id) {
            console.log('세션 정보 없음');
            return;
          }

          const response = await fetch(
            `http://localhost:8080/api/user?userId=${session.user.id}`,
            {
              credentials: 'include',
            }
          );

          if (response.ok) {
            const userData = await response.json();
            set({
              user: {
                id: userData.id,
                name: userData.userName,
                email: userData.email,
                image: userData.image,
              },
              selectedPersonalityId: userData.selectedPersonalityId || 'MUNI',
            });
          } else {
            const errorData = await response.json();
            console.error('사용자 데이터 로드 실패:', errorData);
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
