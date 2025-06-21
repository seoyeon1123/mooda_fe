import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    error?: string;
    user: {
      /** The user's kakao ID. */
      kakaoId?: string | number;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } & import('next-auth').DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    kakaoId?: string | number;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}
