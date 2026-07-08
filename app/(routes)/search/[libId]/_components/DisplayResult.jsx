// components/DisplayResult.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowUp, Loader2Icon, LucideImage, LucideList,
  LucideSparkles, LucideVideo, Mic, Paperclip,
  AlertTriangle, X, MessageSquare,
} from "lucide-react"
import { useParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { supabase } from "@/app/services/Supabase"
import { useSidebar } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useModelStore } from "@/lib/stores/modelStore"
import { useSearchStore } from "@/lib/stores/searchStore"
import { useLibraryHistory } from "@/app/context/LibraryContext"
import { useUsage } from "@/app/context/UsageContext"
import { useTokenWarning } from "@/hooks/useTokenWarning"
import { useToasts } from "@/hooks/useToasts"
import { useStreamingSearch } from "@/hooks/useStreamingSearch"
import { extractFollowUps } from "@/lib/chatUtils"
import { getStatusBorderClass } from "@/lib/Usageutils"
import { UsageBadge } from "@/app/_components/UsageBadge"
import { ModelSelect } from "@/app/_components/ModelSelect"
import AnswerDisplay from "./AnswerDisplay"
import ImageListTab from "./ImageListTab"
import SourceListTab from "./SourceListTab"
import VideoListTab from "./VideoListTab"
import LoadingSteps from "./LoadingSteps"
import { TokenWarningBanner } from "@/app/_components/ui/TokenWarningBanner"

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { label: "Answer",  icon: LucideSparkles },
  { label: "Images",  icon: LucideImage },
  { label: "Videos",  icon: LucideVideo },
  { label: "Sources", icon: LucideList, badge: 10 },
]

// ─── Toast UI ─────────────────────────────────────────────────────────────────

