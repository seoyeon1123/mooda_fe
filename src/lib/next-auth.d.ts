import { DefaultSession, DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      kakaoId?: string | number | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } & DefaultSession['user'];
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }

  interface User extends DefaultUser {
    kakaoId?: string | number | null;
  }
}

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    userId?: string;
    kakaoId?: string | number | null;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}
