'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Building2, Save, RefreshCw, AlertCircle,
  MapPin, Phone, Mail, Globe, Clock, ImageIcon, Tag,
  ExternalLink,
} from 'lucide-react';
import { getGymInfo, updateGymInfo } from '@/src/lib/gymInfoService';
import PageHeader from '@/src/components/ui/PageHeader';
import { toast } from '@/src/utils/toast';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';

// ─── Form state shape ────────────────────────────────────────────────────────
interface GymInfoForm {
  name: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
  coverImageUrl: string;
  established: string;
  openingHours: string;
  facebook: string;
  instagram: string;
  youtube: string;
  tiktok: string;
}

const DEFAULT_FORM: GymInfoForm = {
  name: '', tagline: '', description: '',
  address: '', phone: '', email: '', website: '',
  logoUrl: '', coverImageUrl: '',
  established: '',
  openingHours: '',
  facebook: '', instagram: '', youtube: '', tiktok: '',
};

// ─── Helper components ────────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="bg-surface-base border border-surface-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-surface-border">
        <div className="p-1.5 rounded-lg bg-primary-500/10">
          <Icon size={15} className="text-primary-500" />
        </div>
        <h2 className="text-sm font-bold text-text-primary">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-text-secondary">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-text-muted">{hint}</p>}
    </div>
  );
}

const inp = `w-full px-3 py-2.5 rounded-xl border border-surface-border bg-surface-raised
  text-sm text-text-primary placeholder-text-muted outline-none
  focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all`;

const textareaClass = `w-full px-3 py-2.5 rounded-xl border border-surface-border bg-surface-raised
  text-sm text-text-primary placeholder-text-muted outline-none resize-none
  focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all`;

