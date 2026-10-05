'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronLeft, Dumbbell } from 'lucide-react';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { useAuth } from '@/src/hooks/useAuth';
import { NAV_ITEMS, ADMIN_NAV_ITEMS, canAccessNavItem, type NavItem } from '@/src/lib/navigation';

// ─── Nav link ─────────────────────────────────────────────────────────────────
function NavLink({ item, label, collapsed, onNavigate }: {
    item: NavItem;
    label: string;
    collapsed: boolean;
    onNavigate: () => void;
}) {
    const pathname = usePathname();
    const { href, Icon } = item;
    const isActive =
        href === '/dashboard'
            ? pathname === '/dashboard' || pathname === '/'
            : pathname.startsWith(href);

    return (
        <Link
            href={href}
            onClick={onNavigate}
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
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const { t } = useLanguage();
    const tLayout = t('layout');
    const { user } = useAuth();

    // Only show what the current role can open (see src/lib/navigation.ts)
    const mainItems = NAV_ITEMS.filter((item) => canAccessNavItem(user, item));
    const adminItems = ADMIN_NAV_ITEMS.filter((item) => canAccessNavItem(user, item));

    const closeOnMobile = () => {
        if (window.innerWidth < 768) {
            setCollapsed(true);
        }
    };

    const renderLink = (item: NavItem) => (
        <NavLink key={item.href} item={item} label={tLayout(item.labelKey)} collapsed={collapsed} onNavigate={closeOnMobile} />
    );

    return (
        <>
            {/* Mobile backdrop */}
            {!collapsed && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setCollapsed(true)}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`
                    flex flex-col bg-surface-base border-r border-surface-border
                    transition-all duration-300 ease-in-out
                    min-h-screen shrink-0

                    /* Mobile: fixed overlay */
                    fixed z-50 top-0 left-0 bottom-0
                    ${collapsed ? 'w-16' : 'w-60'}

                    /* Desktop: relative, normal flow */
                    md:relative md:z-auto
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
                {mainItems.map(renderLink)}

                {/* System administration (admin only) */}
                {adminItems.length > 0 && (
                    <>
                        {collapsed ? (
                            <div className="my-3 mx-2 border-t border-surface-border" aria-hidden="true" />
                        ) : (
                            <p className="mt-5 mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                                {tLayout('nav.adminSection')}
                            </p>
                        )}
                        {adminItems.map(renderLink)}
                    </>
                )}
            </nav>

            {/* Footer */}
            {!collapsed && (
                <div className="px-4 py-3 border-t border-surface-border">
                    <p className="text-[11px] text-text-muted text-center">GymMS v1.0</p>
                </div>
            )}
        </aside>
            {/* Spacer for mobile to push main content to accommodate the collapsed sidebar */}
            <div className="md:hidden w-16 shrink-0" aria-hidden="true" />
        </>
    );
}
