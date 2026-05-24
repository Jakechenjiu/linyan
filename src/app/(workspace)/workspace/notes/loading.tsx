export default function NotesLoading() {
  return (
    <div className="space-y-8 max-w-4xl animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-8 w-36 bg-[var(--accent)] rounded mb-2" />
        <div className="h-4 w-48 bg-[var(--accent)] rounded" />
      </div>

      {/* Search skeleton */}
      <div className="h-10 bg-[var(--accent)] rounded-lg" />

      {/* Note card skeletons */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-card-border bg-[var(--bg-elevated)]/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-48 bg-[var(--accent)] rounded" />
            <div className="h-3 w-16 bg-[var(--accent)] rounded" />
          </div>
          <div className="flex gap-1.5">
            <div className="h-4 w-12 bg-[var(--accent)] rounded-full" />
            <div className="h-4 w-16 bg-[var(--accent)] rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
