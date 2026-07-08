// hooks/useTokenWarning.js
import { useMemo } from "react"
import { estimateTokens } from "@/lib/estimateTokens"
import { WARN_AT, DANGER_AT } from "@/lib/Usageutils"

/**
 * Live token estimator — "will THIS message use too much of what's left?"
 * Different from getUsageStatus (which checks total used/limit).
 * This checks: estimated / remaining — how much of what's left will this cost.
 */
export function useTokenWarning(inputText, usage) {
  return useMemo(() => {
    const estimated = estimateTokens(inputText)
    const limit     = usage?.tokens?.limit ?? 0
    const used      = usage?.tokens?.used  ?? 0
    const remaining = limit - used

    if (remaining <= 0) return { status: "blocked", estimated, remaining: 0 }

    const pctOfRemaining = (estimated / remaining) * 100

    if (pctOfRemaining >= DANGER_AT) return { status: "danger",  estimated, remaining }
    if (pctOfRemaining >= WARN_AT)   return { status: "warning", estimated, remaining }
    return                                  { status: "ok",      estimated, remaining }
  }, [inputText, usage])
}