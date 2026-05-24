export default function PhotonLoading() {
  return (
    <div className="space-y-8 max-w-5xl animate-pulse">
      <div>
        <div className="h-9 w-48 bg-[var(--accent)] rounded-lg mb-2" />
        <div className="h-4 w-64 bg-[var(--accent)] rounded" />
      </div>
      <div className="grid grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-card rounded-xl p-4 h-20 bg-[var(--accent)]" />
        ))}
      </div>
      <div>
        <div className="h-6 w-24 bg-[var(--accent)] rounded mb-4" />
        <div className="grid grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-card rounded-xl p-4 h-16 bg-[var(--accent)]" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-card rounded-xl p-5 h-48 bg-[var(--accent)]" />
        ))}
      </div>
    </div>
  );
}
