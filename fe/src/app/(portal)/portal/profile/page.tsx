'use client';

import { useEffect, useState } from 'react';
import { getMemberProfile, updateMemberProfile } from '@/src/lib/memberMeService';
import { toast } from '@/src/utils/toast';
import { User, Phone, Calendar, MapPin, AlertCircle, Pencil, X, Check } from 'lucide-react';
import type { MemberProfile, UpdateMemberProfilePayload } from '@/src/types/member-portal.types';
import { MEMBER_STATUS_COLORS } from '@/src/types/member-portal.types';
import PageHeader from '@/src/components/ui/PageHeader';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';

const fmtDate = (iso: string | undefined, locale: string) =>
  iso ? new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 border-b border-surface-border last:border-0">
      <span className="text-xs text-text-muted font-medium">{label}</span>
      <span className="text-sm text-text-primary font-medium">{value || '—'}</span>
    </div>
  );
}

export default function PortalProfilePage() {
  const { t, lang } = useLanguage();
  const tp = t('portal');
  const locale = lang === 'vi' ? 'vi-VN' : 'en-US';
  usePageTitle('portal', 'profile.title');

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form, setForm] = useState<UpdateMemberProfilePayload>({});

  const load = async () => {
    try {
      const p = await getMemberProfile();
      setProfile(p);
      setForm({ phone: p.phone ?? '', emergencyContact: p.emergencyContact ?? '', notes: p.notes ?? '' });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? '');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateMemberProfile(form);
      setProfile(updated);
      setEditing(false);
      toast.success(tp('profile.toast.updateSuccess'));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || tp('profile.toast.updateError'));
    } finally { setSaving(false); }
  };

  const inp = `w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-raised text-sm text-text-primary outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all`;

  if (loading) return (
    <div className="flex flex-col gap-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-surface-overlay rounded-2xl animate-pulse" />)}
    </div>
  );

  if (error !== null) return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-500 text-sm">
      <AlertCircle size={15} /> {error || tp('profile.toast.loadError')}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <PageHeader title={tp('profile.title')} subtitle={tp('profile.subtitle')} />
        {!editing
          ? <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-surface-border text-sm font-semibold text-text-secondary hover:bg-surface-overlay cursor-pointer transition-all">
              <Pencil size={13} /> {tp('profile.editButton')}
            </button>
          : <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="flex items-center gap-1 px-3 py-2 rounded-xl border border-surface-border text-sm font-semibold text-text-secondary hover:bg-surface-overlay cursor-pointer transition-all">
                <X size={13} /> {tp('profile.cancelButton')}
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer transition-all">
                {saving ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <Check size={13} />}
                {saving ? tp('profile.saving') : tp('profile.saveButton')}
              </button>
            </div>
        }
      </div>

      {/* Account info (read-only) */}
      <div className="bg-surface-base border border-surface-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <User size={15} className="text-primary-500" />
          <h2 className="text-sm font-bold text-text-primary">{tp('profile.accountInfo')}</h2>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-primary-500/20 flex items-center justify-center">
            <span className="text-xl font-bold text-primary-500">{profile?.user?.name?.[0]?.toUpperCase() ?? '?'}</span>
          </div>
          <div>
            <p className="font-bold text-text-primary">{profile?.user?.name}</p>
            <p className="text-sm text-text-muted">{profile?.user?.email}</p>
          </div>
          <span className={`ml-auto px-2.5 py-1 rounded-full text-xs font-semibold ${MEMBER_STATUS_COLORS[profile?.status ?? ''] ?? ''}`}>
            {profile?.status ? tp(`shared.memberStatus.${profile.status}`, profile.status) : ''}
          </span>
        </div>
        <InfoRow label={tp('profile.fields.dateOfBirth')} value={fmtDate(profile?.dateOfBirth, locale)} />
        <InfoRow label={tp('profile.fields.gender')}      value={profile?.gender ? tp(`shared.gender.${profile.gender}`, profile.gender) : undefined} />
        <InfoRow label={tp('profile.fields.address')}     value={profile?.address} />
        <InfoRow label={tp('profile.fields.memberId')}    value={profile?.memberId} />
      </div>

      {/* Editable fields */}
      <div className="bg-surface-base border border-surface-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Phone size={15} className="text-primary-500" />
          <h2 className="text-sm font-bold text-text-primary">{tp('profile.contactInfo')}</h2>
        </div>
        {editing ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">{tp('profile.fields.phone')}</label>
              <input type="tel" value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0912345678" className={inp} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">{tp('profile.fields.emergencyContact')}</label>
              <input type="text" value={form.emergencyContact ?? ''} onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))} placeholder={tp('profile.placeholders.emergencyContact')} className={inp} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">{tp('profile.fields.notes')}</label>
              <textarea rows={3} value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={tp('profile.placeholders.notes')} className={`${inp} resize-none`} />
            </div>
          </div>
        ) : (
          <>
            <InfoRow label={tp('profile.fields.phone')}            value={profile?.phone} />
            <InfoRow label={tp('profile.fields.emergencyContact')} value={profile?.emergencyContact} />
            <InfoRow label={tp('profile.fields.notes')}            value={profile?.notes} />
          </>
        )}
      </div>

      {/* Subscription */}
      <div className="bg-surface-base border border-surface-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={15} className="text-primary-500" />
          <h2 className="text-sm font-bold text-text-primary">{tp('profile.subscriptionInfo')}</h2>
        </div>
        {profile?.subscriptionPlan ? (
          <>
            <InfoRow label={tp('profile.fields.planName')}  value={profile.subscriptionPlan.name} />
            <InfoRow label={tp('profile.fields.planType')}  value={profile.subscriptionPlan.type?.toUpperCase()} />
            <InfoRow label={tp('profile.fields.startDate')} value={fmtDate(profile.subscriptionStart, locale)} />
            <InfoRow label={tp('profile.fields.endDate')}   value={fmtDate(profile.subscriptionEnd, locale)} />
          </>
        ) : (
          <p className="text-sm text-text-muted">{tp('profile.noSubscription')}</p>
        )}
      </div>
    </div>
  );
}
