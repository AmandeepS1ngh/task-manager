'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useToast } from '@/lib/context/ToastContext';

export default function SignupPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    // Step 1: Sign up
    const { error: signupError } = await api.post('/api/auth/signup', {
      email,
      password,
      full_name: fullName,
    });

    if (signupError) {
      setLoading(false);
      setError(signupError);
      showToast(signupError, 'error');
      return;
    }

    // Step 2: Auto-login
    const { data: loginData, error: loginError } = await api.post<{
      access_token: string;
    }>('/api/auth/login', { email, password });

    setLoading(false);

    if (loginError) {
      setError(loginError);
      showToast('Account created but login failed. Please login manually.', 'error');
      router.push('/login');
      return;
    }

    if (loginData?.access_token) {
      localStorage.setItem('sb_token', loginData.access_token);
      showToast('Account created! Welcome aboard 🎉', 'success');
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
          Create your account
        </h1>
        <p className="text-[var(--color-muted)] mt-1">
          Start managing tasks with your team
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSignup}
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4"
      >
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-[var(--color-muted)] mb-1.5"
          >
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Alice Smith"
            className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder:text-[var(--color-border)] focus:border-[var(--color-primary)] transition-colors"
          />
        </div>

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
          <p className="text-xs text-[var(--color-muted)] mt-1">
            Minimum 6 characters
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--color-muted)] mt-6">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-[var(--color-primary-hover)] hover:underline font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
