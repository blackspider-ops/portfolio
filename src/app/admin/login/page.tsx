'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/admin/dashboard';
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (errorParam === 'unauthorized') {
      setError('You do not have permission to access the admin panel.');
    }
  }, [errorParam]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (!data.user) {
        setError('Login failed. Please try again.');
        return;
      }

      // Check if user has admin or editor role
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      if (roleError || !userRole) {
        await supabase.auth.signOut();
        setError('You do not have permission to access the admin panel.');
        return;
      }

      if (userRole.role !== 'admin' && userRole.role !== 'editor') {
        await supabase.auth.signOut();
        setError('You do not have permission to access the admin panel.');
        return;
      }

      router.push(redirectTo);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[var(--text)] mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--muted)]/30 rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)] focus:border-transparent"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-[var(--text)] mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--muted)]/30 rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)] focus:border-transparent"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 px-4 bg-[var(--blue)] text-[var(--bg)] font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}

function LoginFormFallback() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-[var(--bg)] rounded-lg"></div>
      <div className="h-10 bg-[var(--bg)] rounded-lg"></div>
      <div className="h-10 bg-[var(--bg)] rounded-lg"></div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--text)] mb-2">Admin Login</h1>
          <p className="text-[var(--muted)]">Sign in to manage your portfolio</p>
        </div>

        <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--muted)]/20">
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            ← Back to site
          </a>
        </div>
      </div>
    </div>
  );
}
