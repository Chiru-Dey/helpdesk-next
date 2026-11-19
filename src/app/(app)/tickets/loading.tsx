export default function TicketsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="h-8 w-32 animate-pulse rounded-lg bg-slate-800" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-800" />
        ))}
      </div>
    </div>
  );
}