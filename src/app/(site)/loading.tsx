export default function SiteLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-8">
      <div className="h-10 w-2/3 animate-pulse rounded-full bg-brand-chocolate/10" />
      <div className="h-4 w-full animate-pulse rounded-full bg-brand-chocolate/10" />
      <div className="h-4 w-5/6 animate-pulse rounded-full bg-brand-chocolate/10" />
      <div className="h-64 w-full animate-pulse rounded-3xl bg-brand-chocolate/5" />
    </div>
  );
}
