'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/src/hooks/useAuth';
import { getMemberProfile } from '@/src/lib/memberMeService';
import { getMyCheckins } from '@/src/lib/checkinService';
import { getMyBookings } from '@/src/lib/bookingService';
import {
  MEMBER_STATUS_COLORS as STATUS_COLORS,
  MEMBER_STATUS_LABELS as STATUS_LABELS,
} from '@/src/types/member-portal.types';
import type { MemberProfile } from '@/src/types/member-portal.types';
import type { CheckinLog } from '@/src/types/checkin.types';
import type { Booking } from '@/src/types/booking.types';
import { CalendarDays, ScanLine, Dumbbell, AlertCircle, ChevronRight, Clock } from 'lucide-react';

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const fmtDatetime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : '—';

const daysLeft = (endDate?: string) => {
  if (!endDate) return null;
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  return diff;
};

export default function PortalHomePage() {
  const { user } = useAuth();
  const [profile,  setProfile]  = useState<MemberProfile | null>(null);
  const [checkins, setCheckins] = useState<CheckinLog[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, c, b] = await Promise.all([
          getMemberProfile(),
          getMyCheckins(),
          getMyBookings(),
        ]);
        setProfile(p);
        setCheckins(c.slice(0, 5));
        setBookings(b.filter(bk => bk.status === 'pending' || bk.status === 'confirmed').slice(0, 3));
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const days = daysLeft(profile?.subscriptionEnd);

  return (
    <div className="flex flex-col gap-5">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 text-white shadow-lg">
        <p className="text-sm opacity-80 mb-1">Chào mừng trở lại 👋</p>
        <h1 className="text-2xl font-bold">{user?.name ?? '...'}</h1>
        {profile && (
          <div className="mt-3 flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20`}>
              {STATUS_LABELS[profile.status] ?? profile.status}
            </span>
            {profile.subscriptionPlan && (
              <span className="text-xs opacity-80">Gói: {profile.subscriptionPlan.name}</span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-500 text-sm">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Subscription card */}
      {!loading && (
        <div className="bg-surface-base border border-surface-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Dumbbell size={16} className="text-primary-500" />
              <h2 className="text-sm font-bold text-text-primary">Gói tập</h2>
            </div>
            <Link href="/portal/profile" className="text-xs text-primary-500 flex items-center gap-0.5 hover:underline">
              Chi tiết <ChevronRight size={12} />
            </Link>
          </div>
          {profile?.subscriptionPlan ? (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Tên gói</span>
                <span className="font-semibold text-text-primary">{profile.subscriptionPlan.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Hết hạn</span>
                <span className="font-semibold text-text-primary">{fmtDate(profile.subscriptionEnd)}</span>
              </div>
              {days !== null && (
                <div className={`text-center text-xs font-semibold mt-1 py-1.5 rounded-lg ${days <= 7 ? 'bg-danger-500/10 text-danger-500' : days <= 30 ? 'bg-warning-500/10 text-warning-500' : 'bg-success-500/10 text-success-500'}`}>
                  {days > 0 ? `Còn ${days} ngày` : 'Đã hết hạn'}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-muted">Bạn chưa có gói tập nào. Liên hệ lễ tân để đăng ký.</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Recent check-ins */}
        <div className="bg-surface-base border border-surface-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ScanLine size={16} className="text-primary-500" />
              <h2 className="text-sm font-bold text-text-primary">Check-in gần đây</h2>
            </div>
            <Link href="/portal/checkins" className="text-xs text-primary-500 flex items-center gap-0.5 hover:underline">
              Tất cả <ChevronRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="flex flex-col gap-2">{[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-surface-overlay rounded animate-pulse" />)}</div>
          ) : checkins.length === 0 ? (
            <p className="text-sm text-text-muted">Chưa có lần check-in nào.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {checkins.map(c => (
                <div key={c.id} className="flex justify-between py-1.5 border-b border-surface-border last:border-0">
                  <span className="text-sm text-text-primary">{c.checkinDateOnly}</span>
                  <span className="text-sm font-semibold text-text-primary">{c.checkinTimeOnly}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming bookings */}
        <div className="bg-surface-base border border-surface-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-primary-500" />
              <h2 className="text-sm font-bold text-text-primary">Lịch PT sắp tới</h2>
            </div>
            <Link href="/portal/bookings" className="text-xs text-primary-500 flex items-center gap-0.5 hover:underline">
              Tất cả <ChevronRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="flex flex-col gap-2">{[...Array(2)].map((_, i) => <div key={i} className="h-10 bg-surface-overlay rounded animate-pulse" />)}</div>
          ) : bookings.length === 0 ? (
            <p className="text-sm text-text-muted">Không có lịch PT sắp tới.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {bookings.map(b => (
                <div key={b.id} className="flex flex-col gap-0.5 py-1.5 border-b border-surface-border last:border-0">
                  <span className="text-sm font-semibold text-text-primary">{b.trainerName}</span>
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Clock size={10} /> {fmtDatetime(b.sessionDate)} · {b.startTime}–{b.endTime}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
