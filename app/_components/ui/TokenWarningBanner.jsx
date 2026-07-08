// components/ui/TokenWarningBanner.jsx
import { STATUS_TEXT_CLASS } from "@/lib/Usageutils"   // ← no more inline COLOR map

/**
 * Live token estimator banner — shown while the user is typing.
 * Only renders for authenticated users (they're the only ones with a quota).
 */
export function TokenWarningBanner({ warning, show, isAuthenticated, className = "" }) {
  if (!show || !isAuthenticated) return null

  let text
  if (warning.status === "blocked") {
    text = "You're out of tokens for today — this won't send until your quota resets."
  } else if (warning.status !== "ok") {
    text = `Heads up — this uses ~${warning.estimated} of your ${warning.remaining} remaining tokens.`
  } else {
    text = `~${warning.estimated} tokens`
  }

  return (
    <p className={`text-xs px-1 transition-colors duration-300 ${STATUS_TEXT_CLASS[warning.status]} ${className}`}>
      {text}
    </p>
  )
}