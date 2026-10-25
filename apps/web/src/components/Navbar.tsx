'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Logo from './Logo';

function NavItem({ href, children }: { href: string; children: React.ReactNode }) {
  const active = usePathname() === href;
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active ? 'bg-brand/20 text-brand' : 'text-muted hover:bg-surface-3 hover:text-text'
      }`}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-surface-2/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="DriveHub home"><Logo /></Link>

        <div className="flex items-center gap-1">
          <NavItem href="/">Inventory</NavItem>
          {user?.role === 'ADMIN' && <NavItem href="/vehicles/new">+ Add Vehicle</NavItem>}
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-[160px] truncate text-sm font-medium">{user.email}</p>
              <p className="text-xs text-muted">{user.role}</p>
            </div>
            <button onClick={handleLogout} className="rounded-lg px-3 py-1.5 text-sm text-muted transition hover:bg-danger/10 hover:text-danger">
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
