'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useToast } from '@/lib/context/ToastContext';

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    const { data, error: apiError } = await api.post<{
      access_token: string;
      user: { id: string };
    }>('/api/auth/login', { email, password });

    setLoading(false);

    if (apiError) {
      setError(apiError);
      showToast(apiError, 'error');
      return;
    }

    if (data?.access_token) {
      localStorage.setItem('sb_token', data.access_token);
      showToast('Welcome back!', 'success');
      router.push('/dashboard');
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-[var(--color-primary)] items-center justify-center text-white font-bold text-xl mb-4">
          TM
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Welcome back
        </h1>
        <p className="text-[var(--color-muted)] mt-1">
          Sign in to your account
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleLogin}
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4"
      >
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[var(--color-muted)] mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder:text-[var(--color-border)] focus:border-[var(--color-primary)] transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[var(--color-muted)] mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder:text-[var(--color-border)] focus:border-[var(--color-primary)] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--color-muted)] mt-6">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="text-[var(--color-primary-hover)] hover:underline font-medium"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
