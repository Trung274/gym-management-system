import React from 'react';

interface EmptyStateProps {
    /** lucide icon element or an emoji string */
    icon?: React.ReactNode;
    title: React.ReactNode;
    description?: React.ReactNode;
    className?: string;
}

/** "Nothing here" placeholder for lists and tables (inside a table: `<td colSpan={n}>`). */
export default function EmptyState({ icon, title, description, className = '' }: EmptyStateProps) {
    return (
        <div className={`py-16 px-4 text-center flex flex-col items-center ${className}`}>
            {icon && (
                <div className="mb-3 text-text-muted">
                    {typeof icon === 'string' ? <span className="text-4xl">{icon}</span> : <span className="opacity-40">{icon}</span>}
                </div>
            )}
            <p className="text-sm font-semibold text-text-primary">{title}</p>
            {description && <p className="text-xs text-text-muted mt-1">{description}</p>}
        </div>
    );
}
