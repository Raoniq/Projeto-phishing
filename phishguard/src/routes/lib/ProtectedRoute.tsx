import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth/AuthContext';

/**
 * Protected route wrapper that checks for active session.
 * Redirects to /login if no session exists.
 * Loading state is handled by AppShell (inside Outlet) to avoid double spinners.
 */
export default function ProtectedRoute() {
  const { user, isInitialized } = useAuth();
  const location = useLocation();

  // Wait for AuthContext to be initialized before rendering outlet.
  // AppShell handles its own loading spinner, so we just render nothing
  // (or a minimal placeholder) while waiting.
  if (!isInitialized) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-noir-900)' }}
      >
        <div
          className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-accent)] border-t-transparent"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return <Outlet />;
}