export function estimateTokens(text) {
  if (!text) return 0
  return Math.ceil(text.length / 4)
}