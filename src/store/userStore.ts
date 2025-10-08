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
  isHydrated?: boolean;
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
      isHydrated: false,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      setSelectedPersonalityId: (id) =>
        set({ selectedPersonalityId: id, personalityChanged: true }),
      saveSelectedPersonalityId: async (id) => {
        const session = await getSession();
        if (!session?.user?.id) {
          console.error('세션이 없습니다');
          return;
        }

        set({ selectedPersonalityId: id, personalityChanged: true });

        try {
          const response = await fetch(`/api/user`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              selectedPersonalityId: id,
            }),
          });

          if (response.status === 404) {
            // 사용자가 존재하지 않으면 생성 후 재시도
            console.log('사용자 없음, 생성 후 재시도...');
            const createResponse = await fetch(`/api/user`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                kakaoId: session.user.kakaoId,
                name: session.user.name,
                image: session.user.image,
              }),
            });

            if (createResponse.ok) {
              // 사용자 생성 후 다시 업데이트 시도
              const retryResponse = await fetch(`/api/user`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  selectedPersonalityId: id,
                }),
              });

              if (retryResponse.ok) {
                set({ selectedPersonalityId: id, personalityChanged: true });
                console.log('✅ 성격 저장 성공 (생성 후)');
              } else {
                const errorData = await retryResponse.json().catch(() => ({}));
                console.error('성격 저장 실패 (재시도):', errorData);
                // 로컬 상태는 유지
              }
            } else {
              const errorData = await createResponse.json().catch(() => ({}));
              console.error('사용자 생성 실패:', errorData);
              // 로컬 상태는 유지
            }
          } else if (response.ok) {
            set({ selectedPersonalityId: id, personalityChanged: true });
            console.log('✅ 성격 저장 성공');
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('성격 저장 실패:', errorData);
            // 로컬 상태는 유지
          }
        } catch (error) {
          console.error('성격 저장 중 오류:', error);
          // 로컬 상태는 유지
        }
      },
      setSelectedPersonality: (personality) =>
        set({ selectedPersonality: personality }),
      setChatMessages: (messages) => set({ chatMessages: messages }),
      loadUserData: async () => {
        const session = await getSession();
        if (!session?.user?.id) {
          console.error('세션이 없습니다');
          return;
        }

        try {
          // cache: 'no-store'를 추가하여 캐시된 응답을 방지
          const response = await fetch(`/api/user?userId=${session.user.id}`, {
            cache: 'no-store',
          });

          if (response.ok) {
            const userData = await response.json();
            console.log('📋 서버에서 로드된 사용자 데이터:', userData);

            // 로컬 상태를 우선하되, 서버 상태도 고려
            const localSelected = get().selectedPersonalityId;
            const serverSelected = userData.selectedPersonalityId || 'MUNI';
            const effectiveSelected = localSelected || serverSelected;

            set({
              user: {
                id: userData.id,
                name: userData.user_name,
                image: userData.image,
              },
              selectedPersonalityId: effectiveSelected,
            });

            // 로컬과 서버 상태가 다르면 백그라운드에서 동기화
            if (localSelected && localSelected !== serverSelected) {
              console.log(
                '🔄 로컬과 서버 상태 불일치, 백그라운드 동기화 중...'
              );
              fetch(`/api/user`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  selectedPersonalityId: localSelected,
                }),
              }).catch((error) => {
                console.error('백그라운드 동기화 실패:', error);
              });
            }

            console.log('✅ 사용자 데이터 로드 성공');
          } else if (response.status === 404) {
            console.log('🔄 사용자 없음, 생성 중...');
            // 사용자가 존재하지 않으면 생성
            const createResponse = await fetch(`/api/user`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                kakaoId: session.user.kakaoId,
                name: session.user.name,
                image: session.user.image,
              }),
            });

            if (createResponse.ok) {
              console.log('✅ 사용자 생성 성공, 데이터 재로드 중...');
              // 사용자 생성 후 다시 로드
              const retryResponse = await fetch(
                `/api/user?userId=${session.user.id}`,
                {
                  cache: 'no-store',
                }
              );

              if (retryResponse.ok) {
                const userData = await retryResponse.json();
                set({
                  user: {
                    id: userData.id,
                    name: userData.user_name,
                    image: userData.image,
                  },
                  selectedPersonalityId:
                    userData.selectedPersonalityId || 'MUNI',
                });
                console.log('✅ 사용자 데이터 로드 성공 (생성 후)');
              }
            } else {
              const errorData = await createResponse.json().catch(() => ({}));
              console.error('사용자 생성 실패:', errorData);
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('사용자 데이터 로드 실패:', errorData);
          }
        } catch (error) {
          console.error('사용자 데이터 로드 실패:', error);
          // 오류 시 로컬 상태 유지
          set({ selectedPersonalityId: get().selectedPersonalityId || 'MUNI' });
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
      onRehydrateStorage: () => {
        console.log('🔄 Zustand 하이드레이션 시작...');
        return (state, error) => {
          if (error) {
            console.error('❌ 하이드레이션 오류:', error);
          } else {
            console.log('✅ 하이드레이션 완료, 복원된 상태:', state);
          }
          // 성공/실패 관계없이 하이드레이션 완료로 표시
          setTimeout(() => {
            // setState를 안전하게 호출하기 위해 setTimeout 사용
            useUserStore.setState({ isHydrated: true });
            console.log('🎯 하이드레이션 플래그 설정 완료');
          }, 0);
        };
      },
    }
  )
);

export default useUserStore;
