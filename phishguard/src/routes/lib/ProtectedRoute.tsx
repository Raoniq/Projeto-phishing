import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getSession } from '@/lib/auth/session';

/**
 * Protected route wrapper that checks for active session.
 * Redirects to /login if no session exists.
 * Shows loading spinner while checking session.
 */
export default function ProtectedRoute() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    getSession()
      .then(session => {
        setIsAuthenticated(!!session);
        setIsChecking(false);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setIsChecking(false);
      });
  }, []);

  if (isChecking) {
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

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return <Outlet />;
}