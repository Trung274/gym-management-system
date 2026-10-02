import React from 'react';
import Spinner from './Spinner';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    /** Shows a spinner and disables the button */
    loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary:   'text-white bg-primary-500 hover:bg-primary-600',
    secondary: 'text-text-secondary border border-surface-border hover:bg-surface-overlay',
    danger:    'text-white bg-danger-500 hover:bg-danger-600',
};

/** Standard action button (modal footers, forms). For the page's main "add" CTA use AddButton. */
export default function Button({
    variant = 'primary',
    loading = false,
    disabled,
    type = 'button',
    className = '',
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            type={type}
            disabled={disabled || loading}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${variantStyles[variant]} ${className}`}
            {...props}
        >
            {loading && <Spinner />}
            {children}
        </button>
    );
}
