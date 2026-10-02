'use client';

import { useMemo } from 'react';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import {
  toLocale, formatDate, formatTime, formatDateTime, formatCurrency, durationParts,
} from '@/src/lib/format';

/**
 * Formatters bound to the active language.
 *
 * @example
 * const fmt = useFormat();
 * fmt.date(member.endDate)      // "08/04/2026"
 * fmt.currency(plan.price)      // "1.500.000 ₫" / "₫1,500,000"
 * fmt.duration(plan.durationDays) // "3 tháng" / "3 months"
 *
 * The returned object only changes when the language changes, so it is safe in hook deps.
 */
export function useFormat() {
  const { lang, t } = useLanguage();

  return useMemo(() => {
    const tc = t('common');
    return {
      locale: toLocale(lang),
      date: (value?: string | null) => formatDate(value, lang),
      time: (value?: string | null) => formatTime(value, lang),
      dateTime: (value?: string | null) => formatDateTime(value, lang),
      currency: (value?: number | null) => formatCurrency(value, lang),
      duration: (days: number) => {
        const { n, unit } = durationParts(days);
        return tc(`duration.${unit}${n === 1 ? '' : 's'}`).replace('{{n}}', String(n));
      },
    };
  }, [lang, t]);
}
