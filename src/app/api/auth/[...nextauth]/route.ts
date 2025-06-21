import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import KakaoProvider from 'next-auth/providers/kakao';
import { JWT } from 'next-auth/jwt';

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    console.log('🔄 REFRESHING ACCESS TOKEN...');
    const response = await fetch('http://localhost:8080/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    console.log('✅ NEW ACCESS TOKEN:', refreshedTokens.accessToken);
    return {
      ...token,
      accessToken: refreshedTokens.accessToken,
      accessTokenExpires: Date.now() + 3600 * 1000, // 1 hour
      refreshToken: refreshedTokens.refreshToken ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    console.error('RefreshAccessTokenError', error);

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

const authOptions: NextAuthOptions = {
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // 초기 로그인 시
      if (user && account) {
        try {
          const response = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              kakaoId: user.id,
              email: user.email,
              userName: user.name,
            }),
          });

          if (response.ok) {
            const tokens = await response.json();
            console.log('✅ INITIAL TOKENS RECEIVED:', tokens);
            token.kakaoId = user.id;
            token.accessToken = tokens.accessToken;
            token.refreshToken = tokens.refreshToken;
            token.accessTokenExpires = Date.now() + 3600 * 1000; // 1 hour
            return token;
          } else {
            console.error('Backend login failed:', await response.text());
            token.error = 'BackendLoginFailed';
          }
        } catch (error) {
          console.error('Failed to sync user with backend', error);
          token.error = 'BackendSyncFailed';
        }
        return token;
      }

      // 토큰이 만료되지 않았으면 기존 토큰 반환
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        console.log('EXISTING TOKEN IS VALID');
        return token;
      }

      console.log('TOKEN EXPIRED, TRYING TO REFRESH...');
      // 토큰이 만료되었으면 재발급 시도
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      console.log('SESSION CALLBACK - Populating session with token:', token);
      if (token) {
        session.user.kakaoId = token.kakaoId;
        session.user.name = token.name;
        session.user.email = token.email;
        session.accessToken = token.accessToken;
        session.refreshToken = token.refreshToken;
        session.error = token.error;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // 로그아웃 시에는 항상 홈페이지(로그인 페이지)로 이동합니다.
      const isLoggingOut = url.startsWith(baseUrl + '/api/auth/signout');
      if (isLoggingOut) {
        return baseUrl;
      }

      // 그 외 로그인과 같은 경우는 /chat으로 리디렉션합니다.
      return `${baseUrl}/chat`;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
