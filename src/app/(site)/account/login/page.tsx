import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customer/auth";
import { AccountLoginForm } from "@/components/account/AccountLoginForm";

export default async function AccountLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") ? next : "/account";

  const customer = await getCurrentCustomer();
  if (customer) redirect(safeNext);

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-8">
      <h1 className="mb-2 font-display text-3xl font-semibold text-brand-chocolate">
        Sign in to your account
      </h1>
      <p className="mb-8 font-body text-sm text-brand-chocolate/70">
        Track your orders, reorder a favourite, and save your delivery details.
      </p>
      <div className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-6">
        <AccountLoginForm next={safeNext} />
      </div>
    </div>
  );
}
