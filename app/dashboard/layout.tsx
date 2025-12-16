"use client"

import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { DataStoreProvider } from "@/lib/data-store"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DataStoreProvider key="data-store-v2">
      <div className="flex h-dvh min-h-0 overflow-hidden">
        <AppSidebar />
        <main className="min-w-0 flex-1 min-h-0 overflow-auto overscroll-none">{children}</main>
      </div>
    </DataStoreProvider>
  )
}
