// components/ui/TokenWarningBanner.jsx

const COLOR = {
  blocked: "text-red-500",
  danger:  "text-red-400",
  warning: "text-amber-600",
  ok:      "text-gray-400",
}

export function TokenWarningBanner({ warning, show, isAuthenticated, className = "" }) {
  // Guests have no quota — nothing to show them
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
    <p className={`text-xs px-1 transition-colors duration-300 ${COLOR[warning.status]} ${className}`}>
      {text}
    </p>
  )
}