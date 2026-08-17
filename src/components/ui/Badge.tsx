import type { ReactNode } from "react";

type Variant = "chocolate" | "mint" | "pink" | "outline";

const variantClasses: Record<Variant, string> = {
  chocolate: "bg-brand-chocolate text-white",
  mint: "bg-mint text-brand-chocolate",
  pink: "bg-pink text-brand-chocolate",
  outline: "bg-transparent text-brand-chocolate border border-brand-chocolate/30",
};

export function Badge({
  variant = "mint",
  children,
}: {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold font-body tracking-wide ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
