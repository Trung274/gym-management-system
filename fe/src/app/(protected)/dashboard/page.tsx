import Header from '@/src/components/layout/Header';

export default function DashboardPage() {
    return (
        <div className="flex-1 flex flex-col min-h-screen bg-surface-raised">
            <Header />
            <main className="p-4 md:p-6 lg:p-8 flex-1">
                <h1 className="text-2xl font-bold text-text-primary mb-6">
                    Chào mừng đến Dashboard
                </h1>
            </main>
        </div>
    );
}