'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import type { Locale } from '@/src/i18n';

const LANGUAGES: { code: Locale; label: string; flag: string; alt: string }[] = [
    { code: 'vi', label: 'Tiếng Việt', flag: 'vn', alt: 'Vietnamese flag' },
    { code: 'en', label: 'English',    flag: 'gb', alt: 'UK flag' },
];

/**
 * Language dropdown (vi / en). Used in the admin Header and the member portal navbar.
 * `compact` shrinks the trigger to fit smaller navbars.
 */
export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
    const { lang, setLang, t } = useLanguage();
    const tLayout = t('layout');
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`${compact ? 'p-1.5' : 'p-2'} flex items-center gap-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-all duration-200 cursor-pointer`}
                title={tLayout('header.language')}
                aria-label={tLayout('header.language')}
            >
                <Globe size={compact ? 15 : 20} />
                <span className="text-xs font-semibold uppercase hidden sm:block">{lang}</span>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-40 bg-surface-base border border-surface-border rounded-xl shadow-xl z-50 overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-surface-border">
                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                                {tLayout('header.language')}
                            </p>
                        </div>
                        <div className="py-1.5">
                            {LANGUAGES.map(({ code, label, flag, alt }) => (
                                <button
                                    key={code}
                                    onClick={() => { setLang(code); setIsOpen(false); }}
                                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors cursor-pointer hover:bg-surface-overlay ${lang === code ? 'text-primary-500 font-semibold' : 'text-text-primary font-medium'}`}
                                >
                                    <img src={`https://flagcdn.com/w20/${flag}.png`} srcSet={`https://flagcdn.com/w40/${flag}.png 2x`} width="20" alt={alt} className="rounded-sm shadow-sm" />
                                    <span>{label}</span>
                                    {lang === code && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
