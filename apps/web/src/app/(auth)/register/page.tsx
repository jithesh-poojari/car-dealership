'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirm) return setError('Passwords do not match');

    setLoading(true);
    try {
      await register(email, password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout subtitle="Create your account">
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-surface-2 p-8 shadow-2xl">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-muted">Email address</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input !py-3" />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-muted">Password</label>
          <input id="password" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ characters" className="input !py-3" />
        </div>
        <div className="space-y-1">
          <label htmlFor="confirm" className="text-sm font-medium text-muted">Confirm password</label>
          <input id="confirm" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" className="input !py-3" />
        </div>

        {error && <p role="alert" className="alert-error">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand hover:text-brand-dark">Sign In</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
