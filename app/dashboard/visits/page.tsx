"use client"
import { DashboardHeader } from "@/components/dashboard-header"
import { VisitsCalendar } from "@/components/visits-calendar"
import { VisitsList } from "@/components/visits-list"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDataStore } from "@/lib/data-store"
import { Plus, Calendar, List } from "lucide-react"
import Link from "next/link"

export default function VisitsPage() {
  const { visits } = useDataStore()
  const upcomingCount = visits.filter((v) => v.status === "scheduled" || v.status === "confirmed").length

  return (
    <div className="flex flex-col">
      <DashboardHeader
        title="Visits & Appointments"
        description={`${upcomingCount} upcoming visits scheduled`}
        actions={
          <Link href="/dashboard/visits/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Visit
            </Button>
          </Link>
        }
      />

      <div className="flex-1 p-6">
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              List View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-6">
            <VisitsCalendar />
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <VisitsList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
