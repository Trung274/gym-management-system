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
        small: 'w-5 h-5 border-2',
        medium: 'w-9 h-9 border-[3px]',
        large: 'w-14 h-14 border-4',
    };

    const containerClasses = fullScreen
        ? 'min-h-screen bg-surface-base/90 backdrop-blur-sm flex items-center justify-center fixed inset-0 z-50'
        : 'flex items-center justify-center py-12';

    return (
        <div className={containerClasses}>
            <div className="flex flex-col items-center gap-3">
                <div
                    className={`animate-spin rounded-full border-surface-border border-t-primary-500 ${sizeClasses[size]}`}
                    role="status"
                    aria-label="loading"
                >
                    <span className="sr-only">Loading...</span>
                </div>
                {message && (
                    <div className="text-text-secondary text-sm font-medium">{message}</div>
                )}
            </div>
        </div>
    );
}
