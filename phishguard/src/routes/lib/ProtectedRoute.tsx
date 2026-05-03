import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth/AuthContext';

/**
 * Protected route wrapper that checks for active session.
 * Redirects to /login if no session exists.
 * Shows loading spinner while checking session.
 */
export default function ProtectedRoute() {
  const { user, loading, isInitialized } = useAuth();
  const location = useLocation();

  // AuthContext guarantees loading=false and isInitialized=true within 8s (or timeout)
  if (!isInitialized || loading) {
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