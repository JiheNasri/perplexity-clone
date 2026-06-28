
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

  let { data: usage } = await supabase
    .from("user_usage")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (!usage || usage.usage_date !== today) {
    const { data: reset } = await supabase
      .from("user_usage")
      .upsert({ user_id: userId, search_count: 0, research_count: 0, usage_date: today })
      .select()
      .single()
    usage = reset
  }

  const used = usage[countField]

  if (used >= limit) {
    return { allowed: false, used, limit, resetsInMs: msUntilNextMidnightUTC() }
  }

  await supabase
    .from("user_usage")
    .update({ [countField]: used + 1 })
    .eq("user_id", userId)

  return { allowed: true, used: used + 1, limit, resetsInMs: msUntilNextMidnightUTC() }
}