import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 미들웨어의 보호를 받을 경로 목록입니다.
const PROTECTED_ROUTES = ['/chat', '/settings', '/calendar'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // JWT 토큰을 직접 확인하여 로그인 상태를 가져옵니다.
  const token = await getToken({ req });

  // 현재 경로가 보호된 페이지인지 확인합니다.
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (token) {
    // 로그인한 사용자가 홈페이지(로그인 페이지)에 접근하려고 하면,
    // '/chat'으로 리디렉션합니다.
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/chat', req.url));
    }
  } else {
    // 로그인하지 않은 사용자가 보호된 페이지에 접근하려고 하면,
    // 홈페이지(로그인 페이지)로 리디렉션합니다.
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // 그 외 모든 경우는 요청을 그대로 통과시킵니다.
  return NextResponse.next();
}

export const config = {
  // 미들웨어를 모든 경로에서 실행하되, 불필요한 내부 경로는 제외합니다.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
