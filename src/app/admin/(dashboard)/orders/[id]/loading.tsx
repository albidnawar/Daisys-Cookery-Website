export default function OrderDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-4 w-32 animate-pulse rounded-full bg-brand-chocolate/10" />
      <div className="h-8 w-64 animate-pulse rounded-full bg-brand-chocolate/10" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <div className="h-40 w-full animate-pulse rounded-3xl bg-brand-chocolate/5" />
          <div className="h-48 w-full animate-pulse rounded-3xl bg-brand-chocolate/5" />
          <div className="h-32 w-full animate-pulse rounded-3xl bg-brand-chocolate/5" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="h-32 w-full animate-pulse rounded-3xl bg-brand-chocolate/5" />
          <div className="h-32 w-full animate-pulse rounded-3xl bg-brand-chocolate/5" />
        </div>
      </div>
    </div>
  );
}
