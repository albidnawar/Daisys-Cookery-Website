import type { ComponentProps } from "react";

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-3xl border-2 border-brand-chocolate/10 bg-white transition-transform hover:scale-[1.02] ${className}`}
      {...props}
    />
  );
}
