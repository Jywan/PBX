import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const token = request.cookies.get('access_token');
    const { pathname } = request.nextUrl;

    // 1. 로그인 페이지(/login)에 접근할 때는 미들웨어 로직을 타지 않도록 바로 통과
    if (pathname === '/login') {
        // 이미 토큰이 있다면 메인으로 보냄
        if (token) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }

    // 2. 토큰이 없는데 메인(/)이나 다른 페이지에 접근하려고 하면 로그인 페이지로 리다이렉트
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

// 3. matcher 설정을 통해 불필요한 파일(이미지, 스타일시트 등)에는 미들웨어가 적용되지 않게 함
export const config = {
    matcher: [
        /*
         * 아래 경로를 제외한 모든 요청에 미들웨어 적용:
         * - api (API 라우트)
         * - _next/static (정적 파일)
         * - _next/image (이미지 최적화 파일)
         * - favicon.ico (파비콘)
         * - styles (CSS 파일들이 있는 폴더)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|styles).*)',
    ],
};