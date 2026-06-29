import { useMemo } from "react"
import { estimateTokens } from "@/lib/estimateTokens"

export function useTokenWarning(inputText, usage) {
  return useMemo(() => {
    const estimated = estimateTokens(inputText)
    const remaining = (usage?.tokens?.limit ?? 0) - (usage?.tokens?.used ?? 0)

    if (remaining <= 0) return { status: "blocked", estimated, remaining: 0 }

    const pctOfRemaining = (estimated / remaining) * 100
    if (pctOfRemaining >= 90) return { status: "danger", estimated, remaining }
    if (pctOfRemaining >= 60) return { status: "warning", estimated, remaining }
    return { status: "ok", estimated, remaining }
  }, [inputText, usage])
}