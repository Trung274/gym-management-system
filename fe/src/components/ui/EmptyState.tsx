import React from 'react';

interface EmptyStateProps {
    /** lucide icon element, e.g. `<Users size={40} />` */
    icon?: React.ReactElement;
    title: React.ReactNode;
    description?: React.ReactNode;
    className?: string;
}

/** "Nothing here" placeholder for lists and tables (inside a table: `<td colSpan={n}>`). */
export default function EmptyState({ icon, title, description, className = '' }: EmptyStateProps) {
    return (
        <div className={`py-16 px-4 text-center flex flex-col items-center ${className}`}>
            {icon && (
                <div className="mb-3 text-text-muted opacity-40">{icon}</div>
            )}
            <p className="text-sm font-semibold text-text-primary">{title}</p>
            {description && <p className="text-xs text-text-muted mt-1">{description}</p>}
        </div>
    );
}
