import { redirect } from 'react-router-dom';
import type { LoaderFunctionArgs } from 'react-router-dom';

// Mock auth check - will be replaced with Supabase auth
export async function requireAuth() {
  // TODO: Replace with actual Supabase session check
  // const { data: { session } } = await supabase.auth.getSession();
  // if (!session) {
  //   throw redirect('/login');
  // }

  // For now, allow access. In production, check actual auth state.
  return null;
}

// Loader that redirects to login with returnTo param
export async function requireAuthWithReturn(args: LoaderFunctionArgs) {
  // TODO: Replace with actual Supabase session
  const session = null;

  if (!session) {
    const url = new URL(args.request.url);
    const returnTo = url.pathname + url.search;
    throw redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  return null;
}

// Check if user has specific role
export async function requireRole(): Promise<null> {
  // TODO: Implement role checking with Supabase RLS
  return null;
}