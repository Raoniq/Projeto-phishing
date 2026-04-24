import { redirect } from 'react-router-dom';
import type { LoaderFunctionArgs } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth/session';

/**
 * Get current session - delegates to session module
 * Kept here for compatibility with loaders
 */
export async function getSessionWithSupabase() {
  return getSession();
}

/**
 * Require authentication - redirects to login if no session
 * Uses real Supabase session when not in mock mode
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    throw redirect('/login');
  }

  return session;
}

/**
 * Loader that redirects to login with returnTo param
 */
export async function requireAuthWithReturn(args: LoaderFunctionArgs) {
  const session = await getSession();

  if (!session) {
    const url = new URL(args.request.url);
    const returnTo = url.pathname + url.search;
    throw redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  return session;
}

/**
 * Check if user has specific role
 * Queries users table to check role based on auth_id
 */
export async function requireRole(): Promise<{ role: string } | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  // Get user metadata to check role
  const authId = session.user?.id;

  if (!authId) {
    return null;
  }

  // Query users table to get role
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', authId)
    .single();

  if (error || !data) {
    // If no user record found, return null (no role)
    return null;
  }

  return { role: data.role };
}