import Image from 'next/image';

interface LoadingSpinnerProps {
    message?: string;
    size?: 'small' | 'medium' | 'large';
    fullScreen?: boolean;
}

export default function LoadingSpinner({
    message = 'Đang tải...',
    size = 'medium',
    fullScreen = false,
}: LoadingSpinnerProps) {
    const sizeClasses = {
        small: 'w-16 h-16',
        medium: 'w-24 h-24',
        large: 'w-32 h-32',
    };

    const containerClasses = fullScreen
        ? 'min-h-screen bg-surface-base/90 backdrop-blur-sm flex items-center justify-center fixed inset-0 z-50'
        : 'flex items-center justify-center py-12';

    return (
        <div className={containerClasses}>
            <div className="flex flex-col items-center gap-3">
                <div
                    className={`relative ${sizeClasses[size]}`}
                    role="status"
                    aria-label="loading"
                >
                    <Image
                        src="/gym1.gif"
                        alt="Loading animation"
                        fill
                        className="object-contain"
                        unoptimized
                    />
                    <span className="sr-only">Loading...</span>
                </div>
                {message && (
                    <div className="text-text-secondary text-sm font-medium">{message}</div>
                )}
            </div>
        </div>
    );
}
