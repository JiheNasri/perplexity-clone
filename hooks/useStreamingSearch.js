
import { useCallback, useRef, useState } from "react"
import { fetchWebSearch, saveChatIfMissing, saveLibraryIfMissing, streamChat } from "@/lib/chatService"
import { describeSaveError, extractFollowUps, mergeChats } from "@/lib/chatUtils"
import { useWriteAheadBuffer } from "./useWriteAheadBuffer"

const IDLE = {
  chatIndex:       null,
  rawText:         "",
  isStreaming:     false,
  isLoadingSearch: false,
}

export function useStreamingSearch({
  libId,
  userEmail,
  addRateLimit,
  addEmptyResponse,
  onSaved,
  refreshUsage,
}) {
  const wab             = useWriteAheadBuffer(libId)
  const libraryInserted = useRef(false)
  const activeSearches  = useRef(new Set())
  const startedQueries  = useRef(new Set())
  const streamFrameRef  = useRef(null)
  const streamTextRef   = useRef("")

  const [chats, setChats]                   = useState([])
  const [streamingState, setStreamingState] = useState(IDLE)

  // ── rAF-batched text flush (avoids re-renders on every streamed byte) ──────
  const flushStreamText = useCallback(() => {
    streamFrameRef.current = null
    setStreamingState((s) => ({ ...s, rawText: streamTextRef.current }))
  }, [])

  const queueStreamText = useCallback(
    (text) => {
      streamTextRef.current = text
      if (streamFrameRef.current) return
      streamFrameRef.current = requestAnimationFrame(flushStreamText)
    },
    [flushStreamText],
  )

  // ── Called once on mount to merge DB rows + local WAB into state ───────────
  const hydrateFromDB = useCallback(
    (dbChats) => {
      const filtered   = (dbChats ?? []).filter((c) => c.aiResp)
      const merged     = mergeChats(filtered, wab.read())
      if (!merged.length) return null

      setChats((prev) => mergeChats(prev, merged))
      libraryInserted.current = true
      return merged[0]?.userSearchInput ?? null
    },
    [wab],
  )

  // ── Remove placeholder + reset streaming state on any failure ─────────────
  const rollback = useCallback(
    (requestId, finish) => {
      setChats((prev) => prev.filter((c) => c.requestId !== requestId))
      setStreamingState(IDLE)
      finish()
      refreshUsage()
    },
    [refreshUsage],
  )

  // ── Save to Supabase after a successful stream (non-blocking) ──────────────
  const persistAsync = useCallback(
    async (chatPayload, libraryPayload) => {
      try {
        const [{ error: chatErr }, { error: libErr }] = await Promise.all([
          saveChatIfMissing(chatPayload),
          !libraryInserted.current
            ? saveLibraryIfMissing(libraryPayload)
            : Promise.resolve({ error: null }),
        ])

        if (chatErr) console.warn("Chats save skipped:",   describeSaveError(chatErr))
        if (libErr)  console.warn("Library save skipped:", describeSaveError(libErr))

        if (!libErr) { libraryInserted.current = true; onSaved() }
        if (!chatErr) wab.clear()
      } catch (err) {
        console.warn("Background save failed:", describeSaveError(err))
      }
    },
    [onSaved, wab],
  )

  // ── Main runner ────────────────────────────────────────────────────────────
  const run = useCallback(
    async (query, modelId, type = "search") => {
      const trimmed   = query?.trim()
      if (!trimmed) return

      const activeKey = `${type}:${trimmed.toLowerCase()}`
      if (activeSearches.current.has(activeKey)) return
      activeSearches.current.add(activeKey)

      const requestId = crypto.randomUUID()
      const anchorId  = `chat-${requestId}`
      const finish    = () => activeSearches.current.delete(activeKey)

      streamTextRef.current = ""
      setStreamingState({ ...IDLE, isLoadingSearch: true })

      // 1. Web search
      let searchResult = []
      try {
        searchResult = await fetchWebSearch(trimmed, type)
      } catch (err) {
        if (err?.status === 429) addRateLimit()
        else console.error("Web search failed:", err)
        setStreamingState(IDLE)
        finish()
        return
      }

      // 2. Add placeholder so the UI shows a loading state immediately
      const placeholderChat = {
        _isPlaceholder: true,
        id:             `placeholder-${requestId}`,
        requestId,
        anchorId,
        userSearchInput: trimmed,
        searchResult,
        aiResp:    null,
        followUps: [],
      }

      setChats((prev) => {
        const updated = [...prev, placeholderChat]
        setStreamingState((s) => ({
          ...s,
          chatIndex:       updated.length - 1,
          isLoadingSearch: false,
          isStreaming:     true,
          rawText:         "",
        }))
        return updated
      })

      requestAnimationFrame(() =>
        document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" }),
      )

      // 3. Stream AI response
      const { fullText, status } = await streamChat(
        { searchInput: trimmed, searchResult, modelId },
        queueStreamText,
      )

      if (status === 429)    { addRateLimit();       rollback(requestId, finish); return }
      if (status !== 200)    {                        rollback(requestId, finish); return }
      if (!fullText.trim())  { addEmptyResponse();   rollback(requestId, finish); return }

      if (streamFrameRef.current) {
        cancelAnimationFrame(streamFrameRef.current)
        streamFrameRef.current = null
      }

      // 4. Replace placeholder with the completed chat
      const { cleanAnswer, followUps } = extractFollowUps(fullText)

      const insertPayload = {
        libId,
        searchResult,
        userSearchInput: trimmed,
        aiResp:          cleanAnswer,
        followUps,
      }
      const completedChat = {
        ...insertPayload,
        id: crypto.randomUUID(),
        requestId,
        anchorId,
      }

      setChats((prev) => {
        const updated = prev.map((c) => (c.requestId === requestId ? completedChat : c))
        wab.write(updated)
        return updated
      })
      setStreamingState(IDLE)
      finish()
      refreshUsage()

      // 5. Persist to DB in the background (does not block the UI)
      persistAsync(insertPayload, { searchInput: trimmed, userEmail, type, libId })
    },
    [addEmptyResponse, addRateLimit, libId, persistAsync, queueStreamText, refreshUsage, rollback, userEmail, wab],
  )

  // ── Deduplicated run — used for the pendingSearch effect ───────────────────
  const runOnce = useCallback(
    (query, modelId, type, queryKey) => {
      if (startedQueries.current.has(queryKey)) return
      startedQueries.current.add(queryKey)
      run(query, modelId, type)
    },
    [run],
  )

  return { chats, streamingState, run, runOnce, hydrateFromDB }
}