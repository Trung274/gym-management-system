'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, X, AlertCircle, ClipboardCheck } from 'lucide-react';
import { useCheckinStore } from '@/src/stores/checkinStore';
import { peakHourLabel } from '@/src/lib/checkinHelpers';
import { toast } from '@/src/utils/toast';

// ─── Record modal ─────────────────────────────────────────────────────────────
function RecordModal({ open, onClose, onSubmit, isLoading }: {
  open: boolean; onClose: () => void;
  onSubmit: (memberId: string, note?: string) => Promise<void>;
  isLoading: boolean;
}) {
  const [memberId, setMemberId] = useState('');
  const [note,     setNote]     = useState('');
  const [err,      setErr]      = useState('');

  useEffect(() => { if (!open) { setMemberId(''); setNote(''); setErr(''); } }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId.trim()) { setErr('Member ID là bắt buộc'); return; }
    setErr('');
    await onSubmit(memberId.trim(), note.trim() || undefined);
  };

  if (!open) return null;

  const inp = `w-full px-3 py-2.5 rounded-xl border border-surface-border bg-surface-raised
    text-sm text-text-primary placeholder-text-muted outline-none
    focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-base border border-surface-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="text-base font-bold text-text-primary">Ghi check-in</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay cursor-pointer transition-all">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Member ID <span className="text-danger-500">*</span></label>
            <input type="text" value={memberId} onChange={e => setMemberId(e.target.value)}
              placeholder="ObjectId của thành viên..." className={inp} autoFocus />
            {err && <p className="text-xs text-danger-500">{err}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Ghi chú (tùy chọn)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="VD: Khách vãng lai..." className={inp} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-text-secondary border border-surface-border hover:bg-surface-overlay cursor-pointer transition-all">
              Hủy
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 cursor-pointer transition-all flex items-center justify-center gap-2">
              {isLoading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              Ghi check-in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CheckinPage() {
  const { logs, stats, isLoading, error, fetchLogs, fetchStats, recordCheckin, clearError } = useCheckinStore();

  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');
  const [memberIdFilter, setMemberIdFilter] = useState('');
  const [modalOpen,   setModalOpen]   = useState(false);
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs, fetchStats]);

  useEffect(() => () => clearError(), [clearError]);

  const applyFilter = useCallback(() => {
    fetchLogs({
      memberId: memberIdFilter.trim() || undefined,
      dateFrom: dateFrom || undefined,
      dateTo:   dateTo   || undefined,
    });
  }, [fetchLogs, memberIdFilter, dateFrom, dateTo]);

  const clearFilter = () => {
    setMemberIdFilter(''); setDateFrom(''); setDateTo('');
    fetchLogs();
  };

  const handleRecord = useCallback(async (memberId: string, note?: string) => {
    setSaving(true);
    try {
      const log = await recordCheckin({ memberId, note });
      toast.success(`Check-in thành công: ${log.memberName}`);
      setModalOpen(false);
      fetchStats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Ghi check-in thất bại.');
    } finally {
      setSaving(false);
    }
  }, [recordCheckin, fetchStats]);

  return (
    <>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Check-in Log</h1>
            <p className="text-sm text-text-muted mt-0.5">Lịch sử ra vào của hội viên</p>
          </div>
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-sm font-semibold text-white shadow cursor-pointer transition-all">
            <Plus size={16} /> Ghi check-in
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-500 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={clearError} className="hover:opacity-70 cursor-pointer"><X size={14} /></button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Hôm nay',      value: stats?.todayCount  ?? '—' },
            { label: '7 ngày qua',   value: stats?.weekCount   ?? '—' },
            { label: '30 ngày qua',  value: stats?.monthCount  ?? '—' },
            { label: 'Giờ cao điểm', value: stats ? peakHourLabel(stats.peakHour) : '—', wide: true },
          ].map((s) => (
            <div key={s.label} className={`bg-surface-base border border-surface-border rounded-xl px-4 py-3 ${s.wide ? 'sm:col-span-1' : ''}`}>
              <p className="text-xs text-text-muted">{s.label}</p>
              <p className="text-2xl font-bold text-text-primary mt-1">
                {isLoading && !stats
                  ? <span className="inline-block h-7 w-10 bg-surface-overlay rounded animate-pulse" />
                  : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted font-medium">Member ID</label>
            <input type="text" value={memberIdFilter} onChange={e => setMemberIdFilter(e.target.value)}
              placeholder="Lọc theo Member ID..."
              className="px-3 py-2 rounded-xl border border-surface-border bg-surface-raised text-sm text-text-primary placeholder-text-muted outline-none focus:border-primary-500 transition-all w-52" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted font-medium">Từ ngày</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 rounded-xl border border-surface-border bg-surface-raised text-sm text-text-primary outline-none focus:border-primary-500 transition-all" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted font-medium">Đến ngày</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 rounded-xl border border-surface-border bg-surface-raised text-sm text-text-primary outline-none focus:border-primary-500 transition-all" />
          </div>
          <button onClick={applyFilter}
            className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-sm font-semibold text-white cursor-pointer transition-all">
            Lọc
          </button>
          <button onClick={clearFilter}
            className="px-4 py-2 rounded-xl border border-surface-border text-sm font-semibold text-text-secondary hover:bg-surface-overlay cursor-pointer transition-all">
            Xóa lọc
          </button>
          <span className="ml-auto text-xs text-text-muted self-end pb-1">{logs.length} bản ghi</span>
        </div>

        {/* Table */}
        <div className="bg-surface-base border border-surface-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border bg-surface-raised">
                  {['Thời gian', 'Hội viên', 'ID Hội viên', 'Ghi chú', 'Người ghi'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && !logs.length
                  ? [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b border-surface-border animate-pulse">
                      {[...Array(5)].map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-overlay rounded w-3/4" /></td>
                      ))}
                    </tr>
                  ))
                  : logs.length === 0
                  ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-16 text-center">
                        <ClipboardCheck size={40} className="mx-auto text-text-muted mb-3 opacity-40" />
                        <p className="text-sm font-semibold text-text-primary">Chưa có bản ghi check-in nào</p>
                        <p className="text-xs text-text-muted mt-1">Nhấn "Ghi check-in" để thêm bản ghi đầu tiên.</p>
                      </td>
                    </tr>
                  )
                  : logs.map((log) => (
                    <tr key={log.id} className="border-b border-surface-border hover:bg-surface-raised transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-sm font-semibold text-text-primary">{log.checkinTimeOnly}</p>
                        <p className="text-xs text-text-muted">{log.checkinDateOnly}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-text-primary">{log.memberName}</p>
                        <p className="text-xs text-text-muted">{log.member?.phone ?? ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs text-text-muted font-mono bg-surface-overlay px-1.5 py-0.5 rounded">
                          {log.member?._id?.slice(-8) ?? '—'}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary max-w-[200px] truncate">
                        {log.note ?? <span className="text-text-muted">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {log.recordedByName}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <RecordModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleRecord}
        isLoading={saving}
      />
    </>
  );
}
