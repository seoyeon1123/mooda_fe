'use client';

import NavBar from '@/components/common/NavBar';
import { SessionProvider } from 'next-auth/react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <div className="flex flex-col h-screen">
        <main className="flex-1 overflow-auto min-h-0">{children}</main>
        <NavBar />
      </div>
    </SessionProvider>
  );
};

export default Layout;
