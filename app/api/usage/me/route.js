import { auth } from "@clerk/nextjs/server"
import { PLAN_LIMITS } from "@/lib/quota/config"
import { getUserPlan } from "@/lib/quota/getUserPlan"
import { supabase } from "@/app/services/Supabase"

export const runtime = "edge"

function msUntilNextMidnightUTC() {
  const now = new Date()
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  return next.getTime() - now.getTime()
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return new Response("Unauthorized", { status: 401 })

  const plan = await getUserPlan(userId)
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
  const today = new Date().toISOString().split("T")[0]

  const { data: usage } = await supabase
    .from("user_usage")
    .select("*")
    .eq("user_id", userId)
    .single()

  const isToday = usage?.usage_date === today

  return Response.json({
    plan,
    searches: { used: isToday ? usage.search_count : 0, limit: limits.searches },
    research: { used: isToday ? usage.research_count : 0, limit: limits.research },
   tokens:   { used: isToday ? usage.tokens_used : 0, limit: limits.dailyTokens },
    resetsInMs: msUntilNextMidnightUTC(),
  })
}