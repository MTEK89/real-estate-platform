"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { NotificationPanel } from "@/components/notification-panel"
import { GlobalSearch } from "@/components/global-search"

interface DashboardHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function DashboardHeader({ title, description, actions }: DashboardHeaderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      <div className="flex items-center gap-4">
        {mounted ? (
          <>
            <GlobalSearch />
            <NotificationPanel />
          </>
        ) : null}
        {mounted ? actions : null}
      </div>
    </header>
  )
}
