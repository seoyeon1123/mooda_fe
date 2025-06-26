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
