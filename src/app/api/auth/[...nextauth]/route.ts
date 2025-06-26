import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import KakaoProvider from "next-auth/providers/kakao";
import type { JWT } from "next-auth/jwt";

async function refreshAccessToken(token: JWT) {
  try {
    console.log("🔄 REFRESHING ACCESS TOKEN...");

    if (!token.refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetch("http://localhost:8080/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Refresh failed: ${response.status} ${errorText}`);
    }

    const refreshedTokens = await response.json();
    console.log("✅ NEW ACCESS TOKEN RECEIVED");

    return {
      ...token,
      accessToken: refreshedTokens.accessToken,
      accessTokenExpires: Date.now() + 3600 * 1000,
      refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
      error: undefined,
    };
  } catch (error) {
    console.error("RefreshAccessTokenError", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
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
          const response = await fetch("http://localhost:8080/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              kakaoId: user.id,
              email: user.email,
              userName: user.name,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log("✅ INITIAL TOKENS RECEIVED:", data);
            return {
              ...token,
              kakaoId: user.id,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              accessTokenExpires: Date.now() + 3600 * 1000,
              userId: data.userId,
            };
          } else {
            console.error("Backend login failed:", response.status);
            return { ...token, error: "BackendLoginFailed" };
          }
        } catch (error) {
          console.error("Failed to sync user with backend", error);
          return { ...token, error: "BackendSyncFailed" };
        }
      }

      // 토큰 유효성 검사
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        console.log("EXISTING TOKEN IS VALID");
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { error, ...cleanToken } = token;
        return cleanToken;
      }

      console.log("TOKEN EXPIRED, TRYING TO REFRESH...");
      return await refreshAccessToken(token);
    },

    async session({ session, token }) {
      console.log("SESSION CALLBACK - Token:", token);

      if (token.error) {
        console.error("Session error:", token.error);
        return session;
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
      const isLoggingOut = url.startsWith(baseUrl + "/api/auth/signout");
      if (isLoggingOut) {
        return baseUrl;
      }
      return `${baseUrl}/chat`;
    },
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
