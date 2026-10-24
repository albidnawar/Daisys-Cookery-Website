import { createServiceRoleClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";

export type Rider = { id: string; name: string; phone: string };

export class RiderError extends Error {}

export async function listRidersAdmin(): Promise<Rider[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("riders").select("id, name, phone").order("name");
  if (error) throw error;
  return data;
}

export async function createRiderAdmin(name: string, phone: string): Promise<string> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("riders")
    .insert({ name, phone: normalizePhone(phone) })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") throw new RiderError(`A rider with that phone number already exists.`);
    throw error;
  }
  return data.id;
}

export async function updateRiderAdmin(id: string, name: string, phone: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("riders")
    .update({ name, phone: normalizePhone(phone) })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") throw new RiderError(`A rider with that phone number already exists.`);
    throw error;
  }
}

/** Orders keep their own rider_name/rider_phone copy rather than a foreign
 * key to this table (an order shouldn't silently change who it says
 * delivered it if the rider directory entry is later edited or removed),
 * so deleting a rider here is always safe. */
export async function deleteRiderAdmin(id: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("riders").delete().eq("id", id);
  if (error) throw error;
}
