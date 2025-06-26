import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import KakaoProvider from 'next-auth/providers/kakao';
import type { JWT } from 'next-auth/jwt';

async function refreshAccessToken(token: JWT) {
  try {
    console.log('🔄 REFRESHING ACCESS TOKEN...');

    if (!token.refreshToken) {
      console.log('❌ NO REFRESH TOKEN AVAILABLE - FORCING LOGOUT');
      return {
        ...token,
        error: 'RefreshAccessTokenError',
        accessToken: undefined,
        refreshToken: undefined,
        accessTokenExpires: undefined,
      };
    }

    const response = await fetch('http://localhost:8080/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ REFRESH FAILED: ${response.status} ${errorText}`);
      return {
        ...token,
        error: 'RefreshAccessTokenError',
        accessToken: undefined,
        refreshToken: undefined,
        accessTokenExpires: undefined,
      };
    }

    const refreshedTokens = await response.json();
    console.log('✅ NEW ACCESS TOKEN RECEIVED');

    return {
      ...token,
      accessToken: refreshedTokens.accessToken,
      accessTokenExpires: Date.now() + 3600 * 1000, // 1시간
      refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
      error: undefined,
    };
  } catch (error) {
    console.error('RefreshAccessTokenError', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
      accessToken: undefined,
      refreshToken: undefined,
      accessTokenExpires: undefined,
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
          console.log('🔑 INITIAL LOGIN - Calling backend login API');
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
            const data = await response.json();
            console.log('✅ INITIAL TOKENS RECEIVED');
            return {
              ...token,
              kakaoId: user.id,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              accessTokenExpires: Date.now() + 3600 * 1000, // 1시간
              userId: data.userId,
            };
          } else {
            console.error('Backend login failed:', response.status);
            return { ...token, error: 'BackendLoginFailed' };
          }
        } catch (error) {
          console.error('Failed to sync user with backend', error);
          return { ...token, error: 'BackendSyncFailed' };
        }
      }

      // 에러가 있는 경우 그대로 반환 (로그아웃 유도)
      if (token.error) {
        console.log('🚫 TOKEN HAS ERROR, RETURNING AS-IS:', token.error);
        return token;
      }

      // 토큰 유효성 검사 - accessTokenExpires가 없으면 즉시 갱신 시도
      const isTokenValid =
        token.accessTokenExpires && Date.now() < token.accessTokenExpires;

      if (isTokenValid) {
        console.log('✅ EXISTING TOKEN IS VALID');
        return token;
      }

      console.log('⏰ TOKEN EXPIRED OR MISSING, TRYING TO REFRESH...');
      return await refreshAccessToken(token);
    },

    async session({ session, token }) {
      console.log('SESSION CALLBACK - Token error:', token.error);

      if (token.error === 'RefreshAccessTokenError') {
        console.log('🚫 SESSION ERROR - INVALIDATING SESSION');
        // 세션을 무효화하여 로그아웃 유도
        return {
          ...session,
          error: 'RefreshAccessTokenError',
          user: session.user, // 기본 user 정보는 유지
        };
      }

      if (token && session.user) {
        session.user.id = token.userId as string;
        session.user.kakaoId = token.kakaoId;
        session.accessToken = token.accessToken;
        session.refreshToken = token.refreshToken;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      const isLoggingOut = url.startsWith(baseUrl + '/api/auth/signout');
      if (isLoggingOut) {
        return baseUrl;
      }
      return `${baseUrl}/chat`;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
