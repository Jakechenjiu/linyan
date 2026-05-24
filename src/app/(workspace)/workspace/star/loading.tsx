export default function StarLoading() {
  return (
    <div className="space-y-8 max-w-6xl animate-pulse">
      <div>
        <div className="h-9 w-48 bg-[var(--accent)] rounded-lg mb-2" />
        <div className="h-4 w-64 bg-[var(--accent)] rounded" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-card rounded-2xl p-5 h-32 bg-[var(--accent)]" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-card rounded-2xl p-6 h-64 bg-[var(--accent)]" />
        ))}
      </div>
    </div>
  );
}
