'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/src/hooks/useAuth';
import { LogOut, Dumbbell, LayoutDashboard, User, ScanLine, CalendarDays, Users, MapPin, Info } from 'lucide-react';
import { getHomePath, ADMIN_ROLES } from '@/src/types/member-portal.types';

const PORTAL_NAV = [
  { href: '/portal',          label: 'Trang chủ',  Icon: LayoutDashboard },
  { href: '/portal/profile',  label: 'Hồ sơ',      Icon: User },
  { href: '/portal/checkins', label: 'Check-in',   Icon: ScanLine },
  { href: '/portal/bookings', label: 'Đặt PT',     Icon: CalendarDays },
  { href: '/portal/classes',  label: 'Lớp học',    Icon: Users },
  { href: '/portal/trainers', label: 'HLV',        Icon: Users },
  { href: '/portal/gym-info', label: 'Phòng gym',  Icon: MapPin },
] as const;

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Role guard: admin/manager/staff → /dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (ADMIN_ROLES.includes(user.role?.name ?? '')) {
        router.replace('/dashboard');
      }
    }
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?from=' + pathname);
    }
  }, [isLoading, isAuthenticated, user, router, pathname]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isAuthorized = user && !ADMIN_ROLES.includes(user.role?.name ?? '');

  if (!mounted || isLoading || !isAuthenticated || !isAuthorized) return null;

  return (
    <div className="min-h-screen bg-surface-raised flex flex-col">
      {/* Navbar */}
      <header className="bg-surface-base border-b border-surface-border sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link href="/portal" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center">
              <Dumbbell size={16} className="text-white" />
            </div>
            <span className="font-bold text-sm text-text-primary hidden sm:block">Gym Portal</span>
          </Link>

          {/* Nav links — scrollable on mobile */}
          <nav className="flex items-center gap-1 overflow-x-auto flex-1 px-2">
            {PORTAL_NAV.map(({ href, label, Icon }) => {
              const active = pathname === href || (href !== '/portal' && pathname.startsWith(href));
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                    ${active ? 'bg-primary-500 text-white' : 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary'}`}>
                  <Icon size={13} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User + logout */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-text-muted hidden md:block max-w-[120px] truncate">{user?.name}</span>
            <button onClick={handleLogout} title="Đăng xuất"
              className="p-1.5 rounded-lg text-text-muted hover:text-danger-500 hover:bg-danger-500/10 cursor-pointer transition-all">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-text-muted border-t border-surface-border">
        © {new Date().getFullYear()} Gym Management System
      </footer>
    </div>
  );
}
