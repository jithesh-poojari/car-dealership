import type { ReactNode } from 'react';
import Logo from './Logo';

/** Shared centered card with ambient glow for the login and register pages. */
export default function AuthLayout({ subtitle, children }: { subtitle: string; children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo size="lg" />
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
