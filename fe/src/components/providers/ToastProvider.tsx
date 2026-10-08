'use client';

import { Toaster } from 'react-hot-toast';

/**
 * Renders the toasts fired through `src/utils/toast.ts`. Mounted once in the root layout —
 * without it every toast.success / toast.error call is queued but never shown.
 * Position, duration and styling are set per toast in utils/toast.ts.
 */
export default function ToastProvider() {
    return <Toaster />;
}
