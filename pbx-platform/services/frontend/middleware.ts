import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

// fkdnxj qhgh
export function middleware(request: NextRequest) {
    const token = request.cookies.get('access_token')

    // 로그인 안된 상태로 URL을 통해 접속시 로그인페이지로 리다이렉트
    if (!token && request.nextUrl.pathname !== '/login') {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 로그인 된 상태로 로그인 페이지에 접속하면 메인페이지로 리다이렉트
    if (token && request.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}