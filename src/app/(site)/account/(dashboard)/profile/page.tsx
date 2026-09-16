import { getCurrentCustomer } from "@/lib/customer/auth";
import { ProfileForm } from "@/components/account/ProfileForm";
import { ChangePasswordForm } from "@/components/shared/ChangePasswordForm";

export default async function ProfilePage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  return (
    <div className="flex flex-col gap-6">
      <ProfileForm profile={customer} />
      <ChangePasswordForm />
    </div>
  );
}
