'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { ChevronDown, LogOut, Dumbbell } from 'lucide-react';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';

export default function Header() {
    const { user, logout, isLoading: authLoading } = useAuth();
    const { t } = useLanguage();
    const tLayout = t('layout');
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
                        <Dumbbell size={16} className="text-white" />
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-text-primary">
                        {tLayout('nav.dashboard')}
                    </h2>
                </div>

                {/* Right Section — Language + Theme + Profile */}
                <div className="flex items-center gap-2 md:gap-3">

                    <LanguageSwitcher />

                    <ThemeToggle />

                    {/* Profile Dropdown */}
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
                                        <span className="text-white font-bold text-sm">{userInitial}</span>
                                    </div>
                                )}
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
                                        <p className="text-xs text-text-muted leading-tight">{displayEmail}</p>
                                    </>
                                )}
                            </div>

                            <ChevronDown
                                size={16}
                                className={`hidden sm:block text-text-muted group-hover:text-text-primary transition-all duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                                <div className="absolute right-0 mt-2 w-56 bg-surface-base border border-surface-border rounded-xl shadow-xl z-50 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-surface-border">
                                        <p className="text-sm font-semibold text-text-primary truncate">{displayName}</p>
                                        <p className="text-xs text-text-muted truncate">{displayEmail}</p>
                                    </div>
                                    <div className="p-1.5">
                                        <button
                                            onClick={handleLogout}
                                            disabled={isLoggingOut}
                                            className="w-full group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-danger-500/10 transition-all duration-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <div className="p-1.5 bg-danger-500/10 rounded-md group-hover:bg-danger-500/20 transition-all">
                                                <LogOut size={16} className="text-danger-500" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="text-sm font-medium text-text-primary group-hover:text-danger-500 transition-colors">
                                                    {isLoggingOut ? tLayout('header.loggingOut') : tLayout('header.logout')}
                                                </p>
                                                <p className="text-xs text-text-muted">{tLayout('header.leaveAccount')}</p>
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