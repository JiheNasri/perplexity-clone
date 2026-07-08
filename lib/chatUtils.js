// lib/chatUtils.js

export function extractFollowUps(markdown = "") {
  const match = markdown.match(/##\s*Related Questions\s*\n([\s\S]*?)(?=\n##|$)/i)
  if (!match) return { cleanAnswer: markdown, followUps: [] }

  const followUps = match[1]
    .split("\n")
    .map((l) => l.replace(/^[-*\d.]\s*/, "").trim())
    .filter(Boolean)

  const cleanAnswer = markdown
    .replace(/##\s*Related Questions[\s\S]*$/i, "")
    .trimEnd()

  return { cleanAnswer, followUps }
}

export function mergeChats(dbChats, localChats) {
  const seen   = new Set()
  const result = []
  for (const c of dbChats) {
    const k = c.id ?? c.userSearchInput
    if (!seen.has(k)) { seen.add(k); result.push(c) }
  }
  for (const c of localChats) {
    if (!dbChats.some((d) => d.userSearchInput === c.userSearchInput))
      result.push(c)
  }
  return result
}

export function describeSaveError(error) {
  return error?.message || error?.details || error?.hint || error?.code || "Unknown save issue"
}

export function getResetTime() {
  const d = new Date()
  d.setHours(d.getHours() + 1, 0, 0, 0)
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}