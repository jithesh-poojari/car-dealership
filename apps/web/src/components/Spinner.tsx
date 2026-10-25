export default function Spinner({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`animate-spin rounded-full border-2 border-brand border-t-transparent ${className}`}
    />
  );
}
