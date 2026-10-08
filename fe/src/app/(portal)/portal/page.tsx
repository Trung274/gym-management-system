'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/src/hooks/useAuth';
import { getMemberProfile } from '@/src/lib/memberMeService';
import { getMyCheckins } from '@/src/lib/checkinService';
import { getMyBookings } from '@/src/lib/bookingService';
import { getClasses } from '@/src/lib/classService';
import { getGymInfo } from '@/src/lib/gymInfoService';
import { classImage, DEFAULT_HERO_IMAGE } from '@/src/lib/fitnessImages';
import type { MemberProfile, GymInfo } from '@/src/types/member-portal.types';
import type { CheckinLog } from '@/src/types/checkin.types';
import type { Booking } from '@/src/types/booking.types';
import type { GymClass } from '@/src/types/class.types';
import { CalendarDays, ScanLine, Dumbbell, ChevronRight, Clock, MapPin, UserRound, Users2 } from 'lucide-react';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';
import Alert from '@/src/components/ui/Alert';
import Photo from '@/src/components/ui/Photo';
import { getApiMessage } from '@/src/lib/errors';
import { SkeletonList } from '@/src/components/ui/Skeleton';
import { useFormat } from '@/src/hooks/useFormat';

const daysLeft = (endDate?: string) => {
  if (!endDate) return null;
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  return diff;
};

// ─── Upcoming class sessions ──────────────────────────────────────────────────
const UPCOMING_DAYS = 7;
const MAX_SESSIONS = 6;

interface ClassSession {
  key: string;
  cls: GymClass;
  date: Date;
  dayOffset: number;
  startTime: string;
  endTime: string;
  isLive: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Next sessions of active classes over the coming week, from their weekly schedule */
const getUpcomingSessions = (classes: GymClass[], now: Date): ClassSession[] => {
  const nowTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const sessions: ClassSession[] = [];

  for (let offset = 0; offset < UPCOMING_DAYS; offset++) {
    const date = new Date(now);
    date.setDate(now.getDate() + offset);
    const day = isoDate(date);

    for (const cls of classes) {
      if (cls.status !== 'active') continue;
      if (cls.startDate && day < cls.startDate.slice(0, 10)) continue;
      if (cls.endDate && day > cls.endDate.slice(0, 10)) continue;

      for (const item of cls.schedule) {
        if (item.dayOfWeek !== date.getDay()) continue;
        if (offset === 0 && item.endTime <= nowTime) continue; // already over today
        sessions.push({
          key: `${cls.id}-${offset}-${item.startTime}`,
          cls, date, dayOffset: offset,
          startTime: item.startTime, endTime: item.endTime,
          isLive: offset === 0 && item.startTime <= nowTime,
        });
      }
    }
  }

  return sessions
    .sort((a, b) => a.dayOffset - b.dayOffset || a.startTime.localeCompare(b.startTime))
    .slice(0, MAX_SESSIONS);
};

function ClassSessionCard({ session }: { session: ClassSession }) {
  const { t } = useLanguage();
  const tp = t('portal');
  const fmt = useFormat();
  const { cls, date, dayOffset, startTime, endTime, isLive } = session;
  const category = tp(`shared.categories.${cls.category}`);
  const dayLabel = dayOffset === 0
    ? tp('home.classes.today')
    : dayOffset === 1
    ? tp('home.classes.tomorrow')
    : `${tp(`shared.daysShort.${date.getDay()}`)} · ${date.toLocaleDateString(fmt.locale, { day: '2-digit', month: '2-digit' })}`;

  return (
    <Link href="/portal/classes"
      className="group flex flex-col rounded-2xl overflow-hidden bg-surface-base border border-surface-border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary-500/30">
      {/* Photo header — the gradient shows if the photo can't load */}
      <div className="relative h-28 overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600">
        <Photo src={classImage(cls.category)} alt={category}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/35 backdrop-blur-sm text-white text-[11px] font-semibold">
          {dayLabel}
        </span>
        {isLive && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger-500 text-white text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {tp('home.classes.live')}
          </span>
        )}
        <div className="absolute bottom-2 left-3 right-3 text-white">
          <p className="text-[10px] uppercase tracking-wider opacity-80">{category}</p>
          <p className="font-headline font-bold truncate">{cls.name}</p>
        </div>
      </div>
      {/* Details */}
      <div className="px-3 py-2.5 flex flex-col gap-1 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5 font-semibold text-text-primary">
          <Clock size={12} className="text-primary-500" /> {startTime} – {endTime}
        </span>
        {cls.trainerName !== '—' && (
          <span className="flex items-center gap-1.5 truncate"><UserRound size={12} className="shrink-0" /> {cls.trainerName}</span>
        )}
        {cls.location && (
          <span className="flex items-center gap-1.5 truncate"><MapPin size={12} className="shrink-0" /> {cls.location}</span>
        )}
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
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
  // Extras: if these fail the page still works (no photo / no schedule)
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [gymInfo, setGymInfo] = useState<GymInfo | null>(null);
  const [gymLoaded, setGymLoaded] = useState(false);

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
    getClasses({ all: false }).then(setClasses).catch(() => {}).finally(() => setClassesLoading(false));
    getGymInfo().then(setGymInfo).catch(() => {}).finally(() => setGymLoaded(true));
  }, []);

  const days = daysLeft(profile?.subscriptionEnd);
  const sessions = useMemo(() => getUpcomingSessions(classes, new Date()), [classes]);
  const heroImage = gymInfo?.coverImageUrl || DEFAULT_HERO_IMAGE;

  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl min-h-[11rem] sm:min-h-[13rem] bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg">
        {gymLoaded && <Photo src={heroImage} alt={gymInfo?.name ?? ''} className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10" />
        <div className="relative h-full min-h-[11rem] sm:min-h-[13rem] p-6 sm:p-8 flex flex-col justify-end gap-1.5 text-white">
          {gymInfo?.name && (
            <p className="text-[11px] uppercase tracking-[0.2em] opacity-75 flex items-center gap-1.5">
              <Dumbbell size={12} /> {gymInfo.name}
            </p>
          )}
          <p className="text-sm opacity-85">{tp('home.welcome')}</p>
          <h1 className="text-3xl sm:text-4xl font-headline font-black tracking-tight">{user?.name ?? '...'}</h1>
          {profile && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm">
                {tp(`shared.memberStatus.${profile.status}`, profile.status)}
              </span>
              {profile.subscriptionPlan && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-black/25 backdrop-blur-sm">
                  {tp('home.subscription.plan')} {profile.subscriptionPlan.name}
                </span>
              )}
            </div>
          )}
        </div>
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

      {/* Class schedule — next 7 days */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users2 size={16} className="text-primary-500" />
            <h2 className="text-sm font-bold text-text-primary">{tp('home.classes.title')}</h2>
          </div>
          <Link href="/portal/classes" className="text-xs text-primary-500 flex items-center gap-0.5 hover:underline">
            {tp('home.classes.viewAll')} <ChevronRight size={12} />
          </Link>
        </div>
        {classesLoading ? (
          <SkeletonList count={3} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3" itemClassName="h-44 rounded-2xl" />
        ) : sessions.length === 0 ? (
          <p className="text-sm text-text-muted bg-surface-base border border-surface-border rounded-2xl p-5">{tp('home.classes.empty')}</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sessions.map((session) => <ClassSessionCard key={session.key} session={session} />)}
          </div>
        )}
      </section>

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
