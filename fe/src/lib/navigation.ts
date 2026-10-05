// ─── Admin-area navigation ────────────────────────────────────────────────────
// Single source for the sidebar and the route guard in (protected)/layout.tsx:
// an item is shown — and its pages are reachable — only if the user passes `access`.

import {
  LayoutDashboard, Users, CalendarDays, Users2, ClipboardList, Briefcase,
  UserCheck, Wrench, ScanLine, Building2, UserCog, ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { User } from '@/src/types/auth.types';
import { hasPermission } from '@/src/lib/auth';
import { isAdmin } from '@/src/lib/roles';

type NavAccess =
  | { permission: readonly [resource: string, action: string] }
  | { adminOnly: true };

export interface NavItem {
  labelKey: string; // key in the "layout" namespace
  href: string;
  Icon: LucideIcon;
  access: NavAccess;
}

/** Main section — list/view permissions decide visibility (write actions are enforced by the API). */
export const NAV_ITEMS: readonly NavItem[] = [
  { labelKey: 'nav.dashboard',    href: '/dashboard',     Icon: LayoutDashboard, access: { permission: ['dashboard', 'view'] } },
  { labelKey: 'nav.members',      href: '/members',       Icon: Users,           access: { permission: ['members', 'list'] } },
  { labelKey: 'nav.bookings',     href: '/bookings',      Icon: CalendarDays,    access: { permission: ['bookings', 'list'] } },
  { labelKey: 'nav.groupClasses', href: '/group-classes', Icon: Users2,          access: { permission: ['classes', 'list'] } },
  { labelKey: 'nav.plans',        href: '/plans',         Icon: ClipboardList,   access: { permission: ['plans', 'list'] } },
  { labelKey: 'nav.staff',        href: '/staff',         Icon: Briefcase,       access: { permission: ['staff', 'list'] } },
  { labelKey: 'nav.trainers',     href: '/trainers',      Icon: UserCheck,       access: { permission: ['trainers', 'list'] } },
  { labelKey: 'nav.equipment',    href: '/equipment',     Icon: Wrench,          access: { permission: ['equipment', 'list'] } },
  { labelKey: 'nav.checkins',     href: '/checkins',      Icon: ScanLine,        access: { permission: ['checkins', 'list'] } },
  { labelKey: 'nav.gymInfo',      href: '/gym-info',      Icon: Building2,       access: { permission: ['gym', 'read'] } },
];

/** "System administration" section — admin only, never grantable through permissions. */
export const ADMIN_NAV_ITEMS: readonly NavItem[] = [
  { labelKey: 'nav.users',       href: '/users',       Icon: UserCog,     access: { adminOnly: true } },
  { labelKey: 'nav.permissions', href: '/permissions', Icon: ShieldCheck, access: { adminOnly: true } },
];

export const canAccessNavItem = (user: User | null, item: NavItem): boolean =>
  'adminOnly' in item.access
    ? isAdmin(user?.role?.name)
    : hasPermission(user, item.access.permission[0], item.access.permission[1]);

const findNavItem = (pathname: string): NavItem | undefined =>
  [...NAV_ITEMS, ...ADMIN_NAV_ITEMS].find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

/** Paths outside the nav (none today) stay reachable; the API still enforces permissions. */
export const canAccessPath = (user: User | null, pathname: string): boolean => {
  const item = findNavItem(pathname);
  return !item || canAccessNavItem(user, item);
};

/** First page the user may open — where to send them from a page they can't access. */
export const getFirstAccessiblePath = (user: User | null): string | null =>
  [...NAV_ITEMS, ...ADMIN_NAV_ITEMS].find((item) => canAccessNavItem(user, item))?.href ?? null;
