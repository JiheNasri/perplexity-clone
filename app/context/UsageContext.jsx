"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"

const UsageContext = createContext(null)

export function UsageProvider({ children }) {
  const { user } = useUser()
  const pathname = usePathname()
  const [usage, setUsage] = useState(null)

  const refreshUsage = useCallback(() => {
    if (!user) return
    fetch("/api/usage/me")
      .then((r) => r.json())
      .then(setUsage)
      .catch(() => {})
  }, [user])

  useEffect(() => {
    refreshUsage()
  }, [pathname, refreshUsage])

  return (
    <UsageContext.Provider value={{ usage, refreshUsage }}>
      {children}
    </UsageContext.Provider>
  )
}

export function useUsage() {
  return useContext(UsageContext)
}