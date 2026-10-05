'use client';

import React from 'react';
import { useLanguage } from '@/src/components/providers/LanguageProvider';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    /** Extra text after "Page x/y", e.g. "42 members" */
    summary?: React.ReactNode;
}

const buttonClass = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-text-secondary border border-surface-border hover:bg-surface-overlay disabled:opacity-40 transition-all cursor-pointer';

/** Previous / next footer for server-paginated tables. Renders nothing for a single page. */
export default function Pagination({ currentPage, totalPages, onPageChange, summary }: PaginationProps) {
    const { t } = useLanguage();
    const tCommon = t('common');

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border">
            <p className="text-xs text-text-muted">
                {tCommon('pagination.page')} {currentPage}{tCommon('pagination.of')}{totalPages}
                {summary && <> · {summary}</>}
            </p>
            <div className="flex gap-1">
                <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} className={buttonClass}>
                    {tCommon('pagination.previous')}
                </button>
                <button type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className={buttonClass}>
                    {tCommon('pagination.next')}
                </button>
            </div>
        </div>
    );
}
