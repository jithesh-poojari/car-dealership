import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VehicleCard from './VehicleCard';
import type { Vehicle } from '@/lib/api';

const purchase = vi.fn();
const restock = vi.fn();
let role: 'USER' | 'ADMIN' = 'USER';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'a@b.com', role } }),
}));
vi.mock('@/lib/api', () => ({
  vehicles: { purchase: (...a: unknown[]) => purchase(...a), restock: (...a: unknown[]) => restock(...a), remove: vi.fn() },
}));

const base: Vehicle = { id: 'v1', make: 'Toyota', model: 'Camry', category: 'Sedan', price: 25000, quantity: 3, createdAt: '2026-01-01' };
const renderCard = (v: Partial<Vehicle> = {}, onChanged = vi.fn()) =>
  render(<VehicleCard vehicle={{ ...base, ...v }} onChanged={onChanged} />);

beforeEach(() => {
  vi.clearAllMocks();
  role = 'USER';
});

describe('VehicleCard', () => {
  it('disables Purchase when quantity is zero', () => {
    renderCard({ quantity: 0 });
    expect(screen.getByRole('button', { name: 'Unavailable' })).toBeDisabled();
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });

  it('enables Purchase and refreshes after a successful purchase', async () => {
    purchase.mockResolvedValue({});
    const onChanged = vi.fn();
    renderCard({}, onChanged);

    await userEvent.click(screen.getByRole('button', { name: 'Purchase' }));

    expect(purchase).toHaveBeenCalledWith('v1');
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it('shows the API error when the purchase fails', async () => {
    purchase.mockRejectedValue(new Error('Out of stock'));
    renderCard();
    await userEvent.click(screen.getByRole('button', { name: 'Purchase' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Out of stock');
  });

  it('hides admin controls from regular users', () => {
    renderCard();
    expect(screen.queryByRole('button', { name: /restock/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('lets admins restock', async () => {
    role = 'ADMIN';
    restock.mockResolvedValue({});
    renderCard();
    await userEvent.click(screen.getByRole('button', { name: '+ Restock' }));
    expect(restock).toHaveBeenCalledWith('v1', 5);
  });
});
