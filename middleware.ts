/**
 * Next.js Middleware
 *
 * Handles authentication and protected routes
 * Runs before every request to check authentication state
 */

import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protected routes that require authentication
 */
const protectedRoutes = ['/dashboard', '/workouts', '/programs', '/progress', '/profile'];

/**
 * Auth routes that should redirect to dashboard if already authenticated
 */
const authRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  // Update session and get user
  const { supabaseResponse, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current route is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect to login if trying to access protected route without authentication
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if trying to access auth routes while authenticated
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
