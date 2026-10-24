import { createServiceRoleClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";

export type CourierTemplateSettings = {
  courierName: string;
  pickupPoint: string;
  senderNumber: string;
  senderAddress: string;
  senderFacebookName: string;
  bkashNumber: string;
  pageName: string;
  emergencyNumber: string;
  noteText: string;
};

// Dev fallback mirrors courier_template_settings' own column defaults —
// see 0031_courier_message_settings.sql.
const FALLBACK: CourierTemplateSettings = {
  courierName: "এসআরএস এক্সপ্রেস",
  pickupPoint: "দেবপাহড়, চকবাজার চট্টগ্রাম",
  senderNumber: "01814438989",
  senderAddress: "সানমার সেন্টিনো, মসজিদের সামনে দেবপাহাড় চকবাজার চট্টগ্রাম",
  senderFacebookName: "",
  bkashNumber: "01788997985 (Personal)",
  pageName: "Daisy's Cookery",
  emergencyNumber: "01814438989",
  noteText:
    "আপনি অর্ডারটা যদি এই ফর্মেটে প্রদান না করেন তাহলে পিকআপ কিংবা ডেলিভারি করার সময় কোন সমস্যা হলে সেই সমস্যার দায়ভার আমরা নিব না",
};

export async function getCourierTemplateSettings(): Promise<CourierTemplateSettings> {
  if (!isSupabaseConfigured()) return FALLBACK;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("courier_template_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  if (error || !data) return FALLBACK;

  return {
    courierName: data.courier_name,
    pickupPoint: data.pickup_point,
    senderNumber: data.sender_number,
    senderAddress: data.sender_address,
    senderFacebookName: data.sender_facebook_name,
    bkashNumber: data.bkash_number,
    pageName: data.page_name,
    emergencyNumber: data.emergency_number,
    noteText: data.note_text,
  };
}

export async function updateCourierTemplateSettings(patch: CourierTemplateSettings): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("courier_template_settings")
    .update({
      courier_name: patch.courierName,
      pickup_point: patch.pickupPoint,
      sender_number: patch.senderNumber,
      sender_address: patch.senderAddress,
      sender_facebook_name: patch.senderFacebookName,
      bkash_number: patch.bkashNumber,
      page_name: patch.pageName,
      emergency_number: patch.emergencyNumber,
      note_text: patch.noteText,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  if (error) throw error;
}
