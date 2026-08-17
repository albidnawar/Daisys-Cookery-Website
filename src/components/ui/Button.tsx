import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-orange text-white shadow-md shadow-brand-orange/20 hover:bg-brand-chocolate",
  secondary:
    "bg-white text-brand-chocolate border-2 border-brand-chocolate/15 hover:border-brand-chocolate/30",
  ghost: "bg-transparent text-brand-chocolate hover:bg-brand-chocolate/5",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-bold font-body transition-colors disabled:opacity-45 disabled:pointer-events-none";

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  children: ReactNode;
};

export function LinkButton({
  variant = "primary",
  className = "",
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
