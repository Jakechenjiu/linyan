export default function StudioLoading() {
  return (
    <div className="space-y-6 max-w-5xl animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--accent)] rounded-lg" />
          <div>
            <div className="h-7 w-48 bg-[var(--accent)] rounded-lg" />
            <div className="h-3 w-32 bg-[var(--accent)] rounded mt-1.5" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-[var(--accent)] rounded-xl" />
          <div className="h-8 w-20 bg-[var(--accent)] rounded-xl" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-5 w-12 bg-[var(--accent)] rounded" />
        <div className="h-5 w-16 bg-[var(--accent)] rounded" />
        <div className="h-5 w-12 bg-[var(--accent)] rounded" />
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-2">
          <div className="h-2 w-full bg-[var(--accent)] rounded-full" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-[var(--accent)] rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-[var(--accent)] rounded-2xl" />
      </div>
    </div>
  );
}
