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
  selectedPersonality: {
    id: string;
    name: string;
    description: string;
    shortDescription: string;
    iconType: string;
  } | null;
  personalityChanged: boolean;
  chatMessages: {
    id: string;
    role: string;
    content: string;
    createdAt: string;
  }[]; // 채팅 메시지 저장
  setUser: (user: UserState['user']) => void;
  clearUser: () => void;
  setSelectedPersonalityId: (id: string) => void;
  saveSelectedPersonalityId: (id: string) => Promise<void>;
  setSelectedPersonality: (
    personality: UserState['selectedPersonality']
  ) => void;
  setChatMessages: (messages: UserState['chatMessages']) => void; // 채팅 메시지 설정
  loadUserData: () => Promise<void>;
  ackPersonalityChange: () => void;
}

const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      selectedPersonalityId: 'MUNI',
      selectedPersonality: null,
      personalityChanged: false,
      chatMessages: [],
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      setSelectedPersonalityId: (id) => {
        const currentId = get().selectedPersonalityId;
        if (currentId !== id) {
          set({ selectedPersonalityId: id, personalityChanged: true });
        }
      },
      setSelectedPersonality: (personality) =>
        set({ selectedPersonality: personality }),
      setChatMessages: (messages) => set({ chatMessages: messages }),
      saveSelectedPersonalityId: async (id) => {
        try {
          const session = await getSession();
          if (!session?.user?.id) {
            console.error('세션 정보가 없습니다.');
            return;
          }

          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
          const response = await fetch(`${apiUrl}/api/user`, {
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
          // 오류가 발생해도 로컬 상태는 업데이트
          set({ selectedPersonalityId: id, personalityChanged: true });
        }
      },
      loadUserData: async () => {
        try {
          const session = await getSession();
          if (!session?.user?.id) {
            console.log('세션 정보 없음');
            return;
          }

          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
          const response = await fetch(
            `${apiUrl}/api/user?userId=${session.user.id}`,
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
          // 오류가 발생해도 기본값으로 설정
          set({
            selectedPersonalityId: 'MUNI',
          });
        }
      },
      ackPersonalityChange: () => set({ personalityChanged: false }),
    }),
    {
      name: 'user-settings-storage',
      partialize: (state) => ({
        user: state.user,
        selectedPersonalityId: state.selectedPersonalityId,
        selectedPersonality: state.selectedPersonality,
        chatMessages: state.chatMessages,
      }),
    }
  )
);

export default useUserStore;
