'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import VehicleCard from '@/components/VehicleCard';
import { vehicles, Vehicle } from '@/lib/api';

const CATEGORIES = ['All', 'Sedan', 'SUV', 'Truck', 'Sports', 'Van', 'Electric', 'Hatchback', 'Convertible'];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [list, setList] = useState<Vehicle[]>([]);
  const [fetching, setFetching] = useState(true);
  const [searchMake, setSearchMake] = useState('');
  const [searchModel, setSearchModel] = useState('');
  const [category, setCategory] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  const fetchVehicles = useCallback(async () => {
    setFetching(true);
    try {
      const params: Record<string, string> = {};
      if (searchMake) params.make = searchMake;
      if (searchModel) params.model = searchModel;
      if (category !== 'All') params.category = category;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const hasFilters = Object.keys(params).length > 0;
      const { vehicles: data } = hasFilters
        ? await vehicles.search(params)
        : await vehicles.list();
      setList(data);
    } finally {
      setFetching(false);
    }
  }, [searchMake, searchModel, category, minPrice, maxPrice]);

  // Debounced search on filter changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchVehicles, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fetchVehicles]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Vehicle Inventory
          </h1>
          <p className="text-muted mt-1">
            {list.length} vehicle{list.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* Filters */}
        <div className="bg-surface-2 border border-border rounded-2xl p-5 mb-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              id="filter-make"
              value={searchMake}
              onChange={(e) => setSearchMake(e.target.value)}
              placeholder="Search by make…"
              className="bg-surface-3 border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/60 focus:outline-none focus:border-brand transition"
            />
            <input
              id="filter-model"
              value={searchModel}
              onChange={(e) => setSearchModel(e.target.value)}
              placeholder="Search by model…"
              className="bg-surface-3 border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/60 focus:outline-none focus:border-brand transition"
            />
            <input
              id="filter-min-price"
              type="number"
              min={0}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min price"
              className="bg-surface-3 border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/60 focus:outline-none focus:border-brand transition"
            />
            <input
              id="filter-max-price"
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max price"
              className="bg-surface-3 border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/60 focus:outline-none focus:border-brand transition"
            />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                id={`cat-${cat.toLowerCase()}`}
                onClick={() => setCategory(cat)}
                className={`text-sm px-3 py-1.5 rounded-full font-medium transition ${
                  category === cat
                    ? 'bg-brand text-white'
                    : 'bg-surface-3 text-muted hover:text-text border border-border'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {fetching ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-20 text-muted">
            <p className="text-5xl mb-4">🚗</p>
            <p className="text-lg font-medium">No vehicles found</p>
            <p className="text-sm mt-1">Try adjusting your search filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {list.map((v) => (
              <VehicleCard key={v.id} vehicle={v} onUpdated={fetchVehicles} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
