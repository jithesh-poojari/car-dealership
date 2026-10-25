'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Spinner from '@/components/Spinner';
import VehicleForm from '@/components/VehicleForm';
import { vehicles, type Vehicle } from '@/lib/api';

export default function EditVehiclePage() {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    vehicles.get(id).then(({ vehicle }) => setVehicle(vehicle)).catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <p role="alert" className="alert-error">{error}</p>
        <Link href="/" className="text-brand hover:text-brand-dark">Back to inventory</Link>
      </div>
    );
  }
  if (!vehicle) return <div className="flex justify-center py-20"><Spinner /></div>;
  return <VehicleForm initial={vehicle} />;
}
