// ─── Display formatting ───────────────────────────────────────────────────────
// Format at render time with the active language — never store formatted strings
// in the frontend models (they would be stuck in one language).
// In components prefer the useFormat() hook, which binds the current language.

import type { Locale } from '@/src/i18n';

type DateInput = string | null | undefined;

const EMPTY = '—';

export const toLocale = (lang: Locale) => (lang === 'vi' ? 'vi-VN' : 'en-US');

/** 08/04/2026 (vi) · 04/08/2026 (en) */
export const formatDate = (value: DateInput, lang: Locale): string =>
  value ? new Date(value).toLocaleDateString(toLocale(lang), { day: '2-digit', month: '2-digit', year: 'numeric' }) : EMPTY;

/** 14:05 — 24h in both languages */
export const formatTime = (value: DateInput, lang: Locale): string =>
  value ? new Date(value).toLocaleTimeString(toLocale(lang), { hour: '2-digit', minute: '2-digit', hour12: false }) : EMPTY;

export const formatDateTime = (value: DateInput, lang: Locale): string =>
  value ? `${formatDate(value, lang)} ${formatTime(value, lang)}` : EMPTY;

/** Amounts are stored in VND; only the number formatting follows the language. */
export const formatCurrency = (value: number | null | undefined, lang: Locale): string =>
  value == null
    ? EMPTY
    : new Intl.NumberFormat(toLocale(lang), { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

/** Splits a plan duration into the largest whole unit: 365 → 1 year, 90 → 3 months, 45 → 45 days. */
export const durationParts = (days: number): { n: number; unit: 'day' | 'month' | 'year' } => {
  if (days >= 365 && days % 365 === 0) return { n: days / 365, unit: 'year' };
  if (days >= 30 && days % 30 === 0) return { n: days / 30, unit: 'month' };
  return { n: days, unit: 'day' };
};

/** "Nguyễn Văn An" → "NA"; single word → first letter */
export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};
