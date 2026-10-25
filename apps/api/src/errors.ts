/** An error that maps directly to an HTTP response. Thrown by services, handled in errorHandler. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/** Prisma "record not found" (P2025) and "unique violation" (P2002) detection. */
export function prismaCode(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    return String((err as { code: unknown }).code);
  }
  return undefined;
}
