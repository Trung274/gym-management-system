'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@/src/utils/toast';
import { useAuth } from '@/src/hooks/useAuth';
import LoadingSpinner from '@/src/components/ui/LoadingSpinner';

// Inner component that uses useSearchParams (must be wrapped in Suspense)
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, error, clearError, isLoading, isAuthenticated, checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

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

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password, rememberMe });
      toast.success('Đăng nhập thành công!');
      setTimeout(() => {
        const from = searchParams.get('from') || '/dashboard';
        router.push(from);
      }, 500);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (isAuthenticated) {
    return <LoadingSpinner fullScreen message="Đang chuyển hướng..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-raised px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-surface-base border border-surface-border rounded-2xl shadow-lg p-8">
          {/* Logo / Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-500 mb-4 shadow-md">
              {/* Dumbbell icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
                <path d="M6.5 6.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v3.5H13V6.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V14h-3.5v3.5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-11Z" />
                <path d="M4 9.5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1v-5H4ZM19 9.5h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-5Z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Gym Management</h1>
            <p className="text-sm text-text-muted mt-1">Đăng nhập vào hệ thống</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-danger-500/10 border border-danger-500/20 text-danger-600 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Email
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
                Mật khẩu
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
                Ghi nhớ đăng nhập
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
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : (
                'Đăng nhập'
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
  return (
    <Suspense fallback={<LoadingSpinner fullScreen message="Đang tải..." />}>
      <LoginForm />
    </Suspense>
  );
}
