"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useDataStore } from "@/lib/data-store"
import { MapPin, Clock, MoreHorizontal, CheckCircle2, XCircle, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  scheduled: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
}

export function VisitsList() {
  const { visits, getContactById, getPropertyById, updateVisit } = useDataStore()

  const sortedVisits = [...visits].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.startTime}`)
    const dateB = new Date(`${b.date}T${b.startTime}`)
    return dateA.getTime() - dateB.getTime()
  })

  const handleConfirm = (visitId: string) => {
    updateVisit(visitId, { status: "confirmed", confirmationStatus: "confirmed" })
  }

  const handleCancel = (visitId: string) => {
    updateVisit(visitId, { status: "cancelled", confirmationStatus: "declined" })
  }

  const handleComplete = (visitId: string) => {
    updateVisit(visitId, { status: "completed" })
  }

  return (
    <div className="space-y-4">
      {sortedVisits.map((visit) => {
        const contact = getContactById(visit.contactId)
        const property = getPropertyById(visit.propertyId)

        return (
          <Card key={visit.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {contact?.firstName[0]}
                      {contact?.lastName[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-card-foreground">
                        {contact?.firstName} {contact?.lastName}
                      </h3>
                      <Badge className={cn(statusStyles[visit.status], "capitalize")}>{visit.status}</Badge>
                      {visit.confirmationStatus === "pending" && (
                        <Badge variant="outline" className="text-xs">
                          Awaiting confirmation
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {property?.address.street}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {visit.date} at {visit.startTime} - {visit.endTime}
                      </span>
                    </div>

                    {visit.notes && <p className="text-sm text-muted-foreground mt-2 italic">"{visit.notes}"</p>}

                    {visit.feedback && (
                      <div className="mt-3 p-3 rounded-lg bg-muted/50">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Feedback</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Interest Level:</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div
                                key={level}
                                className={cn(
                                  "h-2 w-4 rounded-sm",
                                  level <= visit.feedback!.interestLevel ? "bg-primary" : "bg-muted",
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{visit.feedback.comments}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {visit.status === "scheduled" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 bg-transparent"
                        onClick={() => handleConfirm(visit.id)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Confirm
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-destructive border-destructive/30 bg-transparent"
                        onClick={() => handleCancel(visit.id)}
                      >
                        <XCircle className="h-4 w-4" />
                        Cancel
                      </Button>
                    </>
                  )}
                  {visit.status === "confirmed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 bg-transparent"
                      onClick={() => handleComplete(visit.id)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Complete
                    </Button>
                  )}
                  {visit.status === "completed" && !visit.feedback && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 bg-transparent"
                      onClick={() => toast.info("Feedback capture coming soon.")}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Add Feedback
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toast.info("Visit details coming soon.")}>View Details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info("Reschedule flow coming soon.")}>Reschedule</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info("Reminder sending coming soon.")}>Send Reminder</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => handleCancel(visit.id)}>
                        Cancel Visit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {sortedVisits.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No visits scheduled yet</div>
      )}
    </div>
  )
}
