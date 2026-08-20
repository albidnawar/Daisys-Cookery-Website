import { getCurrentCustomer } from "@/lib/customer/auth";
import { ProfileForm } from "@/components/account/ProfileForm";

export default async function ProfilePage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  return <ProfileForm profile={customer} />;
}
