import { AuthOptions } from 'next-auth';
import KakaoProvider from 'next-auth/providers/kakao';

export const authOptions: AuthOptions = {
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        // 서버에 사용자 정보 전송
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              kakaoId: account.providerAccountId,
              email: user.email,
              userName: user.name,
              image: user.image, // 이미지 정보 추가
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          return {
            ...token,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            kakaoId: account.providerAccountId,
            userId: data.userId,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.image as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
};
