import React from 'react';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'primary' | 'info' | 'violet' | 'neutral';

const toneStyles: Record<BadgeTone, { badge: string; dot: string }> = {
    success: { badge: 'bg-success-500/15 text-success-500', dot: 'bg-success-500' },
    warning: { badge: 'bg-warning-500/15 text-warning-500', dot: 'bg-warning-500' },
    danger:  { badge: 'bg-danger-500/15 text-danger-500',   dot: 'bg-danger-500' },
    primary: { badge: 'bg-primary-500/15 text-primary-500', dot: 'bg-primary-500' },
    info:    { badge: 'bg-sky-500/15 text-sky-500',         dot: 'bg-sky-500' },
    violet:  { badge: 'bg-violet-500/15 text-violet-500',   dot: 'bg-violet-500' },
    neutral: { badge: 'bg-surface-overlay text-text-muted', dot: 'bg-text-muted' },
};

/** Pill classes for a tone — for elements that must stay a <button> (see StatusSelect). */
export const badgeClass = (tone: BadgeTone) =>
    `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${toneStyles[tone].badge}`;

interface BadgeProps {
    tone?: BadgeTone;
    /** Leading colored dot */
    dot?: boolean;
    className?: string;
    children: React.ReactNode;
}

/** Status / role pill. Map domain values to tones in src/lib/statusTones.ts. */
export default function Badge({ tone = 'neutral', dot = false, className = '', children }: BadgeProps) {
    return (
        <span className={`${badgeClass(tone)} ${className}`}>
            {dot && <span className={`w-1.5 h-1.5 rounded-full ${toneStyles[tone].dot}`} />}
            {children}
        </span>
    );
}
