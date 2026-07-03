import React from 'react';

export interface StatItem {
    label: string;
    value: string | number;
    color?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
    icon?: React.ReactNode;
}

interface StatsGridProps {
    items: StatItem[];
    isLoading?: boolean;
    className?: string;
}

const colorStyles = {
    primary: {
        border: 'border-primary-500/40',
        text: 'text-primary-500',
    },
    success: {
        border: 'border-success-500/40',
        text: 'text-success-500',
    },
    warning: {
        border: 'border-warning-500/40',
        text: 'text-warning-500',
    },
    danger: {
        border: 'border-danger-500/40',
        text: 'text-danger-500',
    },
    info: {
        border: 'border-blue-500/40',
        text: 'text-blue-500',
    },
    secondary: {
        border: 'border-secondary-500/40',
        text: 'text-secondary-500',
    },
};

export default function StatsGrid({ items, isLoading = false, className }: StatsGridProps) {
    const defaultGridCls = items.length === 6
        ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
        : items.length === 3
            ? "grid grid-cols-1 sm:grid-cols-3 gap-4"
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6";

    return (
        <div className={className || defaultGridCls}>
            {items.map((item, index) => {
                const style = colorStyles[item.color || 'primary'];
                return (
                    <div
                        key={index}
                        className={`bg-surface-overlay p-4 md:p-6 rounded-xl flex flex-col justify-end min-h-[110px] md:min-h-[130px] border-l-4 ${style.border} border border-surface-border/50 relative overflow-hidden`}
                    >
                        {item.icon && (
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-text-primary">
                                {item.icon}
                            </div>
                        )}
                        <span className={`text-2xl md:text-3xl font-black font-headline tracking-tighter ${style.text}`}>
                            {isLoading ? (
                                <span className="inline-block h-8 w-12 bg-surface-border rounded animate-pulse" />
                            ) : (
                                item.value
                            )}
                        </span>
                        <span className="text-text-secondary text-[10px] uppercase tracking-widest font-bold mt-1">
                            {item.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
