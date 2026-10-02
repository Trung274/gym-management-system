'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/src/components/providers/ThemeProvider';
import { useLanguage } from '@/src/components/providers/LanguageProvider';

/**
 * Light / dark mode toggle. Used in the admin Header and the member portal navbar.
 * `compact` shrinks the button to fit smaller navbars.
 */
export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
    const { theme, toggleTheme } = useTheme();
    const { t } = useLanguage();
    const tLayout = t('layout');
    const label = theme === 'dark' ? tLayout('header.lightMode') : tLayout('header.darkMode');
    const size = compact ? 15 : 20;

    return (
        <button
            onClick={toggleTheme}
            className={`${compact ? 'p-1.5' : 'p-2'} rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-all duration-200 cursor-pointer`}
            aria-label={label}
            title={label}
        >
            {theme === 'dark' ? <Sun size={size} /> : <Moon size={size} />}
        </button>
    );
}
