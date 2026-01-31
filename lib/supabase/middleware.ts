/**
 * Supabase Client Configuration (Middleware)
 *
 * This client is used in Next.js middleware for route protection
 * and authentication state management.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Create a Supabase client for middleware
 * Handles cookie-based authentication in middleware context
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
