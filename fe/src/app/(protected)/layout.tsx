import Header from '@/src/components/layout/Header';
import Sidebar from '@/src/components/layout/Sidebar';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
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
