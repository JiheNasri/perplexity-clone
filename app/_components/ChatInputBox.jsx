// components/ChatInputBox.jsx
"use client";

import Image from "next/image";
import { useState, useTransition, useRef, useEffect } from "react";
import { AudioLines, ArrowRight, Paperclip, Mic } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs"; // ← auth
import { useSearchStore } from "@/lib/stores/searchStore";
import { TaskPicker } from "./TaskPicker";
import { ModelSelect } from "./ModelSelect";
import { UsageBadge } from "./UsageBadge";
import { useUsage } from "@/app/context/UsageContext";
import { useTokenWarning } from "@/hooks/useTokenWarning";
import { getStatusBorderClass } from "@/lib/Usageutils";
import { TokenWarningBanner } from "./ui/TokenWarningBanner";

const SEARCH_TYPE_MAP = {
  SEARCH: "search",
  RESEARCH: "research",
  WRITING: "search",
  CODE: "search",
  TRANSLATE: "search",
  SUMMARIZE: "search",
  ANALYZE: "search",
  CALCULATE: "search",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function IconBtn({ onClick, label, children, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={[
        "flex items-center justify-center h-8 w-8 rounded-full shrink-0",
        "text-gray-400 hover:text-gray-600",
        "border border-transparent hover:border-gray-200 hover:bg-gray-50",
        "transition-all duration-150",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SendBtn({ hasInput, loading, onClick }) {
  return (
    <button
      type="button"
      disabled={loading || !hasInput}
      onClick={onClick}
      aria-label="Submit search"
      className="flex items-center justify-center h-8 w-8 rounded-full ml-1 shrink-0 transition-all duration-150"
      style={{
        background: "oklch(0.5161 0.0817 211.9)",
        opacity: hasInput ? 1 : 0.6,
        cursor: hasInput ? "pointer" : "default",
      }}
    >
      {hasInput ? (
        <ArrowRight className="h-4 w-4 text-white" />
      ) : (
        <AudioLines className="h-4 w-4 text-white/70" />
      )}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatInputBox() {
  const [userInput, setUserInput] = useState("");
  const [activeTask, setActiveTask] = useState("SEARCH");
  const [loading, setLoading] = useState(false);

  const { user } = useUser(); // ← auth check
  const isAuthenticated = !!user;
  const { usage } = useUsage();
  const tokenWarning = useTokenWarning(userInput, usage);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { setPendingSearch } = useSearchStore();
  const textareaRef = useRef(null);
  const hasInput = userInput.trim().length > 0;

  // Border only reacts to token status when authenticated
  const borderClass = isAuthenticated
    ? getStatusBorderClass(tokenWarning.status)
    : "border-gray-200";

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [userInput]);

  const handleSearch = () => {
    const trimmed = userInput.trim();
    if (!trimmed || tokenWarning.status === "blocked") return;
    setLoading(true);
    const libId = uuidv4();
    setPendingSearch(trimmed, SEARCH_TYPE_MAP[activeTask] ?? "search");
    startTransition(() => router.push(`/search/${libId}`));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen justify-center px-3 sm:px-4">
      <Image
        src="/Perplexity_AI_logo.svg"
        alt="Perplexity clone logo"
        width={180}
        height={150}
        className="w-28 sm:w-48 md:w-64 h-auto"
        style={{ height: "auto" }}
        priority
      />

      <div
        className={`p-3 sm:p-5 w-full max-w-2xl border rounded-2xl mt-6 sm:mt-10 overflow-visible transition-colors duration-300 ${borderClass}`}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={userInput}
          placeholder={
            activeTask === "RESEARCH" ? "Research anything…" : "Ask anything…"
          }
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full resize-none text-base sm:text-xl px-1 py-1 pb-3 outline-none bg-transparent leading-6 overflow-y-auto placeholder:text-gray-400"
        />

        <div className="h-px bg-gray-100 mb-3" />

        {/* Only renders for signed-in users */}
        <TokenWarningBanner
          warning={tokenWarning}
          show={hasInput}
          isAuthenticated={isAuthenticated}
          className="mb-2"
        />

        {/* Desktop toolbar */}
        <div className="hidden sm:flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <TaskPicker value={activeTask} onChange={setActiveTask} />
            <div className="w-px h-4 bg-gray-200 shrink-0" aria-hidden />
            <ModelSelect activeTask={activeTask} />
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <UsageBadge usage={usage} />
            <div className="w-px h-4 bg-gray-200 mx-1.5 shrink-0" aria-hidden />
            <IconBtn label="Attach file">
              <Paperclip className="h-4 w-4" />
            </IconBtn>
            <IconBtn label="Voice input">
              <Mic className="h-4 w-4" />
            </IconBtn>
            <SendBtn
              hasInput={hasInput}
              loading={loading}
              onClick={handleSearch}
            />
          </div>
        </div>

        {/* Mobile toolbar */}
        <div className="flex sm:hidden flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <TaskPicker value={activeTask} onChange={setActiveTask} />
            <div className="w-px h-4 bg-gray-200 shrink-0" aria-hidden />
            <ModelSelect activeTask={activeTask} mobileCompact />
          </div>
          <div className="flex items-center justify-between">
            <UsageBadge usage={usage} mobileCompact />
            <div className="flex items-center gap-1">
              <IconBtn label="Attach file">
                <Paperclip className="h-4 w-4" />
              </IconBtn>
              <IconBtn label="Voice input">
                <Mic className="h-4 w-4" />
              </IconBtn>
              <SendBtn
                hasInput={hasInput}
                loading={loading}
                onClick={handleSearch}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
