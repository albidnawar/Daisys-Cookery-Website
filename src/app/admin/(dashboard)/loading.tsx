export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-3xl bg-brand-chocolate/5" />
      ))}
    </div>
  );
}
