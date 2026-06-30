'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import Header from '@/src/components/layout/Header';
import Sidebar from '@/src/components/layout/Sidebar';
import { ADMIN_ROLES } from '@/src/types/member-portal.types';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isLoading && isAuthenticated && user) {
            // Guard: member/trainer → /portal
            if (!ADMIN_ROLES.includes(user.role?.name ?? '')) {
                router.replace('/portal');
            }
        }
        if (!isLoading && !isAuthenticated) {
            router.replace('/login?from=' + pathname);
        }
    }, [isLoading, isAuthenticated, user, router, pathname]);

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
                    {children}
                </main>
            </div>
        </div>
    );
}

