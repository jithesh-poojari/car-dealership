'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Spinner from '@/components/Spinner';
import VehicleCard from '@/components/VehicleCard';
import { vehicles, type SearchParams, type Vehicle } from '@/lib/api';

const CATEGORIES = ['All', 'Sedan', 'SUV', 'Truck', 'Sports', 'Van', 'Electric', 'Hatchback', 'Convertible'];

export default function DashboardPage() {
  const [list, setList] = useState<Vehicle[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const latestRequest = useRef(0);

  const priceRangeInvalid = minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice);

  const load = useCallback(async () => {
    if (priceRangeInvalid) return;
    const requestId = ++latestRequest.current;

    // Only send filters that have a value: the API rejects empty ones.
    const params: SearchParams = {};
    if (make.trim()) params.make = make.trim();
    if (model.trim()) params.model = model.trim();
    if (category !== 'All') params.category = category;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;

    try {
      const { vehicles: data } = Object.keys(params).length ? await vehicles.search(params) : await vehicles.list();
      if (requestId !== latestRequest.current) return; // a newer request superseded this one
      setList(data);
      setError('');
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load vehicles');
    } finally {
      if (requestId === latestRequest.current) setFetching(false);
    }
  }, [make, model, category, minPrice, maxPrice, priceRangeInvalid]);

  // Debounce so typing does not fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const hasFilters = Boolean(make || model || minPrice || maxPrice || category !== 'All');
  function clearFilters() {
    setMake(''); setModel(''); setMinPrice(''); setMaxPrice(''); setCategory('All');
  }

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Vehicle Inventory</h1>
        <p className="mt-1 text-muted">{list.length} vehicle{list.length !== 1 && 's'} {hasFilters ? 'match your filters' : 'in stock'}</p>
      </header>

      <section aria-label="Filters" className="mb-8 space-y-4 rounded-2xl border border-border bg-surface-2 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input aria-label="Make" value={make} onChange={(e) => setMake(e.target.value)} placeholder="Make…" className="input" />
          <input aria-label="Model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model…" className="input" />
          <input aria-label="Minimum price" type="number" min={0} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min price" className="input" />
          <input aria-label="Maximum price" type="number" min={0} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max price" className="input" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                category === c ? 'bg-brand text-white' : 'border border-border bg-surface-3 text-muted hover:text-text'
              }`}
            >
              {c}
            </button>
          ))}
          {hasFilters && (
            <button onClick={clearFilters} className="ml-auto text-sm text-muted underline-offset-2 hover:text-text hover:underline">
              Clear filters
            </button>
          )}
        </div>
        {priceRangeInvalid && <p className="text-sm text-warning">Min price is higher than max price.</p>}
      </section>

      {error ? (
        <div role="alert" className="alert-error flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => { setFetching(true); void load(); }} className="font-medium underline">Retry</button>
        </div>
      ) : fetching ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : list.length === 0 ? (
        <div className="py-20 text-center text-muted">
          <p className="text-lg font-medium">No vehicles found</p>
          <p className="mt-1 text-sm">{hasFilters ? 'Try adjusting your filters' : 'The inventory is empty'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((v) => <VehicleCard key={v.id} vehicle={v} onChanged={load} />)}
        </div>
      )}
    </>
  );
}
