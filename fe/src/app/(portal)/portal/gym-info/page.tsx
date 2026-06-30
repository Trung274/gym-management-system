'use client';

import { useEffect, useState } from 'react';
import { getGymInfo } from '@/src/lib/gymInfoService';
import { AlertCircle, MapPin, Phone, Mail, Globe, Clock } from 'lucide-react';
import type { GymInfo } from '@/src/types/member-portal.types';
import { DAY_OF_WEEK_VI } from '@/src/types/member-portal.types';

export default function PortalGymInfoPage() {
  const [info,    setInfo]    = useState<GymInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    getGymInfo()
      .then(setInfo)
      .catch((e: any) => setError(e?.response?.data?.message || 'Không thể tải thông tin'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col gap-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-surface-overlay rounded-2xl animate-pulse" />)}
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-500 text-sm">
      <AlertCircle size={15} /> {error}
    </div>
  );

  if (!info) return null;

  const todayDOW = new Date().toLocaleDateString('en-US', { weekday: 'long' }); // "Monday"

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-text-primary">Thông tin phòng gym</h1>

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
          {info.established && <p className="text-xs text-text-muted mt-1">Thành lập năm {info.established}</p>}
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
        <h2 className="text-sm font-bold text-text-primary mb-4">Liên hệ</h2>
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
        {info.socialLinks && (
          <div className="flex gap-3 mt-4">
            {info.socialLinks.facebook  && <a href={info.socialLinks.facebook}  target="_blank" rel="noreferrer" className="text-xs text-primary-500 hover:underline">Facebook</a>}
            {info.socialLinks.instagram && <a href={info.socialLinks.instagram} target="_blank" rel="noreferrer" className="text-xs text-primary-500 hover:underline">Instagram</a>}
            {info.socialLinks.youtube   && <a href={info.socialLinks.youtube}   target="_blank" rel="noreferrer" className="text-xs text-primary-500 hover:underline">YouTube</a>}
            {info.socialLinks.tiktok    && <a href={info.socialLinks.tiktok}    target="_blank" rel="noreferrer" className="text-xs text-primary-500 hover:underline">TikTok</a>}
          </div>
        )}
      </div>

      {/* Opening hours */}
      {info.openingHours && info.openingHours.length > 0 && (
        <div className="bg-surface-base border border-surface-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={15} className="text-primary-500" />
            <h2 className="text-sm font-bold text-text-primary">Giờ mở cửa</h2>
          </div>
          <div className="flex flex-col gap-0.5">
            {info.openingHours.map((h) => {
              const isToday = h.dayOfWeek === todayDOW;
              return (
                <div key={h.dayOfWeek}
                  className={`flex justify-between py-2 text-sm border-b border-surface-border last:border-0 ${isToday ? 'font-bold text-primary-500' : 'text-text-secondary'}`}>
                  <span>{DAY_OF_WEEK_VI[h.dayOfWeek] ?? h.dayOfWeek}{isToday && ' (hôm nay)'}</span>
                  <span>{h.isClosed ? <span className="text-danger-500">Đóng cửa</span> : `${h.openTime} – ${h.closeTime}`}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
