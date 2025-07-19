'use client';

import { SessionProvider, useSession, signOut } from 'next-auth/react';
import { useEffect, type ReactNode } from 'react';
import useUserStore from '@/store/userStore';

function StoreHydrator({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const setUser = useUserStore((state) => state.setUser);
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    if (
      session?.user &&
      user?.id !== session.user.kakaoId // 변경이 있는 경우에만 실행
    ) {
      const sessionUser = session.user;

      // 서버에 사용자 정보 전송 (안전하게 처리)
      const sendUserToServer = async () => {
        if (!process.env.NEXT_PUBLIC_API_URL) {
          console.warn('⚠️ NEXT_PUBLIC_API_URL이 설정되지 않았습니다.');
          return;
        }

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                kakaoId: sessionUser.kakaoId,
                email: sessionUser.email,
                userName: sessionUser.name,
                image: sessionUser.image,
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            console.log('✅ 서버에 사용자 정보 전송 성공:', data);
          } else {
            console.error('❌ 서버에 사용자 정보 전송 실패:', response.status);
          }
        } catch (error) {
          console.error('❌ 서버 통신 오류:', error);
          // 오류가 발생해도 로그인은 계속 진행
        }
      };

      // 비동기로 서버에 전송 (로그인을 막지 않음)
      sendUserToServer();

      setUser({
        id: sessionUser.kakaoId as string,
        name: sessionUser.name || '',
        image: sessionUser.image || '',
      });
    }
  }, [session, user, setUser]);

  return <>{children}</>;
}

function SessionErrorHandler({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (
      status === 'authenticated' &&
      session?.error === 'RefreshAccessTokenError'
    ) {
      console.log('🚫 SESSION ERROR DETECTED - SIGNING OUT...');
      signOut({ callbackUrl: '/' });
    }
  }, [session, status]);

  return <>{children}</>;
}

export default function ClientSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SessionProvider>
      <SessionErrorHandler>
        <StoreHydrator>{children}</StoreHydrator>
      </SessionErrorHandler>
    </SessionProvider>
  );
}
