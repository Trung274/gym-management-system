'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users, UserCheck, CalendarDays, ScanLine,
  Users2, Wrench, ClipboardList, RefreshCw,
  AlertCircle, TrendingUp, Clock,
} from 'lucide-react';
import { getDashboard } from '@/src/lib/dashboardService';
import type { DashboardSnapshot } from '@/src/types/dashboard.types';
import PageHeader from '@/src/components/ui/PageHeader';
import StatsGrid from '@/src/components/ui/StatsGrid';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent = false, loading = false }: {
  icon: React.ElementType; label: string; value: number | string;
  sub?: string; accent?: boolean; loading?: boolean;
}) {
  return (
    <div className={`bg-surface-base border rounded-xl px-5 py-4 flex flex-col gap-2 ${accent ? 'border-primary-500/40' : 'border-surface-border'}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{label}</p>
        <div className={`p-2 rounded-lg ${accent ? 'bg-primary-500/10' : 'bg-surface-overlay'}`}>
          <Icon size={16} className={accent ? 'text-primary-500' : 'text-text-muted'} />
        </div>
      </div>
      {loading
        ? <div className="h-8 w-20 bg-surface-overlay rounded animate-pulse" />
        : <p className="text-3xl font-bold text-text-primary">{value}</p>
      }
      {sub && !loading && <p className="text-xs text-text-muted">{sub}</p>}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={16} className="text-primary-500" />
      <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">{title}</h2>
    </div>
  );
}

// ─── Mini stat row ────────────────────────────────────────────────────────────
function MiniStat({ label, value, color = 'text-text-primary' }: {
  label: string; value: number | string; color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-surface-border last:border-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [snapshot,    setSnapshot]    = useState<DashboardSnapshot | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string>('');
  const [isLoading,   setIsLoading]   = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const { t, lang } = useLanguage();
  const td = t('dashboard');
  const tc = t('common');
  usePageTitle('dashboard');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { snapshot: snap, generatedAt: ts } = await getDashboard();
      setSnapshot(snap);
      setGeneratedAt(ts);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader
          title={td('title')}
          subtitle={generatedAt && !isLoading ? (
            <span className="flex items-center gap-1">
              <Clock size={11} /> {td('subtitle')} {fmtTime(generatedAt)}
            </span>
          ) : undefined}
        />
        <button onClick={load} disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-surface-border text-sm font-semibold text-text-secondary hover:bg-surface-overlay disabled:opacity-50 cursor-pointer transition-all">
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> {td('refresh')}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-500 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={load} className="underline text-xs cursor-pointer">{tc('actions.retry')}</button>
        </div>
      )}

      {/* ── Top KPI row ── */}
      <StatsGrid
        isLoading={isLoading}
        items={[
          { label: td('stats.totalMembers'),   value: snapshot?.members.total    ?? 0, color: 'primary', icon: <Users     className="w-16 h-16 text-primary-500" /> },
          { label: td('stats.activeTrainers'), value: snapshot?.trainers.active  ?? 0, color: 'success', icon: <UserCheck  className="w-16 h-16 text-success-500" /> },
          { label: td('stats.checkinsToday'),  value: snapshot?.checkins.today   ?? 0, color: 'warning', icon: <ScanLine   className="w-16 h-16 text-warning-500" /> },
          { label: td('stats.pendingBookings'),value: snapshot?.bookings.pending  ?? 0, color: 'danger',  icon: <CalendarDays className="w-16 h-16 text-danger-500" /> },
        ]}
      />

      {/* ── Middle row: Details ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Members detail */}
        <div className="bg-surface-base border border-surface-border rounded-2xl p-5">
          <SectionHeader icon={Users} title={td('sections.members')} />
          <MiniStat label={td('stats.membersActive')}       value={snapshot?.members.active       ?? 0} color="text-success-500" />
          <MiniStat label={td('stats.membersSuspended')}    value={snapshot?.members.suspended    ?? 0} color="text-danger-500"  />
          <MiniStat label={td('stats.membersNewThisMonth')} value={snapshot?.members.newThisMonth ?? 0} color="text-primary-500" />
          {isLoading && <div className="mt-2 h-20 bg-surface-overlay rounded animate-pulse" />}
        </div>

        {/* Bookings detail */}
        <div className="bg-surface-base border border-surface-border rounded-2xl p-5">
          <SectionHeader icon={CalendarDays} title={td('sections.bookings')} />
          <MiniStat label={td('stats.bookingsTotal')}              value={snapshot?.bookings.total              ?? 0} />
          <MiniStat label={td('stats.bookingsPending')}            value={snapshot?.bookings.pending            ?? 0} color="text-warning-500" />
          <MiniStat label={td('stats.bookingsConfirmed')}          value={snapshot?.bookings.confirmed          ?? 0} color="text-success-500" />
          <MiniStat label={td('stats.bookingsCompletedThisMonth')} value={snapshot?.bookings.completedThisMonth ?? 0} color="text-primary-500" />
          {isLoading && <div className="mt-2 h-20 bg-surface-overlay rounded animate-pulse" />}
        </div>

        {/* Equipment detail */}
        <div className="bg-surface-base border border-surface-border rounded-2xl p-5">
          <SectionHeader icon={Wrench} title={td('sections.equipment')} />
          <MiniStat label={td('stats.equipmentOperational')} value={snapshot?.equipment.operational ?? 0} color="text-success-500" />
          <MiniStat label={td('stats.equipmentMaintenance')} value={snapshot?.equipment.maintenance ?? 0} color="text-warning-500" />
          <MiniStat label={td('stats.equipmentOutOfOrder')}  value={snapshot?.equipment.outOfOrder  ?? 0} color="text-danger-500"  />
          <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
            <span>{td('stats.equipmentTotal')}</span>
            <span className="font-bold text-text-primary">{snapshot?.equipment.total ?? 0}</span>
          </div>
          {isLoading && <div className="mt-2 h-20 bg-surface-overlay rounded animate-pulse" />}
        </div>
      </div>

      {/* ── Bottom row: Classes schedule + Plans + Classes stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Today's class schedule */}
        <div className="md:col-span-2 bg-surface-base border border-surface-border rounded-2xl p-5">
          <SectionHeader icon={Users2} title={td('sections.classes')} />
          {isLoading
            ? <div className="h-32 bg-surface-overlay rounded animate-pulse" />
            : !snapshot?.classes.todaySchedule.length
              ? (
                <div className="flex flex-col items-center justify-center py-8 text-text-muted">
                  <Users2 size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">{td('noClassesToday')}</p>
                </div>
              )
              : (
                <div className="flex flex-col gap-2">
                  {snapshot.classes.todaySchedule.map((cls, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-raised border border-surface-border">
                      <div className="flex flex-col items-center w-14 shrink-0">
                        {cls.sessions.map((s, j) => (
                          <span key={j} className="text-xs font-bold text-primary-500">{s.startTime}</span>
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">{cls.name}</p>
                        <p className="text-xs text-text-muted truncate">{cls.location || '—'}</p>
                      </div>
                      <span className="text-xs text-text-muted shrink-0">
                        {cls.sessions[0]?.startTime} – {cls.sessions[0]?.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              )
          }
        </div>

        {/* Plans + Classes summary */}
        <div className="flex flex-col gap-4">
          <div className="bg-surface-base border border-surface-border rounded-2xl p-5 flex-1">
            <SectionHeader icon={ClipboardList} title={td('sections.plans')} />
            <MiniStat label={td('stats.plansActive')} value={snapshot?.plans.active ?? 0} color="text-success-500" />
            <MiniStat label={td('stats.plansTotal')}  value={snapshot?.plans.total  ?? 0} />
            {isLoading && <div className="mt-2 h-10 bg-surface-overlay rounded animate-pulse" />}
          </div>

          <div className="bg-surface-base border border-surface-border rounded-2xl p-5 flex-1">
            <SectionHeader icon={TrendingUp} title={td('sections.groupClasses')} />
            <MiniStat label={td('stats.classesActive')} value={snapshot?.classes.active ?? 0} color="text-success-500" />
            <MiniStat label={td('stats.classesTotal')}  value={snapshot?.classes.total  ?? 0} />
            {isLoading && <div className="mt-2 h-10 bg-surface-overlay rounded animate-pulse" />}
          </div>
        </div>
      </div>
    </div>
  );
}