import { Loader2 } from 'lucide-react';

interface SpinnerProps {
    size?: number;
    className?: string;
}

/** Inline loading indicator for buttons and small areas. For page-level loading use LoadingSpinner. */
export default function Spinner({ size = 16, className = '' }: SpinnerProps) {
    return <Loader2 size={size} className={`animate-spin shrink-0 ${className}`} aria-hidden="true" />;
}
