import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes yêu cầu đăng nhập
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/members',
  '/bookings',
  '/group-classes',
  '/plans',
  '/staff',
  '/trainers',
  '/equipment',
  '/checkins',
];

// Routes chỉ dành cho khách (chưa đăng nhập)
const AUTH_ROUTES = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  const isProtectedRoute = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  // Chưa đăng nhập → redirect về login với returnUrl
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Đã đăng nhập → không cho vào trang auth
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/members/:path*',
    '/bookings/:path*',
    '/group-classes/:path*',
    '/plans/:path*',
    '/staff/:path*',
    '/trainers/:path*',
    '/equipment/:path*',
    '/checkins/:path*',
    '/login',
  ],
};
