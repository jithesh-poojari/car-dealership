import { ProtectedShell } from '@/components/RouteGuards';

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedShell>{children}</ProtectedShell>;
}
