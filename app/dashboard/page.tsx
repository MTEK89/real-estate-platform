"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { useDataStore } from "@/lib/data-store"
import { TodayCommandCenter } from "@/components/today-command-center"
import { MorningBriefing } from "@/components/morning-briefing"

export default function DashboardPage() {
  const { properties, contacts, visits, deals, commissions } = useDataStore()

  // Calculate live stats from data store
  const activeListings = properties.filter((p) => p.status === "published").length
  const totalContacts = contacts.length
  const upcomingVisitsCount = visits.filter((v) => v.status === "scheduled" || v.status === "confirmed").length
  const activeDeals = deals.filter((d) => d.status !== "closed").length
  const pipelineValue = deals.filter((d) => d.status !== "closed").reduce((sum, d) => sum + (d.priceOffered || 0), 0)
  const monthlyRevenue = commissions.filter((c) => c.status === "paid").reduce((sum, c) => sum + c.amount, 0)
  const closedDeals = deals.filter((d) => d.status === "closed").length
  const conversionRate = deals.length > 0 ? Math.round((closedDeals / deals.length) * 100) : 0

  return (
    <div className="flex flex-col">
      <DashboardHeader
        title="Today"
        description="Votre centre de commande IA. Voici ce qui nécessite votre attention."
      />

      <div className="flex-1 p-6 space-y-6">
        <MorningBriefing />

        <TodayCommandCenter />
      </div>
    </div>
  )
}
