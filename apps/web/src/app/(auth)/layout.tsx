import { GuestGate } from '@/components/RouteGuards';

export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return <GuestGate>{children}</GuestGate>;
}
