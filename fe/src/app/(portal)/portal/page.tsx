'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/src/hooks/useAuth';
import { getMemberProfile } from '@/src/lib/memberMeService';
import { getMyCheckins } from '@/src/lib/checkinService';
import { getMyBookings } from '@/src/lib/bookingService';
import type { MemberProfile } from '@/src/types/member-portal.types';
import type { CheckinLog } from '@/src/types/checkin.types';
import type { Booking } from '@/src/types/booking.types';
import { CalendarDays, ScanLine, Dumbbell, ChevronRight, Clock } from 'lucide-react';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';
import Alert from '@/src/components/ui/Alert';
import { getApiMessage } from '@/src/lib/errors';
import { SkeletonList } from '@/src/components/ui/Skeleton';
import { useFormat } from '@/src/hooks/useFormat';

const daysLeft = (endDate?: string) => {
  if (!endDate) return null;
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  return diff;
};

export default function PortalHomePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const tp = t('portal');
  const fmt = useFormat();
  usePageTitle('portal', 'layout.nav.home');
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
      } catch (e) {
        setError(getApiMessage(e) ?? '');
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
        <p className="text-sm opacity-80 mb-1">{tp('home.welcome')}</p>
        <h1 className="text-2xl font-bold">{user?.name ?? '...'}</h1>
        {profile && (
          <div className="mt-3 flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20`}>
              {tp(`shared.memberStatus.${profile.status}`, profile.status)}
            </span>
            {profile.subscriptionPlan && (
              <span className="text-xs opacity-80">{tp('home.subscription.plan')} {profile.subscriptionPlan.name}</span>
            )}
          </div>
        )}
      </div>

      {error !== null && <Alert>{error || tp('home.loadError')}</Alert>}

      {/* Subscription card */}
      {!loading && (
        <div className="bg-surface-base border border-surface-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Dumbbell size={16} className="text-primary-500" />
              <h2 className="text-sm font-bold text-text-primary">{tp('home.subscription.title')}</h2>
            </div>
            <Link href="/portal/profile" className="text-xs text-primary-500 flex items-center gap-0.5 hover:underline">
              {tp('home.subscription.details')} <ChevronRight size={12} />
            </Link>
          </div>
          {profile?.subscriptionPlan ? (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{tp('home.subscription.planName')}</span>
                <span className="font-semibold text-text-primary">{profile.subscriptionPlan.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{tp('home.subscription.expiryDate')}</span>
                <span className="font-semibold text-text-primary">{fmt.date(profile.subscriptionEnd)}</span>
              </div>
              {days !== null && (
                <div className={`text-center text-xs font-semibold mt-1 py-1.5 rounded-lg ${days <= 7 ? 'bg-danger-500/10 text-danger-500' : days <= 30 ? 'bg-warning-500/10 text-warning-500' : 'bg-success-500/10 text-success-500'}`}>
                  {days > 0 ? tp('home.subscription.daysLeft').replace('{{days}}', String(days)) : tp('home.subscription.expired')}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-muted">{tp('home.subscription.noPlan')}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Recent check-ins */}
        <div className="bg-surface-base border border-surface-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ScanLine size={16} className="text-primary-500" />
              <h2 className="text-sm font-bold text-text-primary">{tp('home.recentCheckins.title')}</h2>
            </div>
            <Link href="/portal/checkins" className="text-xs text-primary-500 flex items-center gap-0.5 hover:underline">
              {tp('home.recentCheckins.viewAll')} <ChevronRight size={12} />
            </Link>
          </div>
          {loading ? (
            <SkeletonList count={3} className="flex flex-col gap-2" itemClassName="h-8 rounded" />
          ) : checkins.length === 0 ? (
            <p className="text-sm text-text-muted">{tp('home.recentCheckins.empty')}</p>
          ) : (
            <div className="flex flex-col gap-1">
              {checkins.map(c => (
                <div key={c.id} className="flex justify-between py-1.5 border-b border-surface-border last:border-0">
                  <span className="text-sm text-text-primary">{fmt.date(c.checkinAt)}</span>
                  <span className="text-sm font-semibold text-text-primary">{fmt.time(c.checkinAt)}</span>
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
              <h2 className="text-sm font-bold text-text-primary">{tp('home.upcomingBookings.title')}</h2>
            </div>
            <Link href="/portal/bookings" className="text-xs text-primary-500 flex items-center gap-0.5 hover:underline">
              {tp('home.upcomingBookings.viewAll')} <ChevronRight size={12} />
            </Link>
          </div>
          {loading ? (
            <SkeletonList count={2} className="flex flex-col gap-2" itemClassName="h-10 rounded" />
          ) : bookings.length === 0 ? (
            <p className="text-sm text-text-muted">{tp('home.upcomingBookings.empty')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {bookings.map(b => (
                <div key={b.id} className="flex flex-col gap-0.5 py-1.5 border-b border-surface-border last:border-0">
                  <span className="text-sm font-semibold text-text-primary">{b.trainerName}</span>
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Clock size={10} /> {fmt.date(b.sessionDate)} · {b.startTime}–{b.endTime}
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
