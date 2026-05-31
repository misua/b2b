export default function CostingLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-4 w-64 bg-muted rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="h-6 w-48 bg-muted rounded" />
            <div className="h-4 w-72 bg-muted rounded" />
            <div className="h-10 w-24 bg-muted rounded-lg" />
            <div className="h-32 w-full bg-muted rounded" />
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="h-5 w-36 bg-muted rounded" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-4 w-28 bg-muted rounded" />
                <div className="h-9 w-full bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
