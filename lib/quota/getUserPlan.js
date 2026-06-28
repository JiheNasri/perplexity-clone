import { supabase } from "@/app/services/Supabase"

export async function getUserPlan(userId) {
  const { data } = await supabase
    .from("Users")
    .select("plan")
    .eq("id", userId)
    .single()

  return data?.plan ?? "free"
}