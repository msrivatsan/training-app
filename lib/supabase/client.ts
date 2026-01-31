/**
 * Supabase Client Configuration (Client-Side)
 *
 * This client is used in client components and browser context.
 * It handles browser-based authentication and data fetching.
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * Create a Supabase client for client-side operations
 * Uses environment variables for configuration
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
