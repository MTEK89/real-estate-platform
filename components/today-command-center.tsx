"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AIActionCard } from "@/components/ai-action-card"
import { useDataStore } from "@/lib/data-store"
import { generateFollowUpSuggestions } from "@/lib/follow-up-engine"
import { Sparkles, AlertTriangle, Clock, CheckCircle2, TrendingUp, Calendar, Mail, ArrowRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function TodayCommandCenter() {
  const {
    deals,
    emails,
    visits,
    tasks,
    contacts,
    properties,
    getContactById,
    getPropertyById,
    addEmail,
    completeTask,
  } = useDataStore()

  // Generate AI suggestions
  const suggestions = useMemo(() => {
    return generateFollowUpSuggestions(deals, emails, visits, tasks, contacts, properties)
  }, [deals, emails, visits, tasks, contacts, properties])

  // Count by priority
  const urgentCount = suggestions.filter((s) => s.priority === "urgent").length
  const highCount = suggestions.filter((s) => s.priority === "high").length
  const totalActions = suggestions.length

  // Get today's visits
  const today = new Date().toISOString().split("T")[0]
  const todaysVisits = visits
    .filter((v) => v.date === today && (v.status === "scheduled" || v.status === "confirmed"))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  // Get pending tasks for today
  const todaysTasks = tasks
    .filter((t) => (t.status === "todo" || t.status === "in_progress") && t.dueDate === today)
    .slice(0, 5)

  const handleSendEmail = (dealId: string, subject: string, body: string) => {
    const deal = deals.find((d) => d.id === dealId)
    if (!deal) return

    const contact = getContactById(deal.buyerId)
    if (!contact) return

    addEmail({
      subject,
      body,
      preview: body.slice(0, 100),
      from: { name: "Sarah Martin", email: "sarah@propflow.com" },
      to: [{ name: `${contact.firstName} ${contact.lastName}`, email: contact.email || "" }],
      cc: [],
      bcc: [],
      date: new Date().toISOString(),
      status: "sent",
      folder: "sent",
      starred: false,
      hasAttachments: false,
      labels: [],
      relatedTo: { type: "deal", id: dealId },
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className={cn(urgentCount > 0 && "border-red-200 bg-red-50/50")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  urgentCount > 0 ? "bg-red-100" : "bg-muted",
                )}
              >
                <AlertTriangle className={cn("h-5 w-5", urgentCount > 0 ? "text-red-600" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="text-2xl font-bold">{urgentCount}</p>
                <p className="text-xs text-muted-foreground">Urgent Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(highCount > 0 && "border-amber-200 bg-amber-50/50")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  highCount > 0 ? "bg-amber-100" : "bg-muted",
                )}
              >
                <Clock className={cn("h-5 w-5", highCount > 0 ? "text-amber-600" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="text-2xl font-bold">{highCount}</p>
                <p className="text-xs text-muted-foreground">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <Calendar className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todaysVisits.length}</p>
                <p className="text-xs text-muted-foreground">Visits Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{deals.filter((d) => d.status !== "closed").length}</p>
                <p className="text-xs text-muted-foreground">Active Deals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* AI Suggested Actions - Main Focus */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">AI Suggested Actions</h2>
              <Badge variant="secondary">{totalActions} actions</Badge>
            </div>
            <Link href="/dashboard/pipeline">
              <Button variant="ghost" size="sm" className="gap-1">
                View Pipeline
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {suggestions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
                <h3 className="font-semibold text-lg">All caught up!</h3>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  No urgent follow-ups needed. Great job staying on top of your deals!
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {suggestions.slice(0, 10).map((suggestion) => {
                  const deal = deals.find((d) => d.id === suggestion.dealId)
                  if (!deal) return null

                  const contact = getContactById(deal.buyerId)
                  const property = getPropertyById(deal.propertyId)
                  if (!contact || !property) return null

                  return (
                    <AIActionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      contact={contact}
                      property={property}
                      deal={deal}
                      onSendEmail={(subject, body) => handleSendEmail(deal.id, subject, body)}
                      onScheduleCall={() => {
                        window.location.href = `tel:${contact.phone}`
                      }}
                      onScheduleVisit={() => {
                        window.location.href = `/dashboard/visits/new?contactId=${contact.id}&propertyId=${property.id}`
                      }}
                      onDismiss={() => {}}
                      onComplete={() => {}}
                    />
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Right Sidebar - Today's Schedule */}
        <div className="space-y-4">
          {/* Today's Visits */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-primary" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todaysVisits.length === 0 ? (
                <div className="text-center py-6">
                  <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">No visits scheduled</p>
                </div>
              ) : (
                todaysVisits.map((visit) => {
                  const contact = getContactById(visit.contactId)
                  const property = getPropertyById(visit.propertyId)
                  return (
                    <div
                      key={visit.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                        <span className="text-xs font-medium text-primary">
                          {visit.startTime.split(":")[0]}:{visit.startTime.split(":")[1]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {contact?.firstName} {contact?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{property?.address.street}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs shrink-0",
                          visit.confirmationStatus === "confirmed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200",
                        )}
                      >
                        {visit.confirmationStatus}
                      </Badge>
                    </div>
                  )
                })
              )}
              <Link href="/dashboard/visits">
                <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                  View All Visits
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Today's Tasks */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Due Today
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {todaysTasks.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">No tasks due today</p>
                </div>
              ) : (
                todaysTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 shrink-0 rounded-full bg-transparent"
                      onClick={() => completeTask(task.id)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-sm truncate flex-1">{task.title}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs shrink-0",
                        task.priority === "urgent"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : task.priority === "high"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-50 text-slate-700 border-slate-200",
                      )}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                ))
              )}
              <Link href="/dashboard/tasks">
                <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                  View All Tasks
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4 text-primary" />
                Inbox
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Unread emails</span>
                <Badge variant="secondary">
                  {emails.filter((e) => e.status === "unread" && e.folder === "inbox").length}
                </Badge>
              </div>
              <Link href="/dashboard/email">
                <Button variant="outline" size="sm" className="w-full mt-3 bg-transparent">
                  Open Inbox
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
