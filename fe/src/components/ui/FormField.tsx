import React from 'react';

// ─── Field wrapper ────────────────────────────────────────────────────────────

interface FormFieldProps {
    label: React.ReactNode;
    required?: boolean;
    /** Validation message shown under the control */
    error?: string;
    className?: string;
    children: React.ReactNode;
}

/** Label + control + validation message. */
export default function FormField({ label, required, error, className = '', children }: FormFieldProps) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label className="text-xs font-semibold text-text-secondary">
                {label}
                {required && <span className="text-danger-500"> *</span>}
            </label>
            {children}
            {error && <p className="text-xs text-danger-500">{error}</p>}
        </div>
    );
}

// ─── Controls ─────────────────────────────────────────────────────────────────

/** Shared class for text inputs, selects and textareas. `invalid` switches to the danger border. */
export const inputClass = (invalid = false) =>
    `w-full px-3 py-2 rounded-xl border text-sm text-text-primary bg-surface-raised placeholder-text-muted outline-none transition-all ${
        invalid
            ? 'border-danger-500 focus:ring-2 focus:ring-danger-500/30'
            : 'border-surface-border focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
    }`;

type ControlProps = { invalid?: boolean };

export function Input({ invalid, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & ControlProps) {
    return <input className={`${inputClass(invalid)} ${className}`} {...props} />;
}

export function Select({ invalid, className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & ControlProps) {
    return <select className={`${inputClass(invalid)} ${className}`} {...props} />;
}

export function Textarea({ invalid, className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & ControlProps) {
    return <textarea className={`${inputClass(invalid)} resize-none ${className}`} {...props} />;
}
