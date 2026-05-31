export default function OrderTrackerLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
      <div className="h-4 w-48 bg-muted rounded" />
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <div className="h-6 w-56 bg-muted rounded" />
        <div className="h-4 w-40 bg-muted rounded" />
      </div>
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div className="h-5 w-36 bg-muted rounded" />
        {/* Progress bar skeleton */}
        <div className="h-2 w-full bg-muted rounded-full" />
        {/* Steps skeleton */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 items-start">
            <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
            <div className="space-y-1.5 pt-1 flex-1">
              <div className="h-4 w-36 bg-muted rounded" />
              <div className="h-3 w-52 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
