export function ComingSoon({ feature }: { feature: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-brand-chocolate/15 p-16 text-center">
      <p className="font-display text-2xl font-semibold text-brand-chocolate">{feature}</p>
      <p className="font-body text-sm text-brand-chocolate/60">
        Not built yet — part of a later phase of the admin portal.
      </p>
    </div>
  );
}
