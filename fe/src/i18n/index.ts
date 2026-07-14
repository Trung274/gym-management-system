/**
 * i18n utility — lightweight translation helper
 *
 * Usage:
 *   const { t, lang } = useTranslation('common');
 *   t('actions.save')  → "Lưu" (vi) / "Save" (en)
 *
 * Supports dot-notation keys: 'actions.save', 'status.active', ...
 */

// ─── Type helpers ─────────────────────────────────────────────────────────────

export type Locale = 'vi' | 'en';

/** Flatten nested JSON keys to dot-notation strings for type-safety (optional) */
export type Messages = Record<string, unknown>;

// ─── Message registry (lazy-imported on demand) ───────────────────────────────
//
// We import synchronously since these are small JSON files bundled at build time.
// For large projects, replace with dynamic import + Suspense.

const messageCache: Partial<Record<Locale, Record<string, Messages>>> = {};

async function loadMessages(locale: Locale, namespace: string): Promise<Messages> {
  if (!messageCache[locale]) {
    messageCache[locale] = {};
  }
  if (messageCache[locale]![namespace]) {
    return messageCache[locale]![namespace];
  }
  try {
    const mod = await import(`@/src/messages/${locale}/${namespace}.json`);
    messageCache[locale]![namespace] = mod.default ?? mod;
    return messageCache[locale]![namespace];
  } catch {
    console.warn(`[i18n] Missing namespace "${namespace}" for locale "${locale}"`);
    return {};
  }
}

// Pre-load synchronously from the bundled modules so the first render works
// without suspense. We keep the async loader above for future lazy-loading.
const syncMessages: Partial<Record<Locale, Record<string, Messages>>> = {};

export function registerMessages(locale: Locale, namespace: string, messages: Messages) {
  if (!syncMessages[locale]) syncMessages[locale] = {};
  syncMessages[locale]![namespace] = messages;
}

// ─── Core translation function ────────────────────────────────────────────────

/**
 * Resolve a dot-notation key inside a messages object.
 * e.g. get({ actions: { save: 'Lưu' } }, 'actions.save') → 'Lưu'
 */
function resolvePath(obj: Messages, path: string): string {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return path;
    current = (current as Record<string, unknown>)[part];
  }
  if (typeof current === 'string') return current;
  return path; // fallback: return the key itself
}

/**
 * Create a typed translator for a given locale + namespace.
 */
export function createTranslator(locale: Locale, namespace: string) {
  const messages = syncMessages[locale]?.[namespace] ?? {};
  return (key: string, fallback?: string): string => {
    const result = resolvePath(messages as Messages, key);
    // If not found (returned the key itself) try the other locale as fallback
    if (result === key && fallback) return fallback;
    return result;
  };
}
