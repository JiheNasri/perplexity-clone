
import { supabase } from "@/app/services/Supabase"
import { PLAN_LIMITS } from "./config"

function msUntilNextMidnightUTC() {
  const now = new Date()
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  return next.getTime() - now.getTime()
}

export async function checkQuota(userId, plan = "free", type = "searches") {
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
  const limit = limits[type]
  const today = new Date().toISOString().split("T")[0]
  const countField = type === "research" ? "research_count" : "search_count"

  // daily reset — low collision risk, simple upsert is fine here
  let { data: usage } = await supabase
    .from("user_usage")
    .select("usage_date")
    .eq("user_id", userId)
    .single()

  if (!usage || usage.usage_date !== today) {
    await supabase
      .from("user_usage")
      .upsert({ user_id: userId, search_count: 0, research_count: 0, usage_date: today })
  }

  // atomic check-and-increment — this is the actual fix
  const { data, error } = await supabase
    .rpc("increment_request_count", { p_user_id: userId, p_field: countField, p_limit: limit })
    .single()

  if (error) throw error

  return { allowed: data.allowed, used: data.used, limit, resetsInMs: msUntilNextMidnightUTC() }
}