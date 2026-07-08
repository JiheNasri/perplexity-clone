// hooks/useToasts.js
import { useCallback, useState } from "react"
import { getResetTime } from "@/lib/chatUtils"

export function useToasts() {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback(
    (id) => setToasts((prev) => prev.filter((t) => t.id !== id)),
    [],
  )
  const addRateLimit = useCallback(
    () => setToasts((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: "rate-limit", resetTime: getResetTime() },
    ]),
    [],
  )
  const addEmptyResponse = useCallback(
    () => setToasts((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: "empty-response" },
    ]),
    [],
  )

  return { toasts, dismiss, addRateLimit, addEmptyResponse }
}