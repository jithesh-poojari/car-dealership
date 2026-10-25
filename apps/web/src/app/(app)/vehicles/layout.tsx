import { RequireAdmin } from '@/components/RouteGuards';

export default function VehiclesLayout({ children }: { children: React.ReactNode }) {
  return <RequireAdmin>{children}</RequireAdmin>;
}
