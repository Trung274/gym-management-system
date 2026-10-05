'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import Header from '@/src/components/layout/Header';
import Sidebar from '@/src/components/layout/Sidebar';
import { ADMIN_ROLES } from '@/src/types/member-portal.types';
import { canAccessPath, getFirstAccessiblePath } from '@/src/lib/navigation';
import { useLanguage } from '@/src/components/providers/LanguageProvider';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useLanguage();

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Re-sync role + permissions once per page load — an admin may have changed them
    useEffect(() => {
        if (isAuthenticated) refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    const canOpenPage = !!user && canAccessPath(user, pathname);
    const fallbackPath = user ? getFirstAccessiblePath(user) : null;

    useEffect(() => {
        if (!isLoading && isAuthenticated && user) {
            // Guard: member → /portal
            if (!ADMIN_ROLES.includes(user.role?.name ?? '')) {
                router.replace('/portal');
            // Guard: page not allowed for this role → first page it can open
            } else if (!canOpenPage && fallbackPath && fallbackPath !== pathname) {
                router.replace(fallbackPath);
            }
        }
        if (!isLoading && !isAuthenticated) {
            router.replace('/login?from=' + pathname);
        }
    }, [isLoading, isAuthenticated, user, router, pathname, canOpenPage, fallbackPath]);

    const isAuthorized = user && ADMIN_ROLES.includes(user.role?.name ?? '');

    if (!mounted || isLoading || !isAuthenticated || !isAuthorized) return null;

    return (
        <div className="flex min-h-screen bg-surface-raised">
            {/* Sidebar */}
            <Sidebar />

            {/* Main area */}
            <div className="flex flex-col flex-1 min-w-0">
                <Header />
                <main className="flex-1 p-4 md:p-6 lg:p-8">
                    {canOpenPage
                        ? children
                        : !fallbackPath && <p className="text-sm text-text-muted text-center py-16">{t('layout')('noAccess')}</p>}
                </main>
            </div>
        </div>
    );
}

