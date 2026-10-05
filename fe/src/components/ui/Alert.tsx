import React from 'react';
import { AlertCircle, Info, X } from 'lucide-react';

type AlertTone = 'danger' | 'info';

interface AlertProps {
    children: React.ReactNode;
    /** danger (default) for errors, info for neutral notes */
    tone?: AlertTone;
    /** Shows a close button */
    onDismiss?: () => void;
    /** Optional inline action, e.g. a "Retry" button */
    action?: React.ReactNode;
    className?: string;
}

const toneStyles: Record<AlertTone, { box: string; Icon: typeof Info; role: 'alert' | 'note' }> = {
    danger: { box: 'bg-danger-500/10 border-danger-500/20 text-danger-500', Icon: AlertCircle, role: 'alert' },
    info:   { box: 'bg-primary-500/10 border-primary-500/20 text-primary-500', Icon: Info, role: 'note' },
};

/** Banner shown above page content — errors by default, or a neutral note with tone="info". */
export default function Alert({ children, tone = 'danger', onDismiss, action, className = '' }: AlertProps) {
    const { box, Icon, role } = toneStyles[tone];
    return (
        <div role={role} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${box} ${className}`}>
            <Icon size={16} className="shrink-0" />
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
