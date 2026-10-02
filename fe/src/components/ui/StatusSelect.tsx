'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { badgeClass, type BadgeTone } from './Badge';

interface StatusSelectProps<T extends string> {
    value: T;
    options: { value: T; label: string }[];
    tone: BadgeTone;
    onChange: (value: T) => void;
    disabled?: boolean;
}

/** Status badge that opens a menu to change the status (inline table editing). */
export default function StatusSelect<T extends string>({ value, options, tone, onChange, disabled = false }: StatusSelectProps<T>) {
    const [open, setOpen] = useState(false);
    const current = options.find((o) => o.value === value)?.label ?? value;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => !disabled && setOpen((o) => !o)}
                disabled={disabled}
                className={`${badgeClass(tone)} transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
            >
                {current}
                {!disabled && <ChevronDown size={12} />}
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 z-20 bg-surface-base border border-surface-border rounded-xl shadow-xl py-1 w-44">
                        {options.map((o) => (
                            <button
                                key={o.value}
                                type="button"
                                onClick={() => { onChange(o.value); setOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-surface-raised transition-all cursor-pointer ${value === o.value ? 'text-primary-500' : 'text-text-secondary'}`}
                            >
                                {o.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
