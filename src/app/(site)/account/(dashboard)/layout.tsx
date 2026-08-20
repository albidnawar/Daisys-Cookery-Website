import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customer/auth";
import { AccountNav } from "@/components/account/AccountNav";

export default async function AccountDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <h1 className="mb-6 font-display text-3xl font-semibold text-brand-chocolate">My account</h1>
      <AccountNav />
      <div className="pt-8">{children}</div>
    </div>
  );
}
