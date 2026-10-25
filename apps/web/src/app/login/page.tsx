'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-2xl font-bold text-white mb-2">
            <span className="text-3xl">🚗</span>
            <span>DriveHub</span>
          </div>
          <p className="text-muted text-sm">Sign in to your account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface-2 border border-border rounded-2xl p-8 shadow-2xl space-y-5"
        >
          <div className="space-y-1">
            <label className="block text-sm font-medium text-muted" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-surface-3 border border-border rounded-xl px-4 py-3 text-text placeholder:text-muted/50 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-muted" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface-3 border border-border rounded-xl px-4 py-3 text-text placeholder:text-muted/50 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition"
            />
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            id="login-btn"
            className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <p className="text-center text-sm text-muted">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-brand hover:text-brand-dark font-medium">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
