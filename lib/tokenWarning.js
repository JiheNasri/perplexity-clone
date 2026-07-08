const BORDER = {
  ok:      "border-gray-200",
  warning: "border-amber-400",
  danger:  "border-red-400",
  blocked: "border-red-500",
}

export function getStatusBorderClass(status) {
  return BORDER[status] ?? BORDER.ok
}