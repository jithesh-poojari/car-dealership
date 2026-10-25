/** Thin typed client for the Car Dealership API. */

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
const TOKEN_KEY = 'cd_token';

export const tokenStore = {
  get: (): string | null => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set: (t: string) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* storage unavailable */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ } },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User { id: string; email: string; role: 'USER' | 'ADMIN' }

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  createdAt: string;
}

export type VehicleInput = Pick<Vehicle, 'make' | 'model' | 'category' | 'price' | 'quantity'>;
export type SearchParams = Partial<Record<'make' | 'model' | 'category' | 'minPrice' | 'maxPrice', string>>;

// ─── Errors ───────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Turns the API's `{ error, details: { fieldErrors } }` into one readable sentence. */
function messageFrom(status: number, body: any): string {
  const fields = body?.details?.fieldErrors as Record<string, string[]> | undefined;
  if (fields) {
    const [name, msgs] = Object.entries(fields)[0] ?? [];
    if (name && msgs?.length) return `${name}: ${msgs[0]}`;
  }
  return body?.error ?? `Request failed (HTTP ${status})`;
}

async function request<T>(path: string, init: RequestInit = {}, withAuth = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = withAuth ? tokenStore.get() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the API running?');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, messageFrom(res.status, body));
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

const post = (body?: unknown): RequestInit => ({ method: 'POST', body: body ? JSON.stringify(body) : undefined });

// ─── Endpoints ────────────────────────────────────────────────────────────────

export const auth = {
  register: (email: string, password: string) =>
    request<{ user: User }>('/api/auth/register', post({ email, password }), false),
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/login', post({ email, password }), false),
  me: () => request<{ user: User }>('/api/auth/me'),
};

export const vehicles = {
  list: () => request<{ vehicles: Vehicle[] }>('/api/vehicles'),
  get: (id: string) => request<{ vehicle: Vehicle }>(`/api/vehicles/${id}`),
  search: (params: SearchParams) =>
    request<{ vehicles: Vehicle[] }>(`/api/vehicles/search?${new URLSearchParams(params as Record<string, string>)}`),
  create: (data: VehicleInput) => request<{ vehicle: Vehicle }>('/api/vehicles', post(data)),
  update: (id: string, data: Partial<VehicleInput>) =>
    request<{ vehicle: Vehicle }>(`/api/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/api/vehicles/${id}`, { method: 'DELETE' }),
  purchase: (id: string) => request<{ vehicle: Vehicle }>(`/api/vehicles/${id}/purchase`, post()),
  restock: (id: string, quantity: number) =>
    request<{ vehicle: Vehicle }>(`/api/vehicles/${id}/restock`, post({ quantity })),
};
