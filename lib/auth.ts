import { createClient, createAdminClient } from './supabase/server';
import { headers } from 'next/headers';
import type { User } from '@supabase/supabase-js';

/**
 * Extract and verify the Supabase session from the request.
 * Supports both:
 *   1. Bearer token in Authorization header (for API/curl testing)
 *   2. Cookie-based session (for browser/frontend use)
 *
 * All protected route handlers should call this first.
 * Returns the authenticated user object.
 * Throws Error('UNAUTHORIZED') if no valid session exists.
 */
export async function getSessionUser(): Promise<User> {
  // 1. Try Bearer token from Authorization header
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const adminClient = createAdminClient();
    const { data: { user }, error } = await adminClient.auth.getUser(token);

    if (!error && user) {
      return user;
    }
  }

  // 2. Fall back to cookie-based session
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('UNAUTHORIZED');
  }

  return user;
}
