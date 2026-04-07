'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

// ─── Nav Items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
        ),
    },
    {
        label: 'Members',
        href: '/members',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
        ),
    },
    {
        label: 'Classes',
        href: '/classes',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3" />
            </svg>
        ),
    },
    {
        label: 'Plans',
        href: '/plans',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
        ),
    },
    {
        label: 'Staff',
        href: '/staff',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
            </svg>
        ),
    },
    {
        label: 'Facility',
        href: '/facility',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
        ),
    },
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
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                                <path d="M6.5 6.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v3.5H13V6.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V14h-3.5v3.5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-11Z" />
                                <path d="M4 9.5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1v-5H4ZM19 9.5h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-5Z" />
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-text-primary whitespace-nowrap">GymMS</span>
                    </div>
                )}

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-all duration-200 cursor-pointer"
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
                {NAV_ITEMS.map((item) => {
                    const isActive =
                        item.href === '/dashboard'
                            ? pathname === '/dashboard' || pathname === '/'
                            : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={collapsed ? item.label : undefined}
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
                            <span className={`shrink-0 transition-colors ${isActive ? 'text-primary-500' : 'text-text-muted group-hover:text-text-primary'}`}>
                                {item.icon}
                            </span>

                            {/* Label */}
                            {!collapsed && (
                                <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
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
                                    {item.label}
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
