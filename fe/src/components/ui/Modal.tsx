'use client';

import React from 'react';
import { X } from 'lucide-react';
import Button from './Button';

type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
    onClose: () => void;
    title: React.ReactNode;
    children: React.ReactNode;
    /** sm = confirm dialogs, md = short forms, lg = long forms */
    size?: ModalSize;
    /**
     * Long content: caps the panel at 90vh. The child should then be
     * `overflow-y-auto flex-1` so only the body scrolls (header stays put).
     */
    scrollable?: boolean;
}

const sizeStyles: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
};

/**
 * Modal shell: backdrop (click to close) + panel + header with title and close button.
 * Render it conditionally (`{open && <Modal ...>}`); body and footer are the caller's.
 */
export default function Modal({ onClose, title, children, size = 'md', scrollable = false }: ModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div
                role="dialog"
                aria-modal="true"
                className={`relative w-full ${sizeStyles[size]} bg-surface-base rounded-2xl shadow-2xl border border-surface-border overflow-hidden ${scrollable ? 'max-h-[90vh] flex flex-col' : ''}`}
            >
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-surface-border shrink-0">
                    <h2 className="text-base font-bold text-text-primary">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-all cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

interface ModalFooterProps {
    onCancel: () => void;
    cancelLabel: string;
    submitLabel: React.ReactNode;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'danger';
    /** Without onSubmit the confirm button is `type="submit"` and submits the surrounding form */
    onSubmit?: () => void;
    /** Pin to the bottom of a scrollable form body (use inside a `p-6` scroll container) */
    sticky?: boolean;
}

/** Cancel + confirm button row at the bottom of a modal. */
export function ModalFooter({
    onCancel,
    cancelLabel,
    submitLabel,
    loading = false,
    disabled = false,
    variant = 'primary',
    onSubmit,
    sticky = false,
}: ModalFooterProps) {
    return (
        <div className={`flex gap-3 pt-2 ${sticky ? 'sticky bottom-0 bg-surface-base border-t border-surface-border -mx-6 px-6 py-4 -mb-6' : ''}`}>
            <Button variant="secondary" onClick={onCancel} className="flex-1">
                {cancelLabel}
            </Button>
            <Button
                variant={variant}
                type={onSubmit ? 'button' : 'submit'}
                onClick={onSubmit}
                loading={loading}
                disabled={disabled}
                className="flex-1"
            >
                {submitLabel}
            </Button>
        </div>
    );
}
