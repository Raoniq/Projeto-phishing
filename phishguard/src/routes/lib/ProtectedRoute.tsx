import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getSession, hasMockSession, isMockMode } from '@/lib/auth/session';
import { useAuth } from '@/lib/auth/AuthContext';

/**
 * Protected route wrapper that checks for active session.
 * Redirects to /login if no session exists.
 * Shows loading spinner while checking session.
 */
export default function ProtectedRoute() {
  const { user, loading, isInitialized } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const location = useLocation();

  // Use Supabase's built-in session management
  // isInitialized means AuthContext has done its initial check
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

  if (!user && !hasMockSession()) {
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return <Outlet />;
}