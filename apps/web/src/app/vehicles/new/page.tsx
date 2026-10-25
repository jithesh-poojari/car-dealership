'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import VehicleForm from '@/components/VehicleForm';

export default function NewVehiclePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.replace('/');
    }
  }, [loading, user, router]);

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-start justify-center px-4 py-12">
        <VehicleForm />
      </main>
    </div>
  );
}
