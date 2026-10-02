import React from 'react';

export interface SegmentOption<T> {
    value: T;
    label: React.ReactNode;
    /** Subtle ring, e.g. to mark "today" */
    highlight?: boolean;
}

interface SegmentedControlProps<T extends string | number> {
    value: T;
    onChange: (value: T) => void;
    options: SegmentOption<T>[];
    /** sm = filter chips (default), md = tabs */
    size?: 'sm' | 'md';
    accent?: 'primary' | 'violet';
    className?: string;
}

const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
};

const accentStyles = {
    primary: 'bg-primary-500 text-white shadow',
    violet:  'bg-violet-500 text-white shadow',
};

/** Pill-style single choice: filter chips and tabs. */
export default function SegmentedControl<T extends string | number>({
    value,
    onChange,
    options,
    size = 'sm',
    accent = 'primary',
    className = '',
}: SegmentedControlProps<T>) {
    return (
        <div className={`flex flex-wrap gap-1 p-1 bg-surface-raised rounded-xl border border-surface-border ${className}`}>
            {options.map((opt) => (
                <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={`${sizeStyles[size]} rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap
                        ${value === opt.value ? accentStyles[accent] : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'}
                        ${opt.highlight ? 'ring-1 ring-primary-500/40' : ''}`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}
