/** DriveHub wordmark with a small car glyph. */
export default function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-11 w-11' : 'h-8 w-8';
  return (
    <span className="inline-flex items-center gap-2.5 font-bold text-white">
      <span className={`grid place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 ${box}`}>
        <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 16V12l1.6-4.2A2 2 0 0 1 8.5 6.5h7a2 2 0 0 1 1.9 1.3L19 12v4" />
          <path d="M3 16h18M7.5 16v2M16.5 16v2" />
        </svg>
      </span>
      <span className={size === 'lg' ? 'text-2xl' : 'text-xl'}>DriveHub</span>
    </span>
  );
}
