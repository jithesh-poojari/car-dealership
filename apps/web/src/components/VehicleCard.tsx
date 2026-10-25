'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { vehicles, type Vehicle } from '@/lib/api';

interface Props {
  vehicle: Vehicle;
  /** Called after any change so the parent can refetch. */
  onChanged: () => void;
}

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const CATEGORY_STYLES: Record<string, string> = {
  sedan: 'bg-blue-500/20 text-blue-300',
  suv: 'bg-green-500/20 text-green-300',
  truck: 'bg-orange-500/20 text-orange-300',
  sports: 'bg-red-500/20 text-red-300',
  van: 'bg-purple-500/20 text-purple-300',
  electric: 'bg-emerald-500/20 text-emerald-300',
};

const messageOf = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

export default function VehicleCard({ vehicle, onChanged }: Props) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const outOfStock = vehicle.quantity === 0;
  const lowStock = vehicle.quantity > 0 && vehicle.quantity <= 2;

  const [busy, setBusy] = useState<'buy' | 'restock' | 'delete' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [restockQty, setRestockQty] = useState('5');

  /** Runs an API action with shared busy/error handling. */
  async function run(kind: NonNullable<typeof busy>, action: () => Promise<unknown>, success?: string) {
    setError('');
    setNotice('');
    setBusy(kind);
    try {
      await action();
      if (success) {
        setNotice(success);
        setTimeout(() => setNotice(''), 2500);
      }
      onChanged();
    } catch (err) {
      setError(messageOf(err, 'Something went wrong'));
    } finally {
      setBusy(null);
    }
  }

  const handleDelete = () => {
    if (window.confirm(`Delete ${vehicle.make} ${vehicle.model}?`)) {
      void run('delete', () => vehicles.remove(vehicle.id));
    }
  };

  const restockAmount = Number.parseInt(restockQty, 10);
  const restockValid = Number.isInteger(restockAmount) && restockAmount > 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-2 transition hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5">
      <div className={`h-1 w-full ${outOfStock ? 'bg-muted/30' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} />

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold leading-tight">{vehicle.make} {vehicle.model}</h3>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${CATEGORY_STYLES[vehicle.category.toLowerCase()] ?? 'bg-muted/20 text-muted'}`}>
            {vehicle.category}
          </span>
        </div>

        <p className="text-2xl font-bold text-white">{money.format(vehicle.price)}</p>

        <p className={`flex items-center gap-2 text-sm ${outOfStock ? 'text-danger' : lowStock ? 'text-warning' : 'text-muted'}`}>
          <span className={`h-2 w-2 rounded-full ${outOfStock ? 'bg-danger' : lowStock ? 'bg-warning' : 'bg-success'}`} />
          {outOfStock ? 'Out of stock' : `${vehicle.quantity} in stock`}
        </p>

        {error && <p role="alert" className="alert-error !text-xs">{error}</p>}
        {notice && <p role="status" className="rounded-lg bg-success/10 px-3 py-1.5 text-xs text-success">{notice}</p>}
      </div>

      <div className="space-y-3 px-5 pb-5">
        <button
          onClick={() => run('buy', () => vehicles.purchase(vehicle.id), 'Purchased!')}
          disabled={outOfStock || busy !== null}
          className="btn-primary w-full"
        >
          {busy === 'buy' ? 'Processing…' : outOfStock ? 'Unavailable' : 'Purchase'}
        </button>

        {isAdmin && (
          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                aria-label={`Restock amount for ${vehicle.make} ${vehicle.model}`}
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                className="input !w-20 !px-3"
              />
              <button
                onClick={() => run('restock', () => vehicles.restock(vehicle.id, restockAmount), 'Restocked')}
                disabled={!restockValid || busy !== null}
                className="btn-ghost flex-1"
              >
                {busy === 'restock' ? 'Restocking…' : '+ Restock'}
              </button>
            </div>
            <div className="flex gap-2">
              <Link href={`/vehicles/${vehicle.id}/edit`} className="btn-ghost flex-1 text-center">Edit</Link>
              <button onClick={handleDelete} disabled={busy !== null} className="btn-ghost flex-1 !text-danger/80 hover:!bg-danger/10 hover:!text-danger">
                {busy === 'delete' ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
