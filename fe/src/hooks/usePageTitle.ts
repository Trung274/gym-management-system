'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/src/components/providers/LanguageProvider';

const APP_NAME = 'GymMS';

/**
 * Sets document.title dynamically based on the current language.
 * 
 * @param namespace - The i18n namespace for this page (e.g. 'plans', 'trainers')
 * @param titleKey - The key inside that namespace for the page title (default: 'title')
 * 
 * @example
 * // In PlansPage:
 * usePageTitle('plans'); // → "Plans | GymMS" or "Gói Tập | GymMS"
 */
export function usePageTitle(namespace: string, titleKey = 'title') {
  const { t } = useLanguage();

  useEffect(() => {
    try {
      const te = t(namespace);
      const pageTitle = te(titleKey);
      document.title = `${pageTitle} | ${APP_NAME}`;
    } catch {
      // namespace or key not found — leave title as-is
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, namespace, titleKey]);
}
