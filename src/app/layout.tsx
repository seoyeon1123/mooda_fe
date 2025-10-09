import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientSessionProvider from '@/components/common/ClientSessionProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mooda',
  description: '감정 분석 AI 챗봇',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/images/logo.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#16a34a" />
      </head>
      <body className={inter.className}>
        <ClientSessionProvider>
          <div className="mx-auto max-w-[375px] min-h-screen bg-stone-100">
            {children}
          </div>
        </ClientSessionProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js'); }); }`,
          }}
        />
      </body>
    </html>
  );
}
