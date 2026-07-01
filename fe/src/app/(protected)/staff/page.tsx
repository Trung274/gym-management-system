'use client';

import { useEffect, useState, useCallback } from 'react';
import { useStaffStore } from '@/src/stores/staffStore';
import { toast } from '@/src/utils/toast';
import type {
  StaffMember,
  RoleName,
  CreateStaffPayload,
  UpdateStaffPayload,
} from '@/src/types/staff.types';

// ─── Constants ────────────────────────────────────────────────────────────────
const STAFF_ROLES: { value: RoleName; label: string }[] = [
  { value: 'admin',   label: 'Quản trị viên' },
  { value: 'manager', label: 'Quản lý' },
  { value: 'trainer', label: 'Huấn luyện viên' },
  { value: 'staff',   label: 'Nhân viên' },
];


const ROLE_STYLES: Record<RoleName, string> = {
  admin:   'bg-danger-500/15 text-danger-500',
  manager: 'bg-primary-500/15 text-primary-500',
  trainer: 'bg-violet-500/15 text-violet-500',
  staff:   'bg-sky-500/15 text-sky-500',
  user:    'bg-surface-overlay text-text-muted',
  member:  'bg-surface-overlay text-text-muted',
};


const AVATAR_COLORS = [
  'from-primary-400 to-primary-600',
  'from-violet-400 to-violet-600',
  'from-sky-400 to-sky-600',
  'from-emerald-400 to-emerald-600',
  'from-rose-400 to-rose-600',
];

const getAvatarColor = (id: string) =>
  AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length];

const EMPTY_CREATE_FORM = { name: '', email: '', password: '', roleName: 'staff' as RoleName };

const EMPTY_EDIT_FORM = { name: '', email: '' };

// ─── Staff Card ───────────────────────────────────────────────────────────────
function StaffCard({
  member,
  onEdit,
  onToggle,
  onAssignRole,
  actingId,
}: {
  member: StaffMember;
  onEdit: (m: StaffMember) => void;
  onToggle: (m: StaffMember) => void;
  onAssignRole: (m: StaffMember) => void;
  actingId: string | null;
}) {
  const isActing = actingId === member.id;

  return (
    <div className={`
      bg-surface-base border border-surface-border rounded-2xl p-5
      flex flex-col gap-4 transition-all duration-200 hover:shadow-md
      ${!member.isActive ? 'opacity-60' : ''}
    `}>
      {/* Header: avatar + name + status */}
      <div className="flex items-start gap-3">
        <div className={`
          w-11 h-11 rounded-xl bg-gradient-to-br ${getAvatarColor(member.id)}
          flex items-center justify-center text-white font-bold text-sm shrink-0
        `}>
          {member.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary text-sm truncate">{member.name}</p>
          <p className="text-xs text-text-muted truncate">{member.email}</p>
        </div>
        <span className={`
          shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full
          ${member.isActive ? 'bg-success-500/15 text-success-500' : 'bg-surface-overlay text-text-muted'}
        `}>
          {member.isActive ? 'Hoạt động' : 'Vô hiệu'}
        </span>
      </div>

      {/* Role badge */}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_STYLES[member.role.name] ?? 'bg-surface-overlay text-text-muted'}`}>
          {member.roleLabel}
        </span>
        <span className="text-xs text-text-muted ml-auto">
          {new Date(member.createdAt).toLocaleDateString('vi-VN')}
        </span>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-surface-border">
        <button
          onClick={() => onEdit(member)}
          className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium
            text-text-secondary hover:text-text-primary hover:bg-surface-overlay
            transition-all cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
          </svg>
          Sửa
        </button>

        <button
          onClick={() => onAssignRole(member)}
          className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium
            text-text-secondary hover:text-primary-500 hover:bg-primary-500/10
            transition-all cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
          </svg>
          Phân quyền
        </button>

        <button
          onClick={() => onToggle(member)}
          disabled={isActing}
          className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium
            transition-all cursor-pointer disabled:opacity-50
            ${member.isActive
              ? 'text-danger-500 hover:bg-danger-500/10'
              : 'text-success-500 hover:bg-success-500/10'
            }`}
        >
          {isActing ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d={member.isActive
                ? "M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
                : "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              }/>
            </svg>
          )}
          {member.isActive ? 'Vô hiệu' : 'Kích hoạt'}
        </button>
      </div>
    </div>
  );
}

