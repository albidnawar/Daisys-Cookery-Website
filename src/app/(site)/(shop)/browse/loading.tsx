export default function BrowseLoading() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-8 md:grid-cols-[240px_1fr]">
      <div className="hidden h-96 animate-pulse rounded-3xl bg-brand-chocolate/5 md:block" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-3xl border-2 border-brand-chocolate/10 p-4">
            <div className="aspect-square w-full animate-pulse rounded-2xl bg-brand-chocolate/5" />
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-brand-chocolate/10" />
            <div className="h-3 w-1/3 animate-pulse rounded-full bg-brand-chocolate/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
