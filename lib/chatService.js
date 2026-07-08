// lib/chatService.js
import { supabase } from "@/app/services/Supabase"

// ── Web search ──────────────────────────────────────────────────────────────

export async function fetchWebSearch(searchInput, searchType) {
  const res = await fetch("/api/web-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ searchInput, searchType }),
  })
  if (!res.ok) {
    const err = new Error(await res.text().catch(() => ""))
    err.status = res.status
    throw err
  }
  const data = await res.json()
  return data?.organic_results ?? []
}

// ── AI streaming ────────────────────────────────────────────────────────────
// Returns { fullText, status } — the caller decides what each status means.

export async function streamChat(payload, onChunk) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!res.ok) return { fullText: "", status: res.status }

  const reader  = res.body.getReader()
  const decoder = new TextDecoder("utf-8", { stream: true })
  let fullText  = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    fullText += decoder.decode(value, { stream: true })
    onChunk(fullText)
  }

  return { fullText, status: 200 }
}

// ── Supabase ────────────────────────────────────────────────────────────────

export async function saveChatIfMissing(payload) {
  const { data: existing, error } = await supabase
    .from("Chats").select("id")
    .eq("libId", payload.libId)
    .eq("userSearchInput", payload.userSearchInput)
    .limit(1)
  if (error || existing?.length) return { error }
  return supabase.from("Chats").insert([payload])
}

export async function saveLibraryIfMissing(payload) {
  const { data: existing, error } = await supabase
    .from("Library").select("id").eq("libId", payload.libId).limit(1)
  if (error || existing?.length) return { error }
  return supabase.from("Library").insert([payload])
}