// ─── Create Staff Modal ───────────────────────────────────────────────────────
function CreateStaffModal({
  open,
  onClose,
  onSave,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (payload: CreateStaffPayload) => Promise<void>;
  isLoading: boolean;
}) {
  const [form, setForm] = useState(EMPTY_CREATE_FORM);
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) { setForm(EMPTY_CREATE_FORM); setErrors({}); }
  }, [open]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Tên là bắt buộc';
    if (!form.email.trim()) e.email = 'Email là bắt buộc';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ';
    if (!form.password) e.password = 'Mật khẩu là bắt buộc';
    else if (form.password.length < 6) e.password = 'Mật khẩu phải ≥ 6 ký tự';
    if (!form.roleName) e.roleName = 'Vai trò là bắt buộc';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSave({ name: form.name.trim(), email: form.email.trim(), password: form.password, roleName: form.roleName });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-base rounded-2xl shadow-2xl border border-surface-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-base font-bold text-text-primary">Thêm nhân viên mới</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Họ tên <span className="text-danger-500">*</span></label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nguyễn Văn A"
              className={`w-full px-3 py-2.5 rounded-xl border text-sm text-text-primary bg-surface-raised placeholder-text-muted outline-none transition-all
                ${errors.name ? 'border-danger-500 focus:ring-2 focus:ring-danger-500/30' : 'border-surface-border focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'}`}
            />
            {errors.name && <p className="text-xs text-danger-500">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Email <span className="text-danger-500">*</span></label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="staff@gym.com"
              className={`w-full px-3 py-2.5 rounded-xl border text-sm text-text-primary bg-surface-raised placeholder-text-muted outline-none transition-all
                ${errors.email ? 'border-danger-500 focus:ring-2 focus:ring-danger-500/30' : 'border-surface-border focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'}`}
            />
            {errors.email && <p className="text-xs text-danger-500">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Mật khẩu <span className="text-danger-500">*</span></label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Tối thiểu 6 ký tự"
                className={`w-full px-3 pr-10 py-2.5 rounded-xl border text-sm text-text-primary bg-surface-raised placeholder-text-muted outline-none transition-all
                  ${errors.password ? 'border-danger-500 focus:ring-2 focus:ring-danger-500/30' : 'border-surface-border focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'}`}
              />
              <button type="button" onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d={showPwd
                    ? "M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                    : "M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  }/>
                </svg>
              </button>
            </div>
            {errors.password && <p className="text-xs text-danger-500">{errors.password}</p>}
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Vai trò <span className="text-danger-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {STAFF_ROLES.map((r) => (
                <button key={r.value} type="button" onClick={() => setForm((f) => ({ ...f, roleName: r.value }))}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer
                    ${form.roleName === r.value
                      ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                      : 'border-surface-border bg-surface-raised text-text-secondary hover:border-primary-500/50'}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-text-secondary border border-surface-border hover:bg-surface-overlay transition-all cursor-pointer">Huỷ</button>
            <button type="submit" disabled={isLoading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2">
              {isLoading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              Thêm nhân viên
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Staff Modal ─────────────────────────────────────────────────────────
function EditStaffModal({
  open,
  member,
  onClose,
  onSave,
  isLoading,
}: {
  open: boolean;
  member: StaffMember | null;
  onClose: () => void;
  onSave: (id: string, payload: UpdateStaffPayload) => Promise<void>;
  isLoading: boolean;
}) {
  const [form, setForm] = useState(EMPTY_EDIT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (member) { setForm({ name: member.name, email: member.email }); setErrors({}); }
  }, [member]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Tên là bắt buộc';
    if (!form.email.trim()) e.email = 'Email là bắt buộc';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !member) return;
    await onSave(member.id, { name: form.name.trim(), email: form.email.trim() });
  };

  if (!open || !member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-base rounded-2xl shadow-2xl border border-surface-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-base font-bold text-text-primary">Chỉnh sửa nhân viên</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Họ tên <span className="text-danger-500">*</span></label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm text-text-primary bg-surface-raised outline-none transition-all
                ${errors.name ? 'border-danger-500 focus:ring-2 focus:ring-danger-500/30' : 'border-surface-border focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'}`}
            />
            {errors.name && <p className="text-xs text-danger-500">{errors.name}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Email <span className="text-danger-500">*</span></label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm text-text-primary bg-surface-raised outline-none transition-all
                ${errors.email ? 'border-danger-500 focus:ring-2 focus:ring-danger-500/30' : 'border-surface-border focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'}`}
            />
            {errors.email && <p className="text-xs text-danger-500">{errors.email}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-text-secondary border border-surface-border hover:bg-surface-overlay transition-all cursor-pointer">Huỷ</button>
            <button type="submit" disabled={isLoading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2">
              {isLoading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Assign Role Modal ────────────────────────────────────────────────────────
function AssignRoleModal({
  open,
  member,
  onClose,
  onSave,
  isLoading,
}: {
  open: boolean;
  member: StaffMember | null;
  onClose: () => void;
  onSave: (id: string, roleName: RoleName) => Promise<void>;
  isLoading: boolean;
}) {
  const [selectedRole, setSelectedRole] = useState<RoleName>('user');

  useEffect(() => {
    if (member) setSelectedRole(member.role.name);
  }, [member]);

  if (!open || !member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface-base rounded-2xl shadow-2xl border border-surface-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-base font-bold text-text-primary">Phân quyền</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm text-text-secondary">Chọn vai trò cho <span className="font-semibold text-text-primary">{member.name}</span></p>
          <div className="flex flex-col gap-2">
            {STAFF_ROLES.map((r) => (
              <button key={r.value} type="button" onClick={() => setSelectedRole(r.value)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer
                  ${selectedRole === r.value
                    ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                    : 'border-surface-border text-text-secondary hover:border-primary-500/50 hover:bg-surface-overlay'}`}>
                {r.label}
                {selectedRole === r.value && (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-text-secondary border border-surface-border hover:bg-surface-overlay transition-all cursor-pointer">Huỷ</button>
            <button onClick={() => onSave(member.id, selectedRole)} disabled={isLoading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2">
              {isLoading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StaffPage() {
  const { staff, pagination, isLoading, error, fetchStaff, createStaff, updateStaff, assignRole, deactivateStaff, activateStaff, clearError } = useStaffStore();

  const [filterRole, setFilterRole] = useState<RoleName | 'all'>('all');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [assignMember, setAssignMember] = useState<StaffMember | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchStaff({}).catch(() => {}); }, [fetchStaff]);
  useEffect(() => () => clearError(), [clearError]);

  const filtered = staff.filter((m) => {
    const roleOk = filterRole === 'all' || m.role.name === filterRole;
    const statusOk = filterActive === 'all' || (filterActive === 'active' ? m.isActive : !m.isActive);
    const searchOk = !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase());
    return roleOk && statusOk && searchOk;
  });

  const stats = {
    total:   staff.length,
    active:  staff.filter((s) => s.isActive).length,
    admin:   staff.filter((s) => s.role.name === 'admin').length,
    manager: staff.filter((s) => s.role.name === 'manager').length,
    trainer: staff.filter((s) => s.role.name === 'trainer').length,
    staff:   staff.filter((s) => s.role.name === 'staff').length,
  };


  const handleCreate = useCallback(async (payload: CreateStaffPayload) => {
    setSaving(true);
    try {
      await createStaff(payload);
      toast.success('Thêm nhân viên thành công!');
      setCreateOpen(false);
    } catch { toast.error('Có lỗi xảy ra, vui lòng thử lại.'); }
    finally { setSaving(false); }
  }, [createStaff]);

  const handleEdit = useCallback(async (id: string, payload: UpdateStaffPayload) => {
    setSaving(true);
    try {
      await updateStaff(id, payload);
      toast.success('Cập nhật thành công!');
      setEditMember(null);
    } catch { toast.error('Có lỗi xảy ra, vui lòng thử lại.'); }
    finally { setSaving(false); }
  }, [updateStaff]);

  const handleAssignRole = useCallback(async (id: string, roleName: RoleName) => {
    setSaving(true);
    try {
      await assignRole(id, { roleName });
      toast.success('Phân quyền thành công!');
      setAssignMember(null);
    } catch { toast.error('Phân quyền thất bại, vui lòng thử lại.'); }
    finally { setSaving(false); }
  }, [assignRole]);

  const handleToggle = useCallback(async (member: StaffMember) => {
    setActingId(member.id);
    try {
      if (member.isActive) {
        await deactivateStaff(member.id);
        toast.success('Đã vô hiệu hoá tài khoản.');
      } else {
        await activateStaff(member.id);
        toast.success('Đã kích hoạt tài khoản!');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra.');
    } finally { setActingId(null); }
  }, [deactivateStaff, activateStaff]);

  return (
    <>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Nhân viên</h1>
            <p className="text-sm text-text-muted mt-0.5">Quản lý tài khoản và phân quyền nhân viên</p>
          </div>
          <button onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-sm font-semibold text-white shadow transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Thêm nhân viên
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-500 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
            <span className="flex-1">{error}</span>
            <button onClick={clearError} className="hover:opacity-70 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {[
            { label: 'Tổng nhân viên', value: stats.total,   color: 'text-text-primary' },
            { label: 'Đang hoạt động',  value: stats.active,  color: 'text-success-500' },
            { label: 'Quản trị viên',   value: stats.admin,   color: 'text-danger-500' },
            { label: 'Quản lý',          value: stats.manager, color: 'text-primary-500' },
            { label: 'Nhân viên',         value: stats.staff,   color: 'text-sky-500' },
            { label: 'HLV',               value: stats.trainer, color: 'text-violet-500' },
          ].map((s) => (

            <div key={s.label} className="bg-surface-base border border-surface-border rounded-xl px-4 py-3 flex flex-col gap-1">
              <p className="text-xs text-text-muted">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>
                {isLoading ? <span className="inline-block h-7 w-8 bg-surface-overlay rounded animate-pulse" /> : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên, email..."
              className="pl-9 pr-4 py-2 rounded-xl border border-surface-border bg-surface-raised text-sm text-text-primary placeholder-text-muted outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all w-52"
            />
          </div>

          {/* Role filter */}
          <div className="flex gap-1 p-1 bg-surface-raised rounded-xl border border-surface-border">
            {([
              { value: 'all',     label: 'Tất cả' },
              { value: 'admin',   label: 'Admin' },
              { value: 'manager', label: 'Quản lý' },
              { value: 'staff',   label: 'Nhân viên' },
              { value: 'trainer', label: 'HLV' },
            ] as { value: RoleName | 'all'; label: string }[]).map((f) => (

              <button key={f.value} onClick={() => setFilterRole(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer
                  ${filterRole === f.value ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'}`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex gap-1 p-1 bg-surface-raised rounded-xl border border-surface-border">
            {([{ value: 'all', label: 'Tất cả' }, { value: 'active', label: 'Hoạt động' }, { value: 'inactive', label: 'Vô hiệu' }] as { value: 'all' | 'active' | 'inactive'; label: string }[]).map((f) => (
              <button key={f.value} onClick={() => setFilterActive(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer
                  ${filterActive === f.value ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'}`}>
                {f.label}
              </button>
            ))}
          </div>

          <span className="ml-auto text-xs text-text-muted">{filtered.length} nhân viên</span>
        </div>

        {/* Skeleton loading */}
        {isLoading && staff.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-surface-base border border-surface-border rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-surface-overlay shrink-0" />
                  <div className="flex-1 flex flex-col gap-2"><div className="h-4 w-3/4 bg-surface-overlay rounded" /><div className="h-3 w-full bg-surface-overlay rounded" /></div>
                </div>
                <div className="h-6 w-24 bg-surface-overlay rounded-full" />
                <div className="h-10 w-full bg-surface-overlay rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <span className="text-5xl">🧑‍💼</span>
            <div>
              <p className="text-base font-semibold text-text-primary">Chưa có nhân viên nào</p>
              <p className="text-sm text-text-muted mt-1">{searchQuery || filterRole !== 'all' || filterActive !== 'all' ? 'Không có kết quả phù hợp với bộ lọc.' : 'Thêm nhân viên đầu tiên để bắt đầu.'}</p>
            </div>
          </div>
        )}

        {/* Staff grid */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((member) => (
              <StaffCard key={member.id} member={member}
                onEdit={setEditMember}
                onToggle={handleToggle}
                onAssignRole={setAssignMember}
                actingId={actingId}
              />
            ))}
          </div>
        )}

        {/* Pagination info */}
        {pagination && pagination.totalPages > 1 && (
          <p className="text-center text-xs text-text-muted">
            Trang {pagination.currentPage}/{pagination.totalPages} · {pagination.total} nhân viên
          </p>
        )}
      </div>

      <CreateStaffModal open={createOpen} onClose={() => setCreateOpen(false)} onSave={handleCreate} isLoading={saving} />
      <EditStaffModal open={!!editMember} member={editMember} onClose={() => setEditMember(null)} onSave={handleEdit} isLoading={saving} />
      <AssignRoleModal open={!!assignMember} member={assignMember} onClose={() => setAssignMember(null)} onSave={handleAssignRole} isLoading={saving} />
    </>
  );
}
