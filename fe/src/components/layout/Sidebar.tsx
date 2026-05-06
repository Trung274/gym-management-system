'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
    LayoutDashboard,
    Users,
    CalendarDays,
    ClipboardList,
    Briefcase,
    UserCheck,
    Wrench,
    ChevronLeft,
    Dumbbell,
} from 'lucide-react';

// ─── Nav Items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
    { label: 'Dashboard',        href: '/dashboard', Icon: LayoutDashboard },
    { label: 'Hội viên',         href: '/members',   Icon: Users },
    { label: 'Lịch đặt PT',      href: '/classes',   Icon: CalendarDays },
    { label: 'Gói tập',          href: '/plans',     Icon: ClipboardList },
    { label: 'Nhân viên',        href: '/staff',     Icon: Briefcase },
    { label: 'Huấn luyện viên',  href: '/trainers',  Icon: UserCheck },
    { label: 'Thiết bị',         href: '/equipment', Icon: Wrench },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────
export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={`
                flex flex-col bg-surface-base border-r border-surface-border
                transition-all duration-300 ease-in-out
                ${collapsed ? 'w-16' : 'w-60'}
                min-h-screen shrink-0
            `}
        >
            {/* Brand + Collapse toggle */}
            <div className={`flex items-center h-16 border-b border-surface-border px-3 ${collapsed ? 'justify-center' : 'justify-between'}`}>
                {!collapsed && (
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-500 shadow shrink-0">
                            <Dumbbell size={14} className="text-white" />
                        </div>
                        <span className="text-sm font-bold text-text-primary whitespace-nowrap">GymMS</span>
                    </div>
                )}

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-all duration-200 cursor-pointer"
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <ChevronLeft
                        size={16}
                        className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
                    />
                </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
                {NAV_ITEMS.map(({ label, href, Icon }) => {
                    const isActive =
                        href === '/dashboard'
                            ? pathname === '/dashboard' || pathname === '/'
                            : pathname.startsWith(href);

                    return (
                        <Link
                            key={href}
                            href={href}
                            title={collapsed ? label : undefined}
                            className={`
                                group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                                transition-all duration-200 font-medium text-sm
                                ${isActive
                                    ? 'bg-primary-500/10 text-primary-500'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
                                }
                                ${collapsed ? 'justify-center' : ''}
                            `}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-500 rounded-r-full" />
                            )}

                            {/* Icon */}
                            <Icon
                                size={18}
                                className={`shrink-0 transition-colors ${
                                    isActive ? 'text-primary-500' : 'text-text-muted group-hover:text-text-primary'
                                }`}
                            />

                            {/* Label */}
                            {!collapsed && (
                                <span className="whitespace-nowrap overflow-hidden">{label}</span>
                            )}

                            {/* Tooltip when collapsed */}
                            {collapsed && (
                                <span className="
                                    absolute left-full ml-3 px-2.5 py-1 rounded-lg
                                    bg-surface-raised border border-surface-border
                                    text-text-primary text-xs font-semibold
                                    whitespace-nowrap opacity-0 pointer-events-none
                                    group-hover:opacity-100
                                    transition-opacity duration-150 z-50
                                    shadow-md
                                ">
                                    {label}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            {!collapsed && (
                <div className="px-4 py-3 border-t border-surface-border">
                    <p className="text-[11px] text-text-muted text-center">GymMS v1.0</p>
                </div>
            )}
        </aside>
    );
}
