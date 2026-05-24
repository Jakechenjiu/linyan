export default function BatchLoading() {
  return (
    <div className="space-y-8 max-w-4xl animate-pulse">
      <div>
        <div className="h-9 w-64 bg-[var(--accent)] rounded-lg" />
        <div className="h-4 w-80 bg-[var(--accent)] rounded mt-2" />
      </div>
      <div className="space-card rounded-2xl p-6 space-y-6">
        <div className="h-5 w-24 bg-[var(--accent)] rounded" />
        <div className="h-12 w-full bg-[var(--accent)] rounded-xl" />
        <div className="h-5 w-20 bg-[var(--accent)] rounded" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-16 bg-[var(--accent)] rounded-xl" />
          <div className="h-16 bg-[var(--accent)] rounded-xl" />
          <div className="h-16 bg-[var(--accent)] rounded-xl" />
        </div>
        <div className="h-5 w-20 bg-[var(--accent)] rounded" />
        <div className="flex gap-2">
          <div className="h-10 w-20 bg-[var(--accent)] rounded-lg" />
          <div className="h-10 w-20 bg-[var(--accent)] rounded-lg" />
          <div className="h-10 w-20 bg-[var(--accent)] rounded-lg" />
        </div>
        <div className="h-12 w-44 bg-[var(--accent)] rounded-xl" />
      </div>
    </div>
  );
}
