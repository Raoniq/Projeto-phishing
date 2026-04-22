import { useState, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LearnerSidebar } from './LearnerSidebar';
import { LearnerTopbar } from './LearnerTopbar';
import { LearnerMobileDrawer } from './LearnerMobileDrawer';
import { NotificationsPanel } from './NotificationsPanel';
import { cn } from '@/lib/utils';

interface LearnerShellProps {
  companyLogo?: string;
  companyName?: string;
  user?: {
    name: string;
    email: string;
    role: string;
    initial: string;
  };
  notifications?: NotificationsPanelProps['notifications'];
  onLogout?: () => void;
  className?: string;
}

interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'success' | 'training';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
}

interface NotificationsPanelProps {
  notifications?: NotificationItem[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onNotificationClick?: (notification: NotificationItem) => void;
  className?: string;
}

export function LearnerShell({
  companyLogo,
  companyName = 'PhishGuard',
  user = {
    name: 'Maria Silva',
    email: 'maria.silva@empresa.com',
    role: 'Colaboradora',
    initial: 'M',
  },
  notifications,
  className,
}: LearnerShellProps) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    localStorage.removeItem('supabase-auth-token');
    navigate('/login');
  }, [navigate]);

  const handleMenuToggle = useCallback(() => {
    setIsMobileDrawerOpen(true);
  }, []);

  const handleNotificationsClick = useCallback(() => {
    setIsNotificationsOpen(true);
  }, []);

  return (
    <div className={cn('flex min-h-screen bg-[var(--color-surface-0)]', className)}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <LearnerSidebar
          companyLogo={companyLogo}
          companyName={companyName}
          user={user}
          onLogout={handleLogout}
          notificationCount={notifications?.filter((n) => !n.read).length ?? 0}
        />
      </div>

      {/* Mobile Drawer */}
      <LearnerMobileDrawer
        open={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        companyLogo={companyLogo}
        companyName={companyName}
        user={user}
        notificationCount={notifications?.filter((n) => !n.read).length ?? 0}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Topbar */}
        <LearnerTopbar
          companyLogo={companyLogo}
          companyName={companyName}
          userName={user.name}
          notificationCount={notifications?.filter((n) => !n.read).length ?? 0}
          onMenuToggle={handleMenuToggle}
          onLogout={handleLogout}
          onNotificationsClick={handleNotificationsClick}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Notifications Panel - Slide-in from right */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[var(--color-surface-0)]/80 backdrop-blur-sm"
            onClick={() => setIsNotificationsOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm">
            <div className="h-full">
              <NotificationsPanel
                notifications={notifications}
                className="h-full rounded-none border-l border-[var(--color-surface-3)]"
                onNotificationClick={(notif) => {
                  if (notif.actionUrl) {
                    navigate(notif.actionUrl);
                    setIsNotificationsOpen(false);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}