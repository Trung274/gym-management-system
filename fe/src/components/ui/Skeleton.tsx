/** Loading placeholder block. Size and shape come from className (e.g. "h-28 rounded-xl"). */
export default function Skeleton({ className = '' }: { className?: string }) {
    const radius = /\brounded/.test(className) ? '' : 'rounded';
    return <div className={`bg-surface-overlay animate-pulse ${radius} ${className}`} />;
}

/** `count` identical placeholder blocks — for card grids and lists. */
export function SkeletonList({ count, className = '', itemClassName = '' }: { count: number; className?: string; itemClassName?: string }) {
    return (
        <div className={className}>
            {Array.from({ length: count }, (_, i) => <Skeleton key={i} className={itemClassName} />)}
        </div>
    );
}

/** Placeholder rows for a <tbody> while the first page loads. */
export function TableSkeleton({ rows, cols }: { rows: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }, (_, i) => (
                <tr key={i} className="border-b border-surface-border animate-pulse">
                    {Array.from({ length: cols }, (_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-surface-overlay rounded w-3/4" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}
