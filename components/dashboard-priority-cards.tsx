"use client"

import { useDataStore } from "@/lib/data-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Mail, CheckSquare, Calendar, ChevronRight, Clock, MapPin, Star } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function DashboardPriorityCards() {
  const { emails, tasks, visits, getContactById, getPropertyById, completeTask } = useDataStore()

  // Get unread emails
  const unreadEmails = emails.filter((e) => e.status === "unread" && e.folder === "inbox").slice(0, 3)

  // Get pending tasks sorted by priority
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
  const pendingTasks = tasks
    .filter((t) => t.status === "todo" || t.status === "in_progress")
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 4)

  // Get today's visits
  const today = new Date().toISOString().split("T")[0]
  const todaysVisits = visits
    .filter((v) => v.date === today && (v.status === "scheduled" || v.status === "confirmed"))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? "PM" : "AM"}`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200"
      case "medium":
        return "bg-blue-100 text-blue-700 border-blue-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Unread Emails */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Mail className="h-5 w-5 text-primary" />
            New Emails
            {unreadEmails.length > 0 && (
              <Badge variant="default" className="ml-1">
                {unreadEmails.length}
              </Badge>
            )}
          </CardTitle>
          <Link href="/dashboard/email">
            <Button variant="ghost" size="sm">
              View all
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {unreadEmails.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <Mail className="h-10 w-10 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">No unread emails</p>
            </div>
          ) : (
            unreadEmails.map((email) => (
              <Link
                key={email.id}
                href="/dashboard/email"
                className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {email.from.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{email.from.name}</span>
                    {email.starred && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                  </div>
                  <p className="text-sm font-medium truncate">{email.subject}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{email.preview}</p>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      {/* Pending Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CheckSquare className="h-5 w-5 text-primary" />
            Priority Tasks
            {pendingTasks.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingTasks.length}
              </Badge>
            )}
          </CardTitle>
          <Link href="/dashboard/tasks">
            <Button variant="ghost" size="sm">
              View all
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {pendingTasks.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckSquare className="h-10 w-10 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">All tasks completed!</p>
            </div>
          ) : (
            pendingTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 rounded-lg border p-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 shrink-0 rounded-full bg-transparent"
                  onClick={() => completeTask(task.id)}
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                </Button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={cn("text-xs", getPriorityColor(task.priority))}>
                      {task.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {task.dueDate}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Today's Visits */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Calendar className="h-5 w-5 text-primary" />
            Today's Visits
            {todaysVisits.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {todaysVisits.length}
              </Badge>
            )}
          </CardTitle>
          <Link href="/dashboard/visits">
            <Button variant="ghost" size="sm">
              View all
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {todaysVisits.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">No visits scheduled today</p>
            </div>
          ) : (
            todaysVisits.map((visit) => {
              const contact = getContactById(visit.contactId)
              const property = getPropertyById(visit.propertyId)
              return (
                <div key={visit.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <span className="text-sm font-bold text-primary">{formatTime(visit.startTime).split(" ")[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {contact?.firstName} {contact?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {property?.address.street}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge
                        variant={visit.confirmationStatus === "confirmed" ? "default" : "secondary"}
                        className={cn(
                          "text-xs",
                          visit.confirmationStatus === "confirmed" && "bg-emerald-100 text-emerald-700",
                        )}
                      >
                        {visit.confirmationStatus}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {visit.startTime} - {visit.endTime}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
