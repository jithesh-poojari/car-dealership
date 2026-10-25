'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from './Navbar';
import Spinner from './Spinner';

const FullPageSpinner = () => (
  <div className="flex min-h-screen items-center justify-center"><Spinner /></div>
);

/** App shell for signed-in pages: redirects to /login when there is no session. */
export function ProtectedShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) return <FullPageSpinner />;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

/** Wraps admin-only pages: non-admins are sent back to the dashboard. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (user && !isAdmin) router.replace('/');
  }, [user, isAdmin, router]);

  return isAdmin ? <>{children}</> : null;
}

/** Login/register pages: signed-in users are sent to the dashboard. */
export function GuestGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [loading, user, router]);

  return loading || user ? <FullPageSpinner /> : <>{children}</>;
}
