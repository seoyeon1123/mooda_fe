'use client';

import { SessionProvider, useSession } from 'next-auth/react';
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

export default function ClientSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SessionProvider>
      <StoreHydrator>{children}</StoreHydrator>
    </SessionProvider>
  );
}