// ─── Main page ────────────────────────────────────────────────────────────────
export default function GymInfoPage() {
  const [form, setForm] = useState<GymInfoForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { t } = useLanguage();
  const tg = t('gym-info');
  usePageTitle('gym-info');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await getGymInfo();

      let fb = '', ig = '', yt = '', tt = '';
      if (info.socialLinks) {
        if (typeof info.socialLinks === 'object') {
          const s = info.socialLinks as Record<string, string>;
          fb = s.facebook || ''; ig = s.instagram || '';
          yt = s.youtube || '';  tt = s.tiktok || '';
        } else if (typeof info.socialLinks === 'string') {
          info.socialLinks.split(',').forEach((item: string) => {
            const idx = item.indexOf(':');
            if (idx === -1) return;
            const key  = item.substring(0, idx).trim().toLowerCase();
            const val  = item.substring(idx + 1).trim();
            if (key === 'facebook')  fb = val;
            if (key === 'instagram') ig = val;
            if (key === 'youtube')   yt = val;
            if (key === 'tiktok')    tt = val;
          });
        }
      }

      let oh = '';
      if (info.openingHours) {
        if (typeof info.openingHours === 'string') {
          oh = info.openingHours;
        } else if (Array.isArray(info.openingHours)) {
          oh = info.openingHours
            .map((h: any) => `${h.dayOfWeek}: ${h.isClosed ? 'Closed' : `${h.openTime} - ${h.closeTime}`}`)
            .join(', ');
        }
      }

      setForm({
        name:         info.name || '',
        tagline:      info.tagline || '',
        description:  info.description || '',
        address:      info.address || '',
        phone:        info.phone || '',
        email:        info.email || '',
        website:      info.website || '',
        logoUrl:      info.logoUrl || '',
        coverImageUrl: info.coverImageUrl || '',
        established:  info.established?.toString() || '',
        openingHours: oh,
        facebook: fb, instagram: ig, youtube: yt, tiktok: tt,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || tg('toast.loadError'));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const set = (key: keyof GymInfoForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error(tg('validation.nameRequired')); return; }
    setSaving(true);
    try {
      const socialParts: string[] = [];
      if (form.facebook)  socialParts.push(`Facebook: ${form.facebook}`);
      if (form.instagram) socialParts.push(`Instagram: ${form.instagram}`);
      if (form.youtube)   socialParts.push(`Youtube: ${form.youtube}`);
      if (form.tiktok)    socialParts.push(`TikTok: ${form.tiktok}`);

      await updateGymInfo({
        name:          form.name,
        tagline:       form.tagline  || undefined,
        description:   form.description || undefined,
        address:       form.address  || undefined,
        phone:         form.phone    || undefined,
        email:         form.email    || undefined,
        website:       form.website  || undefined,
        logoUrl:       form.logoUrl  || undefined,
        coverImageUrl: form.coverImageUrl || undefined,
        established:   form.established ? parseInt(form.established) : undefined,
        openingHours:  form.openingHours || undefined,
        socialLinks:   socialParts.length ? socialParts.join(', ') : undefined,
      });
      toast.success(tg('toast.saveSuccess'));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || tg('toast.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-48 rounded-2xl bg-surface-base border border-surface-border animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PageHeader
          title={tg('title')}
          subtitle={tg('subtitle')}
        />
        <div className="flex gap-2">
          <button onClick={loadData} disabled={loading}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-surface-border text-sm font-semibold text-text-secondary hover:bg-surface-overlay disabled:opacity-50 cursor-pointer transition-all">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {tg('actions.refresh')}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer transition-all shadow">
            {saving
              ? <RefreshCw size={14} className="animate-spin" />
              : <Save size={14} />
            }
            {saving ? tg('actions.saving') : tg('actions.save')}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-500 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ── Basic Info ── */}
        <div className="md:col-span-2">
          <SectionCard title={tg('basicInfo')} icon={Building2}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={tg('gymName')}>
                <input type="text" value={form.name} onChange={set('name')}
                  placeholder={tg('gymNamePlaceholder')} className={inp} />
              </Field>
              <Field label={tg('tagline')}>
                <input type="text" value={form.tagline} onChange={set('tagline')}
                  placeholder={tg('taglinePlaceholder')} className={inp} />
              </Field>
              <Field label={tg('established')}>
                <input type="number" value={form.established} onChange={set('established')}
                  placeholder={tg('establishedPlaceholder')} min="1900" max="2099" className={inp} />
              </Field>
              <Field label={tg('description')}>
                <textarea value={form.description} onChange={set('description')} rows={3}
                  placeholder={tg('descriptionPlaceholder')} className={textareaClass} />
              </Field>
            </div>
          </SectionCard>
        </div>

        {/* ── Contact ── */}
        <SectionCard title={tg('contact')} icon={Phone}>
          <div className="flex flex-col gap-4">
            <Field label={tg('address')}>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="text" value={form.address} onChange={set('address')}
                  placeholder={tg('addressPlaceholder')}
                  className={inp.replace('px-3', 'pl-8 pr-3')} />
              </div>
            </Field>
            <Field label={tg('phone')}>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="tel" value={form.phone} onChange={set('phone')}
                  placeholder={tg('phonePlaceholder')}
                  className={inp.replace('px-3', 'pl-8 pr-3')} />
              </div>
            </Field>
            <Field label={tg('email')}>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="email" value={form.email} onChange={set('email')}
                  placeholder={tg('emailPlaceholder')}
                  className={inp.replace('px-3', 'pl-8 pr-3')} />
              </div>
            </Field>
            <Field label={tg('website')}>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="url" value={form.website} onChange={set('website')}
                  placeholder={tg('websitePlaceholder')}
                  className={inp.replace('px-3', 'pl-8 pr-3')} />
              </div>
            </Field>
          </div>
        </SectionCard>

        {/* ── Social links ── */}
        <SectionCard title={tg('socialLinks')} icon={ExternalLink}>
          <div className="flex flex-col gap-4">
            <Field label={tg('facebook')}>
              <div className="relative">
                <ExternalLink size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="url" value={form.facebook} onChange={set('facebook')}
                  placeholder="https://facebook.com/..."
                  className={inp.replace('px-3', 'pl-8 pr-3')} />
              </div>
            </Field>
            <Field label={tg('instagram')}>
              <div className="relative">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="url" value={form.instagram} onChange={set('instagram')}
                  placeholder="https://instagram.com/..."
                  className={inp.replace('px-3', 'pl-8 pr-3')} />
              </div>
            </Field>
            <Field label={tg('youtube')}>
              <div className="relative">
                <ExternalLink size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="url" value={form.youtube} onChange={set('youtube')}
                  placeholder="https://youtube.com/..."
                  className={inp.replace('px-3', 'pl-8 pr-3')} />
              </div>
            </Field>
            <Field label={tg('tiktok')}>
              <div className="relative">
                <ExternalLink size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="url" value={form.tiktok} onChange={set('tiktok')}
                  placeholder="https://tiktok.com/..."
                  className={inp.replace('px-3', 'pl-8 pr-3')} />
              </div>
            </Field>
          </div>
        </SectionCard>

        {/* ── Images ── */}
        <SectionCard title={tg('images')} icon={ImageIcon}>
          <div className="flex flex-col gap-4">
            <Field label={tg('logoUrl')} hint={tg('logoHint')}>
              <input type="url" value={form.logoUrl} onChange={set('logoUrl')}
                placeholder="https://..." className={inp} />
              {form.logoUrl && (
                <img src={form.logoUrl} alt="Logo preview"
                  className="mt-1 w-16 h-16 rounded-xl object-cover border border-surface-border"
                  onError={e => (e.currentTarget.style.display = 'none')} />
              )}
            </Field>
            <Field label={tg('coverImageUrl')} hint={tg('coverHint')}>
              <input type="url" value={form.coverImageUrl} onChange={set('coverImageUrl')}
                placeholder="https://..." className={inp} />
              {form.coverImageUrl && (
                <img src={form.coverImageUrl} alt="Cover preview"
                  className="mt-1 w-full h-24 rounded-xl object-cover border border-surface-border"
                  onError={e => (e.currentTarget.style.display = 'none')} />
              )}
            </Field>
          </div>
        </SectionCard>

        {/* ── Opening Hours ── */}
        <SectionCard title={tg('openingHours')} icon={Clock}>
          <Field label={tg('openingHours')} hint={tg('openingHoursHint')}>
            <textarea
              value={form.openingHours} onChange={set('openingHours')} rows={5}
              placeholder={tg('openingHoursPlaceholder')}
              className={textareaClass}
            />
          </Field>
        </SectionCard>
      </div>

      {/* Bottom save */}
      <div className="flex justify-end pb-4">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer transition-all shadow-lg">
          {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? tg('actions.saving') : tg('actions.save')}
        </button>
      </div>
    </div>
  );
}
