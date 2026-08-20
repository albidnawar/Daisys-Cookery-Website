export default function CakeDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <div className="mb-6 h-4 w-48 animate-pulse rounded-full bg-brand-chocolate/10" />
      <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="aspect-4/3 w-full animate-pulse rounded-3xl bg-brand-chocolate/5" />
        <div className="flex flex-col gap-4">
          <div className="h-4 w-24 animate-pulse rounded-full bg-brand-chocolate/10" />
          <div className="h-10 w-3/4 animate-pulse rounded-full bg-brand-chocolate/10" />
          <div className="h-4 w-full animate-pulse rounded-full bg-brand-chocolate/10" />
          <div className="h-4 w-5/6 animate-pulse rounded-full bg-brand-chocolate/10" />
          <div className="h-12 w-40 animate-pulse rounded-full bg-brand-chocolate/10" />
        </div>
      </div>
    </div>
  );
}
