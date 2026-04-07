'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { useTheme } from '@/src/components/providers/ThemeProvider';

export default function Header() {
    const { user, logout, isLoading: authLoading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        setIsDropdownOpen(false);
        setIsLoggingOut(true);
        try {
            await logout();
            router.push('/login');
        } finally {
            setIsLoggingOut(false);
        }
    };

    const displayName = (isMounted && user?.name) || (authLoading ? '' : 'User');
    const displayEmail = (isMounted && user?.email) || '';
    const userInitial = (isMounted && user?.name?.charAt(0).toUpperCase()) || 'U';

    return (
        <header className="bg-surface-base border-b border-surface-border sticky top-0 z-40">
            <div className="px-4 md:px-6 py-4 flex items-center justify-between">
                {/* Left Section — Brand + Title */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-500 shadow shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                            <path d="M6.5 6.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v3.5H13V6.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V14h-3.5v3.5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-11Z" />
                            <path d="M4 9.5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1v-5H4ZM19 9.5h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-5Z" />
                        </svg>
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-text-primary">Dashboard</h2>
                </div>

                {/* Right Section — Theme Toggle + Profile Dropdown */}
                <div className="flex items-center gap-2 md:gap-3">
                    {/* Dark / Light toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-all duration-200"
                        aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
                        title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                    >
                        {theme === 'dark' ? (
                            // Sun icon — switch to light
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                            </svg>
                        ) : (
                            // Moon icon — switch to dark
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                            </svg>
                        )}
                    </button>

                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="group flex items-center gap-2 md:gap-3 px-2 py-1.5 rounded-xl hover:bg-surface-overlay transition-all duration-200 cursor-pointer"
                        >
                            {/* Avatar */}
                            <div className="relative">
                                {authLoading ? (
                                    <div className="w-8 h-8 md:w-9 md:h-9 bg-surface-overlay rounded-full animate-pulse" />
                                ) : (
                                    <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full border-2 border-primary-500/40 flex items-center justify-center shadow">
                                        <span className="text-white font-bold text-sm">
                                            {userInitial}
                                        </span>
                                    </div>
                                )}

                                {/* Online dot */}
                                {isMounted && user?.isActive && (
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success-500 rounded-full border-2 border-surface-base" />
                                )}
                            </div>

                            {/* Name + email — desktop only */}
                            <div className="hidden lg:block text-left">
                                {authLoading ? (
                                    <>
                                        <div className="h-3.5 w-24 bg-surface-overlay rounded animate-pulse mb-1" />
                                        <div className="h-3 w-32 bg-surface-overlay rounded animate-pulse" />
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm font-semibold text-text-primary group-hover:text-primary-500 transition-colors leading-tight">
                                            {displayName}
                                        </p>
                                        <p className="text-xs text-text-muted leading-tight">
                                            {displayEmail}
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Chevron */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className={`hidden sm:block w-4 h-4 text-text-muted group-hover:text-text-primary transition-all duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <>
                                {/* Backdrop */}
                                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />

                                {/* Menu */}
                                <div className="absolute right-0 mt-2 w-56 bg-surface-base border border-surface-border rounded-xl shadow-xl z-50 overflow-hidden">
                                    {/* User info header */}
                                    <div className="px-4 py-3 border-b border-surface-border">
                                        <p className="text-sm font-semibold text-text-primary truncate">{displayName}</p>
                                        <p className="text-xs text-text-muted truncate">{displayEmail}</p>
                                    </div>

                                    {/* Actions */}
                                    <div className="p-1.5">
                                        <button
                                            onClick={handleLogout}
                                            disabled={isLoggingOut}
                                            className="w-full group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-danger-500/10 transition-all duration-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <div className="p-1.5 bg-danger-500/10 rounded-md group-hover:bg-danger-500/20 transition-all">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-danger-500">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="text-sm font-medium text-text-primary group-hover:text-danger-500 transition-colors">
                                                    {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                                </p>
                                                <p className="text-xs text-text-muted">Thoát khỏi tài khoản</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}