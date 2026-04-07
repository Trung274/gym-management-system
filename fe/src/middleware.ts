import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get token from cookies. Our auth mechanism uses 'access_token' cookie.
  const token = request.cookies.get('access_token')?.value;

  // Protect /dashboard and any routes under it
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard');

  if (isProtectedRoute && !token) {
    // Redirect to login if accessing protected route without a token
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Prevent authenticated users from accessing login page again
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login');
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login'
  ],
};
