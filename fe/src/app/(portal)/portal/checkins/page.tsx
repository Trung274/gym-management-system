'use client';

import { useEffect, useState } from 'react';
import { getMyCheckins } from '@/src/lib/checkinService';
import { ScanLine } from 'lucide-react';
import type { CheckinLog } from '@/src/types/checkin.types';
import PageHeader from '@/src/components/ui/PageHeader';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';
import Alert from '@/src/components/ui/Alert';
import { getApiMessage } from '@/src/lib/errors';
import { TableSkeleton } from '@/src/components/ui/Skeleton';
import EmptyState from '@/src/components/ui/EmptyState';

export default function PortalCheckinsPage() {
  const { t, lang } = useLanguage();
  const tp = t('portal');
  const locale = lang === 'vi' ? 'vi-VN' : 'en-US';
  usePageTitle('portal', 'checkins.title');

  const [logs,    setLogs]    = useState<CheckinLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    getMyCheckins()
      .then(setLogs)
      .catch((e) => setError(getApiMessage(e) ?? ''))
      .finally(() => setLoading(false));
  }, []);

  const thisMonth = logs.filter(l => {
    const d = new Date(l.checkinAt);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={tp('checkins.title')} subtitle={tp('checkins.subtitle')} />

      {/* Stat */}
      <div className="bg-surface-base border border-surface-border rounded-2xl px-5 py-4 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary-500/10">
          <ScanLine size={18} className="text-primary-500" />
        </div>
        <div>
          <p className="text-xs text-text-muted">{tp('checkins.thisMonth')}</p>
          <p className="text-2xl font-bold text-text-primary">{loading ? '—' : thisMonth}</p>
        </div>
      </div>

      {error !== null && <Alert>{error || tp('checkins.loadError')}</Alert>}

      {/* Table */}
      <div className="bg-surface-base border border-surface-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-border bg-surface-raised">
              {[tp('checkins.table.date'), tp('checkins.table.time'), tp('checkins.table.note')].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <TableSkeleton rows={6} cols={3} />
              : logs.length === 0
              ? <tr><td colSpan={3}><EmptyState icon={<ScanLine size={40} />} title={tp('checkins.empty')} /></td></tr>
              : logs.map(l => (
                <tr key={l.id} className="border-b border-surface-border last:border-0 hover:bg-surface-raised transition-colors">
                  <td className="px-4 py-3 text-sm text-text-primary">
                    {new Date(l.checkinAt).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-text-primary">
                    {new Date(l.checkinAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{l.note ?? '—'}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
