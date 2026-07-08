
import { useCallback } from "react"

const key = (libId) => `wab_${libId}`

function safeParse(raw) {
  try { return raw ? JSON.parse(raw) : [] }
  catch { return [] }
}

export function useWriteAheadBuffer(libId) {
  const read  = useCallback(() => safeParse(sessionStorage.getItem(key(libId))), [libId])
  const write = useCallback((chats) => {
    const saveable = chats.filter((c) => !c._isPlaceholder && c.aiResp)
    sessionStorage.setItem(key(libId), JSON.stringify(saveable))
  }, [libId])
  const clear = useCallback(() => sessionStorage.removeItem(key(libId)), [libId])

  return { read, write, clear }
}