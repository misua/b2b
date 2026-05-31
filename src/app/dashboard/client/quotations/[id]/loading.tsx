export default function QuotationDetailLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
      <div className="h-4 w-48 bg-muted rounded" />
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="h-6 w-56 bg-muted rounded" />
        <div className="h-4 w-40 bg-muted rounded" />
        <div className="h-px bg-muted" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex gap-3 items-center">
              <div className="w-7 h-7 bg-muted rounded" />
              <div className="space-y-1">
                <div className="h-4 w-28 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
              </div>
            </div>
            <div className="h-4 w-16 bg-muted rounded" />
          </div>
        ))}
        <div className="h-px bg-muted" />
        <div className="flex justify-between">
          <div className="h-5 w-20 bg-muted rounded" />
          <div className="h-7 w-24 bg-muted rounded" />
        </div>
      </div>
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <div className="h-5 w-32 bg-muted rounded" />
        <div className="h-32 w-full bg-muted rounded-lg" />
        <div className="h-9 w-full bg-muted rounded-lg" />
      </div>
    </div>
  );
}
