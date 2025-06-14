import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mooda',
  description: '감정 분석 AI 챗봇',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="mx-auto max-w-[375px] min-h-screen bg-cream">
          {children}
        </div>
      </body>
    </html>
  );
}
