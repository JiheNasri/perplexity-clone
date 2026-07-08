// lib/usageUtils.js
// Single source of truth for usage status thresholds and colors.
// UsageBadge, TokenWarningBanner, tokenWarning.js all derive from here.

export const PRIMARY = "oklch(0.5161 0.0817 211.9)"

export const WARN_AT   = 65   // % of total limit
export const DANGER_AT = 90   // % of total limit

// ─── Status resolver ──────────────────────────────────────────────────────────

/**
 * Resolves a usage status from used + limit values.
 * Used by UsageBadge (static) and useTokenWarning (live estimate).
 *
 * @param {number} used
 * @param {number} limit
 * @returns {{ status: "ok"|"warning"|"danger"|"blocked", pct: number, remaining: number }}
 */
export function getUsageStatus(used, limit) {
  const remaining = limit - used
  const pct       = limit > 0 ? Math.round((used / limit) * 100) : 0

  if (remaining <= 0)      return { status: "blocked", pct: 100, remaining: 0 }
  if (pct >= DANGER_AT)    return { status: "danger",  pct, remaining }
  if (pct >= WARN_AT)      return { status: "warning", pct, remaining }
  return                          { status: "ok",      pct, remaining }
}

// ─── Shared color maps ────────────────────────────────────────────────────────
// Every component reads from here — no inline color strings anywhere else.

/** Tailwind text classes — used by TokenWarningBanner */
export const STATUS_TEXT_CLASS = {
  ok:      "text-gray-400",
  warning: "text-amber-600",
  danger:  "text-red-400",
  blocked: "text-red-500",
}

/** Tailwind border classes — used by ChatInputBox + DisplayResult */
export const STATUS_BORDER_CLASS = {
  ok:      "border-gray-200",
  warning: "border-amber-400",
  danger:  "border-red-400",
  blocked: "border-red-500",
}

/** CSS color values — used by UsageBadge bars + dots */
export const STATUS_BAR_COLOR = {
  ok:      PRIMARY,
  warning: "#f59e0b",
  danger:  "#ef4444",
  blocked: "#ef4444",
}

/** Convenience getter — replaces getStatusBorderClass in lib/tokenWarning.js */
export function getStatusBorderClass(status) {
  return STATUS_BORDER_CLASS[status] ?? STATUS_BORDER_CLASS.ok
}