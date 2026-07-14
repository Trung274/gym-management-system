'use client';

import { useEffect, useState } from 'react';
import { getMyCheckins } from '@/src/lib/checkinService';
import { ScanLine, AlertCircle } from 'lucide-react';
import type { CheckinLog } from '@/src/types/checkin.types';
import PageHeader from '@/src/components/ui/PageHeader';

export default function PortalCheckinsPage() {
  const [logs,    setLogs]    = useState<CheckinLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    getMyCheckins()
      .then(setLogs)
      .catch((e: any) => setError(e?.response?.data?.message || 'Không thể tải lịch sử'))
      .finally(() => setLoading(false));
  }, []);

  const thisMonth = logs.filter(l => {
    const d = new Date(l.checkinAt);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Lịch sử Check-in" subtitle="Toàn bộ lần ra vào của bạn" />

      {/* Stat */}
      <div className="bg-surface-base border border-surface-border rounded-2xl px-5 py-4 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary-500/10">
          <ScanLine size={18} className="text-primary-500" />
        </div>
        <div>
          <p className="text-xs text-text-muted">Lần check-in tháng này</p>
          <p className="text-2xl font-bold text-text-primary">{loading ? '—' : thisMonth}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-500 text-sm">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-surface-base border border-surface-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-border bg-surface-raised">
              {['Ngày', 'Giờ', 'Ghi chú'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-surface-border animate-pulse">
                  {[...Array(3)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-overlay rounded w-3/4" /></td>)}
                </tr>
              ))
              : logs.length === 0
              ? <tr><td colSpan={3} className="px-4 py-12 text-center text-sm text-text-muted">Chưa có lần check-in nào.</td></tr>
              : logs.map(l => (
                <tr key={l.id} className="border-b border-surface-border last:border-0 hover:bg-surface-raised transition-colors">
                  <td className="px-4 py-3 text-sm text-text-primary">{l.checkinDateOnly}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-text-primary">{l.checkinTimeOnly}</td>
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
