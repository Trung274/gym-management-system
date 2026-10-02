'use client';

import React from 'react';
import Modal, { ModalFooter } from './Modal';

interface ConfirmDialogProps {
    title: React.ReactNode;
    message: React.ReactNode;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    onClose: () => void;
    loading?: boolean;
    /** danger (default) for destructive actions */
    variant?: 'primary' | 'danger';
}

/** Yes/no confirmation for destructive or irreversible actions. Render conditionally. */
export default function ConfirmDialog({
    title,
    message,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onClose,
    loading = false,
    variant = 'danger',
}: ConfirmDialogProps) {
    return (
        <Modal onClose={onClose} title={title} size="sm">
            <div className="p-6 flex flex-col gap-5">
                <div className="text-sm text-text-secondary">{message}</div>
                <ModalFooter
                    onCancel={onClose}
                    cancelLabel={cancelLabel}
                    submitLabel={confirmLabel}
                    onSubmit={onConfirm}
                    loading={loading}
                    variant={variant}
                />
            </div>
        </Modal>
    );
}
