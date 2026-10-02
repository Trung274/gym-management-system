'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@/src/utils/toast';
import { useAuth } from '@/src/hooks/useAuth';
import LoadingSpinner from '@/src/components/ui/LoadingSpinner';
import { getHomePath } from '@/src/types/member-portal.types';
import { Dumbbell } from 'lucide-react';
import Spinner from '@/src/components/ui/Spinner';
import Alert from '@/src/components/ui/Alert';
import LanguageSwitcher from '@/src/components/layout/LanguageSwitcher';
import ThemeToggle from '@/src/components/layout/ThemeToggle';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';

/** `?from=` set by middleware — only same-origin paths, never back to /login */
const safeReturnPath = (from: string | null): string | null =>
  from && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/login') ? from : null;

// Inner component that uses useSearchParams (must be wrapped in Suspense)
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, error, clearError, isLoading, isAuthenticated, checkAuth, user } = useAuth();
  const { t } = useLanguage();
  const ta = t('auth');
  usePageTitle('auth');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // The target area's layout redirects again if the path belongs to the other role
      router.push(safeReturnPath(searchParams.get('from')) ?? getHomePath(user.role?.name ?? ''));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  useEffect(() => {
    if (email || password) {
      clearError();
    }
  }, [email, password, clearError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password, rememberMe });
      toast.success(ta('success'));
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (isAuthenticated) {
    return <LoadingSpinner fullScreen message={ta('redirecting')} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-raised px-4">
      <div className="fixed top-4 right-4 flex items-center gap-1">
        <LanguageSwitcher compact />
        <ThemeToggle compact />
      </div>
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-surface-base border border-surface-border rounded-2xl shadow-lg p-8">
          {/* Logo / Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-500 mb-4 shadow-md">
              {/* Dumbbell icon */}
              <Dumbbell size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">{ta('brand')}</h1>
            <p className="text-sm text-text-muted mt-1">{ta('subtitle')}</p>
          </div>

          {/* Error message */}
          {error && <Alert className="mb-4">{error}</Alert>}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                {ta('email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-surface-border bg-surface-raised text-text-primary placeholder:text-text-muted text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                {ta('password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-surface-border bg-surface-raised text-text-primary placeholder:text-text-muted text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 rounded border-surface-border accent-primary-500 cursor-pointer"
              />
              <label
                htmlFor="rememberMe"
                className="text-sm text-text-secondary cursor-pointer select-none"
              >
                {ta('rememberMe')}
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-primary-500 hover:bg-primary-600 active:bg-primary-700
                         text-white font-semibold text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 shadow-sm"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner />
                  {ta('submitting')}
                </span>
              ) : (
                ta('submit')
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Default export wraps LoginForm in Suspense (required for useSearchParams in Next.js App Router)
export default function LoginPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<LoadingSpinner fullScreen message={t('auth')('loading')} />}>
      <LoginForm />
    </Suspense>
  );
}