function SearchToast({ id, onDismiss, children }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), 12_000)
    return () => clearTimeout(t)
  }, [id, onDismiss])

  return (
    <div
      role="alert"
      className="flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-amber-100 max-w-sm w-full"
      style={{ background: "#7c4a00", border: "1px solid #a36200" }}
    >
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" />
      <span className="flex-1 leading-snug">{children}</span>
      <button
        onClick={() => onDismiss(id)}
        className="text-amber-300 hover:text-white transition-colors mt-0.5"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

function RateLimitToast({ id, resetTime, onDismiss }) {
  return (
    <SearchToast id={id} onDismiss={onDismiss}>
      Rate limit reached. Limits reset at <strong>{resetTime}</strong>.{" "}
      <a href="" target="_blank" rel="noreferrer" className="underline text-amber-200 hover:text-white">
        Explore our Pro plan
      </a>{" "}
      for higher limits.
    </SearchToast>
  )
}

function EmptyResponseToast({ id, onDismiss }) {
  return (
    <SearchToast id={id} onDismiss={onDismiss}>
      This model returned an empty response. Please try again or switch to another model.
    </SearchToast>
  )
}



// ─── Per-chat result ──────────────────────────────────────────────────────────

const ChatResult = React.memo(
  function ChatResult({ chat, index, total, streamingState, onFollowUp }) {
    const [activeTab, setActiveTab] = useState("Answer")
    const isStreamingThis = index === streamingState.chatIndex

    const { cleanAnswer, followUps } = useMemo(() => {
      if (isStreamingThis) return extractFollowUps(streamingState.rawText)
      return { cleanAnswer: chat.aiResp ?? "", followUps: chat.followUps ?? [] }
    }, [isStreamingThis, streamingState.rawText, chat.aiResp, chat.followUps])

    return (
      <div id={chat.anchorId} className="mt-5 sm:mt-7 scroll-mt-16">

        {/* User bubble */}
        <div className="flex justify-end mb-6">
          <div
            className="max-w-[75%] text-white px-4 py-3 rounded-[20px] rounded-tr-[5px] text-sm sm:text-[15px] leading-relaxed font-medium shadow-sm"
            style={{ background: "linear-gradient(135deg, oklch(0.5161 0.0817 211.9), oklch(0.72 0.11 195))" }}
          >
            {chat.userSearchInput}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 sm:gap-2 border-b border-gray-200 pb-2 mt-4 sm:mt-6 overflow-x-auto scrollbar-hide">
          {TABS.map(({ label, icon: Icon, badge }) => (
            <button
              key={label}
              onClick={() => setActiveTab(label)}
              className={`flex items-center gap-1.5 relative text-sm font-medium whitespace-nowrap px-2 py-1 rounded-sm transition-colors
                ${activeTab === label ? "text-black" : "text-gray-500 hover:text-gray-800"}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">{label}</span>
              {badge && (
                <span className="ml-0.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                  {badge}
                </span>
              )}
              {activeTab === label && (
                <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-black rounded" />
              )}
            </button>
          ))}

          {/* Search count — replaces hardcoded "1 task ↗" */}
          <div className="ml-auto shrink-0 flex items-center gap-1 text-xs text-gray-400 pr-1">
            <MessageSquare className="w-3 h-3" />
            <span>{index + 1} / {total}</span>
          </div>
        </div>

        {/* Tab content */}
        <div className="mt-2">
          {activeTab === "Answer"  && (
            <AnswerDisplay
              chat={chat}
              loadingSearch={isStreamingThis ? streamingState.isLoadingSearch : false}
              isStreaming={isStreamingThis ? streamingState.isStreaming : false}
              aiResp={cleanAnswer}
              followUps={followUps}
              onFollowUp={onFollowUp}
            />
          )}
          {activeTab === "Images"  && <ImageListTab  chat={chat} />}
          {activeTab === "Videos"  && <VideoListTab  chat={chat} />}
          {activeTab === "Sources" && <SourceListTab chat={chat} />}
        </div>
        <hr className="my-5" />
      </div>
    )
  },
  (prev, next) => {
    if (
      prev.chat       !== next.chat       ||
      prev.index      !== next.index      ||
      prev.total      !== next.total      ||
      prev.onFollowUp !== next.onFollowUp
    ) return false

    const wasStreaming = prev.index === prev.streamingState.chatIndex
    const isStreaming  = next.index === next.streamingState.chatIndex
    return !wasStreaming && !isStreaming
  },
)

// ─── Main component ───────────────────────────────────────────────────────────

export default function DisplayResult() {
  const { libId }           = useParams()
  const { user }            = useUser()
  const isAuthenticated     = !!user
  const { selectedModelId } = useModelStore()
  const { pendingSearch, clearPendingSearch, setCurrentQuery } = useSearchStore()
  const { usage, refreshUsage } = useUsage()
  const { refresh }         = useLibraryHistory()
  const { open, isMobile }  = useSidebar()

  const [userInput, setUserInput] = useState("")
  const textareaRef               = useRef(null)

  const tokenWarning = useTokenWarning(userInput, usage)
  const { toasts, dismiss, addRateLimit, addEmptyResponse } = useToasts()

  const { chats, streamingState, run, runOnce, hydrateFromDB } = useStreamingSearch({
    libId,
    userEmail:        user?.primaryEmailAddress?.emailAddress,
    addRateLimit,
    addEmptyResponse,
    onSaved:          refresh,
    refreshUsage,
  })

  const isBusy      = streamingState.isLoadingSearch || streamingState.isStreaming
  const hasInput    = userInput.trim().length > 0
  const visibleChats = chats.filter((c) => c._isPlaceholder || c.aiResp)
  const total        = visibleChats.length

 

  // Border only reacts to token status when authenticated
  const borderClass = isAuthenticated
    ? getStatusBorderClass(tokenWarning.status)
    : "border-gray-200"

  const sidebarOffset = !isMobile && open ? "var(--sidebar-width, 16rem)" : "0px"

  // ── Load DB chats on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (!libId) return
    let cancelled = false

    supabase
      .from("Chats")
      .select("*")
      .eq("libId", libId)
      .order("id", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error("Chats fetch error:", error)
        const firstQuery = hydrateFromDB(data)
        if (firstQuery) setCurrentQuery(firstQuery)
      })

    return () => { cancelled = true }
  }, [libId, hydrateFromDB, setCurrentQuery])

  // ── Fire pending search from home page navigation ─────────────────────────
  useEffect(() => {
    if (!pendingSearch) return
    const { query, type } = pendingSearch
    clearPendingSearch()
    runOnce(query, selectedModelId, type, `${libId}:${query}:${type}`)
  }, [pendingSearch, libId, selectedModelId, clearPendingSearch, runOnce])

  // ── Auto-resize textarea ───────────────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 200) + "px"
  }, [userInput])

  // ── / shortcut to focus the textarea ──────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (
        e.key === "/" &&
        e.target.tagName !== "TEXTAREA" &&
        e.target.tagName !== "INPUT"
      ) {
        e.preventDefault()
        textareaRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!userInput.trim() || isBusy || tokenWarning.status === "blocked") return
    run(userInput, selectedModelId)
    setUserInput("")
  }, [userInput, isBusy, run, selectedModelId, tokenWarning.status])

  const handleFollowUp = useCallback(
    (query) => { if (!isBusy) run(query, selectedModelId) },
    [isBusy, run, selectedModelId],
  )

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="mt-5 sm:mt-7 pb-36">

      {/* Toast stack */}
      <div
        className="fixed bottom-24 right-4 z-60 flex flex-col gap-2 items-end pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto animate-in slide-in-from-right-4 fade-in duration-200"
          >
            {toast.type === "empty-response"
              ? <EmptyResponseToast id={toast.id} onDismiss={dismiss} />
              : <RateLimitToast     id={toast.id} resetTime={toast.resetTime} onDismiss={dismiss} />}
          </div>
        ))}
      </div>

      {/* Initial loading state */}
      {chats.length === 0 && (streamingState.isLoadingSearch || streamingState.isStreaming) && (
        <LoadingSteps
          isLoadingSearch={streamingState.isLoadingSearch}
          isStreaming={streamingState.isStreaming}
          hasText={streamingState.rawText.length > 0}
        />
      )}

      {/* Chat list */}
      {visibleChats.map((chat, index) => (
        <ChatResult
          key={chat.id ?? `placeholder-${index}`}
          chat={chat}
          index={index}
          total={total}
          streamingState={streamingState}
          onFollowUp={handleFollowUp}
        />
      ))}

      {/* Fixed input bar */}
      <div
        className="fixed bottom-0 flex flex-col justify-end pb-4 pt-10 pointer-events-none bg-gradient-to-t from-white via-white/90 to-transparent z-50"
        style={{ left: sidebarOffset, right: 0, transition: "left 200ms ease" }}
      >
        <div className="mx-4 sm:mx-8 md:mx-16 lg:mx-28 xl:mx-48 flex flex-col gap-2">


          {/* Input bar */}
          <div
            className={`pointer-events-auto bg-white border rounded-2xl shadow-sm px-4 py-3 flex flex-col gap-2 transition-colors duration-300 ${borderClass}`}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={userInput}
              placeholder="Ask a follow-up…"
              className="w-full resize-none outline-none text-sm sm:text-[15px] bg-transparent leading-6 max-h-[200px] overflow-y-auto placeholder:text-gray-400 text-gray-800"
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            {/* Divider */}
            <div className="h-px bg-gray-100" />

            {/* Toolbar */}
            <div className="flex items-center justify-between">

              {/* Left — attach + usage badge + token hint */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  aria-label="Attach file"
                >
                  <Paperclip className="size-4" />
                </Button>

                {isAuthenticated && (
                  <UsageBadge usage={usage} mobileCompact />
                )}

                {/* Token estimator — authenticated users only, only when typing */}
                <TokenWarningBanner
                  warning={tokenWarning}
                  show={hasInput}
                  isAuthenticated={isAuthenticated}
                />
              </div>

              {/* Right — model + mic/send */}
              <div className="flex items-center gap-1.5">
                <ModelSelect />

                {/* Mic when idle, send when typing, spinner when busy */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={hasInput ? handleSubmit : undefined}
                  disabled={isBusy}
                  aria-label={hasInput ? "Send message" : "Voice input"}
                  className={`w-8 h-8 transition-all duration-150 ${
                    hasInput
                      ? "bg-primary text-white hover:bg-primary/90 disabled:opacity-40"
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  }`}
                >
                  {isBusy   ? <Loader2Icon className="size-[18px] animate-spin" /> :
                   hasInput ? <ArrowUp     className="size-[15px]" /> :
                              <Mic         className="size-[18px]" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}