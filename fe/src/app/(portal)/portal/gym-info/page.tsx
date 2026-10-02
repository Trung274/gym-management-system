'use client';

import { useEffect, useState } from 'react';
import { getGymInfo } from '@/src/lib/gymInfoService';
import { MapPin, Phone, Mail, Globe, Clock } from 'lucide-react';
import type { GymInfo, OpeningHour } from '@/src/types/member-portal.types';
import PageHeader from '@/src/components/ui/PageHeader';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';
import { getApiMessage } from '@/src/lib/errors';
import Alert from '@/src/components/ui/Alert';

export default function PortalGymInfoPage() {
  const { t } = useLanguage();
  const tp = t('portal');
  usePageTitle('portal', 'gymInfo.title');

  const [info,    setInfo]    = useState<GymInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    getGymInfo()
      .then(setInfo)
      .catch((e) => setError(getApiMessage(e) ?? ''))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col gap-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-surface-overlay rounded-2xl animate-pulse" />)}
    </div>
  );

  if (error !== null) return <Alert>{error || tp('gymInfo.loadError')}</Alert>;

  if (!info) return null;

  const todayDOW = new Date().toLocaleDateString('en-US', { weekday: 'long' }); // "Monday"

  // Parse social links dynamically (supports both string and object formats)
  let socialLinksList: { name: string; url: string }[] = [];
  if (info.socialLinks) {
    if (typeof info.socialLinks === 'string') {
      info.socialLinks.split(',').forEach((item: string) => {
        const index = item.indexOf(':');
        if (index !== -1) {
          const name = item.substring(0, index).trim();
          const url = item.substring(index + 1).trim();
          if (name && url) {
            socialLinksList.push({ name, url });
          }
        } else if (item.trim()) {
          socialLinksList.push({ name: 'Link', url: item.trim() });
        }
      });
    } else if (typeof info.socialLinks === 'object') {
      const obj = info.socialLinks as Record<string, string>;
      Object.entries(obj).forEach(([key, val]) => {
        if (val) {
          socialLinksList.push({ 
            name: key.charAt(0).toUpperCase() + key.slice(1), 
            url: val 
          });
        }
      });
    }
  }

  // Parse opening hours dynamically (supports both string and array formats)
  let openingHoursContent: React.ReactNode = null;
  if (info.openingHours) {
    if (typeof info.openingHours === 'string') {
      const hoursList = info.openingHours.split(',').map((item: string) => item.trim()).filter(Boolean);
      openingHoursContent = (
        <div className="flex flex-col gap-2">
          {hoursList.map((h: string, i: number) => (
            <div key={i} className="text-sm text-text-secondary py-2 border-b border-surface-border last:border-0">
              {h}
            </div>
          ))}
        </div>
      );
    } else if (Array.isArray(info.openingHours)) {
      openingHoursContent = (
        <div className="flex flex-col gap-0.5">
          {info.openingHours.map((h: OpeningHour) => {
            const isToday = h.dayOfWeek === todayDOW;
            return (
              <div key={h.dayOfWeek}
                className={`flex justify-between py-2 text-sm border-b border-surface-border last:border-0 ${isToday ? 'font-bold text-primary-500' : 'text-text-secondary'}`}>
                <span>{tp(`shared.daysLong.${h.dayOfWeek}`, h.dayOfWeek)}{isToday && ` ${tp('gymInfo.today')}`}</span>
                <span>{h.isClosed ? <span className="text-danger-500">{tp('gymInfo.closed')}</span> : `${h.openTime} – ${h.closeTime}`}</span>
              </div>
            );
          })}
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={tp('gymInfo.title')} subtitle={tp('gymInfo.subtitle')} />

      {/* Cover + brand */}
      {info.coverImageUrl && (
        <div className="w-full h-40 rounded-2xl overflow-hidden">
          <img src={info.coverImageUrl} alt={info.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="bg-surface-base border border-surface-border rounded-2xl p-5 flex items-center gap-4">
        {info.logoUrl
          ? <img src={info.logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover shrink-0" />
          : <div className="w-16 h-16 rounded-xl bg-primary-500/20 flex items-center justify-center text-2xl font-bold text-primary-500 shrink-0">{info.name?.[0] ?? 'G'}</div>
        }
        <div>
          <h2 className="text-lg font-bold text-text-primary">{info.name}</h2>
          {info.tagline && <p className="text-sm text-primary-500 italic">{info.tagline}</p>}
          {info.established && <p className="text-xs text-text-muted mt-1">{tp('gymInfo.established').replace('{{year}}', String(info.established))}</p>}
        </div>
      </div>

      {/* Description */}
      {info.description && (
        <div className="bg-surface-base border border-surface-border rounded-2xl p-5">
          <p className="text-sm text-text-secondary leading-relaxed">{info.description}</p>
        </div>
      )}

      {/* Contact */}
      <div className="bg-surface-base border border-surface-border rounded-2xl p-5">
        <h2 className="text-sm font-bold text-text-primary mb-4">{tp('gymInfo.contact')}</h2>
        <div className="flex flex-col gap-3">
          {info.address && (
            <a href={`https://maps.google.com/?q=${encodeURIComponent(info.address)}`} target="_blank" rel="noreferrer"
              className="flex items-start gap-3 text-sm text-text-secondary hover:text-primary-500 transition-all">
              <MapPin size={15} className="mt-0.5 shrink-0 text-primary-500" />
              <span>{info.address}</span>
            </a>
          )}
          {info.phone && (
            <a href={`tel:${info.phone}`} className="flex items-center gap-3 text-sm text-text-secondary hover:text-primary-500 transition-all">
              <Phone size={15} className="shrink-0 text-primary-500" /> {info.phone}
            </a>
          )}
          {info.email && (
            <a href={`mailto:${info.email}`} className="flex items-center gap-3 text-sm text-text-secondary hover:text-primary-500 transition-all">
              <Mail size={15} className="shrink-0 text-primary-500" /> {info.email}
            </a>
          )}
          {info.website && (
            <a href={info.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-text-secondary hover:text-primary-500 transition-all">
              <Globe size={15} className="shrink-0 text-primary-500" /> {info.website}
            </a>
          )}
        </div>
        {/* Social links */}
        {socialLinksList.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-4 border-t border-surface-border">
            {socialLinksList.map((link, idx) => (
              <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="text-xs text-primary-500 hover:underline">
                {link.name}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Opening hours */}
      {openingHoursContent && (
        <div className="bg-surface-base border border-surface-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={15} className="text-primary-500" />
            <h2 className="text-sm font-bold text-text-primary">{tp('gymInfo.openingHours')}</h2>
          </div>
          {openingHoursContent}
        </div>
      )}
    </div>
  );
}
