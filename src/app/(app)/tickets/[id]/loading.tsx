export default function TicketLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-800" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-xl bg-slate-800" />
          <div className="h-48 animate-pulse rounded-xl bg-slate-800" />
        </div>
        <div className="h-40 animate-pulse rounded-xl bg-slate-800" />
      </div>
    </div>
  );
}