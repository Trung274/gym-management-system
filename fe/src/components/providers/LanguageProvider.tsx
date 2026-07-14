'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from 'react';
import { type Locale, registerMessages, createTranslator } from '@/src/i18n';

// ─── Pre-import all message namespaces ────────────────────────────────────────
// Sync imports so translations are available on first render without Suspense.

import viCommon       from '@/src/messages/vi/common.json';
import enCommon       from '@/src/messages/en/common.json';
import viLayout       from '@/src/messages/vi/layout.json';
import enLayout       from '@/src/messages/en/layout.json';
import viDashboard    from '@/src/messages/vi/dashboard.json';
import enDashboard    from '@/src/messages/en/dashboard.json';
import viMembers      from '@/src/messages/vi/members.json';
import enMembers      from '@/src/messages/en/members.json';
import viCheckins     from '@/src/messages/vi/checkins.json';
import enCheckins     from '@/src/messages/en/checkins.json';
import viBookings     from '@/src/messages/vi/bookings.json';
import enBookings     from '@/src/messages/en/bookings.json';
import viPlans        from '@/src/messages/vi/plans.json';
import enPlans        from '@/src/messages/en/plans.json';
import viTrainers     from '@/src/messages/vi/trainers.json';
import enTrainers     from '@/src/messages/en/trainers.json';
import viStaff        from '@/src/messages/vi/staff.json';
import enStaff        from '@/src/messages/en/staff.json';
import viEquipment    from '@/src/messages/vi/equipment.json';
import enEquipment    from '@/src/messages/en/equipment.json';
import viGroupClasses from '@/src/messages/vi/group-classes.json';
import enGroupClasses from '@/src/messages/en/group-classes.json';
import viGymInfo      from '@/src/messages/vi/gym-info.json';
import enGymInfo      from '@/src/messages/en/gym-info.json';
import viPortal       from '@/src/messages/vi/portal.json';
import enPortal       from '@/src/messages/en/portal.json';

// Register them into the sync cache
registerMessages('vi', 'common',        viCommon);
registerMessages('en', 'common',        enCommon);
registerMessages('vi', 'layout',        viLayout);
registerMessages('en', 'layout',        enLayout);
registerMessages('vi', 'dashboard',     viDashboard);
registerMessages('en', 'dashboard',     enDashboard);
registerMessages('vi', 'members',       viMembers);
registerMessages('en', 'members',       enMembers);
registerMessages('vi', 'checkins',      viCheckins);
registerMessages('en', 'checkins',      enCheckins);
registerMessages('vi', 'bookings',      viBookings);
registerMessages('en', 'bookings',      enBookings);
registerMessages('vi', 'plans',         viPlans);
registerMessages('en', 'plans',         enPlans);
registerMessages('vi', 'trainers',      viTrainers);
registerMessages('en', 'trainers',      enTrainers);
registerMessages('vi', 'staff',         viStaff);
registerMessages('en', 'staff',         enStaff);
registerMessages('vi', 'equipment',     viEquipment);
registerMessages('en', 'equipment',     enEquipment);
registerMessages('vi', 'group-classes', viGroupClasses);
registerMessages('en', 'group-classes', enGroupClasses);
registerMessages('vi', 'gym-info',      viGymInfo);
registerMessages('en', 'gym-info',      enGymInfo);
registerMessages('vi', 'portal',        viPortal);
registerMessages('en', 'portal',        enPortal);

// ─── Context ──────────────────────────────────────────────────────────────────

interface LanguageContextValue {
  /** Current active locale */
  lang: Locale;
  /** Switch to a new locale (persisted in localStorage) */
  setLang: (locale: Locale) => void;
  /**
   * Get a translator for a namespace.
   * @example const t = useLanguage().t('common'); t('actions.save')
   */
  t: (namespace: string) => (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'vi',
  setLang: () => {},
  t: (ns) => (key) => key,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Locale>('vi');

  // Restore from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('lang') as Locale | null;
    if (stored === 'vi' || stored === 'en') {
      setLangState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  const setLang = (locale: Locale) => {
    setLangState(locale);
    localStorage.setItem('lang', locale);
    document.documentElement.lang = locale;
  };

  // Memoize so `t` reference doesn't change on unrelated re-renders
  const t = useMemo(
    () => (namespace: string) => createTranslator(lang, namespace),
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook to access the language context.
 *
 * @example
 * const { lang, setLang, t } = useLanguage();
 * const tCommon = t('common');
 * tCommon('actions.save') // → 'Lưu' or 'Save'
 */
export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
