import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface AlertProps {
    children: React.ReactNode;
    /** Shows a close button */
    onDismiss?: () => void;
    /** Optional inline action, e.g. a "Retry" button */
    action?: React.ReactNode;
    className?: string;
}

/** Error banner shown above page content. */
export default function Alert({ children, onDismiss, action, className = '' }: AlertProps) {
    return (
        <div role="alert" className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-500 text-sm ${className}`}>
            <AlertCircle size={16} className="shrink-0" />
            <span className="flex-1">{children}</span>
            {action}
            {onDismiss && (
                <button type="button" onClick={onDismiss} className="hover:opacity-70 cursor-pointer">
                    <X size={14} />
                </button>
            )}
        </div>
    );
}
