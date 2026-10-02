'use client';

import { useEffect, useState } from 'react';
import { getMemberProfile, updateMemberProfile } from '@/src/lib/memberMeService';
import { toast } from '@/src/utils/toast';
import { User, Phone, Calendar, Pencil, X, Check } from 'lucide-react';
import type { MemberProfile, UpdateMemberProfilePayload } from '@/src/types/member-portal.types';
import PageHeader from '@/src/components/ui/PageHeader';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';
import { getApiMessage } from '@/src/lib/errors';
import Spinner from '@/src/components/ui/Spinner';
import Alert from '@/src/components/ui/Alert';
import FormField, { inputClass } from '@/src/components/ui/FormField';
import Badge from '@/src/components/ui/Badge';
import { MEMBER_STATUS_TONE } from '@/src/lib/statusTones';
import { SkeletonList } from '@/src/components/ui/Skeleton';
import { useFormat } from '@/src/hooks/useFormat';

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 border-b border-surface-border last:border-0">
      <span className="text-xs text-text-muted font-medium">{label}</span>
      <span className="text-sm text-text-primary font-medium">{value || '—'}</span>
    </div>
  );
}

export default function PortalProfilePage() {
  const { t } = useLanguage();
  const tp = t('portal');
  const fmt = useFormat();
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
    } catch (e) {
      setError(getApiMessage(e) ?? '');
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
    } catch (e) {
      toast.error(getApiMessage(e) || tp('profile.toast.updateError'));
    } finally { setSaving(false); }
  };

  const inp = inputClass();

  if (loading) return (
    <SkeletonList count={4} className="flex flex-col gap-4" itemClassName="h-24 rounded-2xl" />
  );

  if (error !== null) return <Alert>{error || tp('profile.toast.loadError')}</Alert>;

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
                {saving ? <Spinner /> : <Check size={13} />}
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
          {profile?.status && (
            <Badge tone={MEMBER_STATUS_TONE[profile.status]} className="ml-auto">
              {tp(`shared.memberStatus.${profile.status}`, profile.status)}
            </Badge>
          )}
        </div>
        <InfoRow label={tp('profile.fields.dateOfBirth')} value={fmt.date(profile?.dateOfBirth)} />
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
            <FormField label={tp('profile.fields.phone')}>
              <input type="tel" value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0912345678" className={inp} />
            </FormField>
            <FormField label={tp('profile.fields.emergencyContact')}>
              <input type="text" value={form.emergencyContact ?? ''} onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))} placeholder={tp('profile.placeholders.emergencyContact')} className={inp} />
            </FormField>
            <FormField label={tp('profile.fields.notes')}>
              <textarea rows={3} value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={tp('profile.placeholders.notes')} className={`${inp} resize-none`} />
            </FormField>
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
            <InfoRow label={tp('profile.fields.startDate')} value={fmt.date(profile.subscriptionStart)} />
            <InfoRow label={tp('profile.fields.endDate')}   value={fmt.date(profile.subscriptionEnd)} />
          </>
        ) : (
          <p className="text-sm text-text-muted">{tp('profile.noSubscription')}</p>
        )}
      </div>
    </div>
  );
}
