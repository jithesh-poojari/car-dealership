'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { vehicles, type Vehicle } from '@/lib/api';

export const CATEGORIES = ['Sedan', 'SUV', 'Truck', 'Sports', 'Van', 'Electric', 'Hatchback', 'Convertible'];

export default function VehicleForm({ initial }: { initial?: Vehicle }) {
  const router = useRouter();
  const [make, setMake] = useState(initial?.make ?? '');
  const [model, setModel] = useState(initial?.model ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'Sedan');
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : '0');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Keep a legacy category selectable when editing.
  const categories = CATEGORIES.includes(category) ? CATEGORIES : [category, ...CATEGORIES];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const data = { make: make.trim(), model: model.trim(), category, price: Number(price), quantity: Number(quantity) };
    if (!(data.price > 0)) return setError('Price must be greater than 0');
    if (!Number.isInteger(data.quantity) || data.quantity < 0) return setError('Quantity must be a whole number, 0 or more');

    setSaving(true);
    try {
      if (initial) await vehicles.update(initial.id, data);
      else await vehicles.create(data);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vehicle');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-lg space-y-5 rounded-2xl border border-border bg-surface-2 p-8">
      <h1 className="text-xl font-bold">{initial ? 'Edit Vehicle' : 'Add New Vehicle'}</h1>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Make" htmlFor="make">
          <input id="make" required value={make} onChange={(e) => setMake(e.target.value)} placeholder="e.g. Toyota" className="input" />
        </Field>
        <Field label="Model" htmlFor="model">
          <input id="model" required value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. Camry" className="input" />
        </Field>
      </div>

      <Field label="Category" htmlFor="category">
        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="input">
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Price ($)" htmlFor="price">
          <input id="price" type="number" required min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="25000" className="input" />
        </Field>
        <Field label="Quantity" htmlFor="quantity">
          <input id="quantity" type="number" required min={0} step={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input" />
        </Field>
      </div>

      {error && <p role="alert" className="alert-error">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()} className="btn-ghost flex-1 !py-3">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary flex-1 !py-3">
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Vehicle'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-muted">{label}</label>
      {children}
    </div>
  );
}
