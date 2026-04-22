import { useState, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppTopbar } from './AppTopbar';
import { MobileDrawer } from './MobileDrawer';
import { cn } from '@/lib/utils';

interface AppShellProps {
  className?: string;
}

export function AppShell({ className }: AppShellProps) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    // Clear session and redirect to login
    localStorage.removeItem('supabase-auth-token');
    navigate('/login');
  }, [navigate]);

  const handleMenuToggle = useCallback(() => {
    setIsMobileDrawerOpen(true);
  }, []);

  const handleMobileDrawerClose = useCallback(() => {
    setIsMobileDrawerOpen(false);
  }, []);

  return (
    <div className={cn('flex min-h-screen bg-[var(--color-surface-0)]', className)}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AppSidebar onLogout={handleLogout} />
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer open={isMobileDrawerOpen} onClose={handleMobileDrawerClose} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Topbar */}
        <AppTopbar onMenuToggle={handleMenuToggle} onLogout={handleLogout} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}