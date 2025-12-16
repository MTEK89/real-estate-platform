"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useDataStore } from "@/lib/data-store"
import { MapPin, Clock, ChevronRight } from "lucide-react"
import Link from "next/link"

export function UpcomingVisits() {
  const { visits, getContactById, getPropertyById } = useDataStore()

  const upcomingVisits = visits.filter((v) => v.status === "scheduled" || v.status === "confirmed").slice(0, 3)

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h3 className="font-semibold text-card-foreground">Upcoming Visits</h3>
        <Link href="/dashboard/visits">
          <Button variant="ghost" size="sm" className="text-primary">
            View all
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="divide-y">
        {upcomingVisits.map((visit) => {
          const contact = getContactById(visit.contactId)
          const property = getPropertyById(visit.propertyId)
          return (
            <div key={visit.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {contact?.firstName[0]}
                      {contact?.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-card-foreground">
                      {contact?.firstName} {contact?.lastName}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {property?.address.street}
                    </div>
                  </div>
                </div>
                <Badge
                  variant={visit.confirmationStatus === "confirmed" ? "default" : "secondary"}
                  className={
                    visit.confirmationStatus === "confirmed"
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                      : ""
                  }
                >
                  {visit.confirmationStatus}
                </Badge>
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {visit.date} at {visit.startTime}
                </span>
              </div>
            </div>
          )
        })}

        {upcomingVisits.length === 0 && <div className="p-6 text-center text-muted-foreground">No upcoming visits</div>}
      </div>
    </div>
  )
}
