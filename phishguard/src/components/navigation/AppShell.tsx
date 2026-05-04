import { useState, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppTopbar } from './AppTopbar';
import { MobileDrawer } from './MobileDrawer';
import { useAuth } from '@/lib/auth/AuthContext';
import { useVersionCheck } from '@/lib/version/useVersionCheck';
import { VersionUpdateRail } from '@/components/notifications/VersionUpdateRail';
import { cn } from '@/lib/utils';
import ErrorBoundary from '@/routes/lib/ErrorBoundary';

interface AppShellProps {
  className?: string;
}

export function AppShell({ className }: AppShellProps) {
  const { user, profile, company, loading, isInitialized, signOut } = useAuth();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();

  // Version update watcher — single instance across all routes
  const { updateAvailable, remoteVersion, dismiss, update, loading: updateLoading } = useVersionCheck();

  // ALL useCallback hooks MUST be declared before any early return (Rules of Hooks)
  const handleUpdate = useCallback(() => {
    if (!isInitialized) {
      console.warn('[AppShell] Update deferred — auth not yet initialized');
      return;
    }
    update();
  }, [isInitialized, update]);

  const handleDismiss = useCallback(() => {
    if (remoteVersion) dismiss(remoteVersion);
  }, [remoteVersion, dismiss]);

  const handleLogout = useCallback(async () => {
    await signOut();
    navigate('/login');
  }, [navigate, signOut]);

  const handleMenuToggle = useCallback(() => {
    setIsMobileDrawerOpen(true);
  }, []);

  const handleMobileDrawerClose = useCallback(() => {
    setIsMobileDrawerOpen(false);
  }, []);

  // Wait for AuthContext to be initialized before showing spinner
  // This prevents double-spinner with ProtectedRoute
  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-0)]">
        <div className="w-10 h-10 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn('flex min-h-screen bg-[var(--color-surface-0)]', className)}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AppSidebar
          onLogout={handleLogout}
          tenant={company ? {
            name: company.name,
            plan: company.plan,
            userCount: 0,
            initial: company.name[0]
          } : undefined}
        />
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer open={isMobileDrawerOpen} onClose={handleMobileDrawerClose} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Topbar */}
        <AppTopbar
          onMenuToggle={handleMenuToggle}
          onLogout={handleLogout}
          user={user ? {
            name: profile?.name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            role: profile?.role || 'member',
            initial: (profile?.name || user.email || 'U')[0].toUpperCase()
          } : undefined}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>

        {/* Version Update Rail — fixed positioning, no layout shift */}
        <VersionUpdateRail
          open={updateAvailable}
          onDismiss={handleDismiss}
          onUpdate={handleUpdate}
          loading={updateLoading}
        />
      </div>
    </div>
  );
}