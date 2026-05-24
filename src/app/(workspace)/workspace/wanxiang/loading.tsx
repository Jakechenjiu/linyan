export default function WanxiangLoading() {
  return (
    <div className="space-y-8 max-w-4xl animate-pulse">
      {/* Header */}
      <div>
        <div className="h-8 w-40 bg-[var(--accent)] rounded mb-2" />
        <div className="h-4 w-64 bg-[var(--accent)] rounded" />
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Form skeleton */}
        <div className="md:col-span-3 space-card rounded-2xl p-6 space-y-5">
          <div className="h-5 w-24 bg-[var(--accent)] rounded mb-2" />
          <div className="h-12 bg-[var(--accent)] rounded-xl" />
          <div className="h-5 w-32 bg-[var(--accent)] rounded mb-2" />
          <div className="h-32 bg-[var(--accent)] rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-8 bg-[var(--accent)] rounded" />
            <div className="h-8 bg-[var(--accent)] rounded" />
          </div>
          <div className="h-12 bg-[var(--accent)] rounded-xl" />
        </div>

        {/* Sidebar skeleton */}
        <div className="md:col-span-2 space-y-4">
          <div className="space-card rounded-2xl p-5 space-y-3">
            <div className="h-5 w-20 bg-[var(--accent)] rounded" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 bg-[var(--accent)] rounded" />
            ))}
          </div>
          <div className="space-card rounded-2xl p-5 space-y-3">
            <div className="h-5 w-28 bg-[var(--accent)] rounded" />
            <div className="h-4 bg-[var(--accent)] rounded" />
            <div className="h-4 w-20 bg-[var(--accent)] rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
