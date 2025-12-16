"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useDataStore } from "@/lib/data-store"
import { generateFollowUpSuggestions } from "@/lib/follow-up-engine"
import {
  Sun,
  CloudSun,
  Moon,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Mail,
  Phone,
  Euro,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function MorningBriefing() {
  const [dismissed, setDismissed] = useState(false)
  const { deals, emails, visits, tasks, contacts, properties, commissions } = useDataStore()

  const briefing = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().split("T")[0]
    const hour = now.getHours()

    // Get greeting based on time
    let greeting = "Bonjour"
    let icon = Sun
    if (hour >= 12 && hour < 18) {
      greeting = "Bon après-midi"
      icon = CloudSun
    } else if (hour >= 18) {
      greeting = "Bonsoir"
      icon = Moon
    }

    // Today's visits
    const todaysVisits = visits.filter(
      (v) => v.date === today && (v.status === "scheduled" || v.status === "confirmed"),
    )

    // Unread emails
    const unreadEmails = emails.filter((e) => e.status === "unread" && e.folder === "inbox")
    const hotLeadEmails = unreadEmails.filter((e) => {
      if (!e.relatedTo || e.relatedTo.type !== "contact") return false
      return deals.some((d) => d.contactId === e.relatedTo?.id && d.stage !== "closed")
    })

    // Pending tasks
    const pendingTasks = tasks.filter(
      (t) => (t.status === "todo" || t.status === "in_progress") && t.dueDate && t.dueDate <= today,
    )
    const overdueTasks = pendingTasks.filter((t) => t.dueDate && t.dueDate < today)

    // AI suggestions
    const suggestions = generateFollowUpSuggestions(deals, emails, visits, tasks, contacts, properties)
    const urgentSuggestions = suggestions.filter((s) => s.priority === "urgent")

    // Pipeline stats
    const activeDeals = deals.filter((d) => d.status !== "closed")
    const pipelineValue = activeDeals.reduce((sum, d) => sum + (d.value || 0), 0)

    // This month's commissions
    const thisMonth = now.toISOString().slice(0, 7)
    const monthlyCommissions = commissions
      .filter((c) => c.status === "paid" && c.paidDate?.startsWith(thisMonth))
      .reduce((sum, c) => sum + c.amount, 0)
    const pendingCommissions = commissions.filter((c) => c.status === "pending").reduce((sum, c) => sum + c.amount, 0)

    // Deals close to closing
    const dealsNearClose = deals.filter((d) => d.stage === "contract" || d.stage === "negotiation")

    // Calculate week-over-week change (simplified)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const newLeadsThisWeek = deals.filter((d) => new Date(d.createdAt) >= weekAgo).length
    const trend = newLeadsThisWeek > 2 ? "up" : newLeadsThisWeek < 1 ? "down" : "stable"

    return {
      greeting,
      GreetingIcon: icon,
      todaysVisits,
      unreadEmails,
      hotLeadEmails,
      pendingTasks,
      overdueTasks,
      urgentSuggestions,
      activeDeals,
      pipelineValue,
      monthlyCommissions,
      pendingCommissions,
      dealsNearClose,
      trend,
      newLeadsThisWeek,
    }
  }, [deals, emails, visits, tasks, contacts, properties, commissions])

  if (dismissed) return null

  const priorityItems = []

  // Build priority list
  if (briefing.urgentSuggestions.length > 0) {
    priorityItems.push({
      type: "urgent",
      label: `${briefing.urgentSuggestions.length} relance(s) urgente(s)`,
      link: "/dashboard/pipeline",
      icon: AlertTriangle,
    })
  }
  if (briefing.overdueTasks.length > 0) {
    priorityItems.push({
      type: "overdue",
      label: `${briefing.overdueTasks.length} tâche(s) en retard`,
      link: "/dashboard/tasks",
      icon: Clock,
    })
  }
  if (briefing.hotLeadEmails.length > 0) {
    priorityItems.push({
      type: "hot",
      label: `${briefing.hotLeadEmails.length} email(s) de leads actifs`,
      link: "/dashboard/email",
      icon: Mail,
    })
  }
  if (briefing.dealsNearClose.length > 0) {
    priorityItems.push({
      type: "closing",
      label: `${briefing.dealsNearClose.length} dossier(s) proche(s) de la signature`,
      link: "/dashboard/pipeline",
      icon: CheckCircle2,
    })
  }

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      {/* Dismiss button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-foreground"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>

      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Greeting & Summary */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <briefing.GreetingIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{briefing.greeting}, Sarah</h2>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString("fr-LU", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
            </div>

            {/* Today's highlights */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{briefing.todaysVisits.length}</strong> visite(s) aujourd'hui
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{briefing.unreadEmails.length}</strong> email(s) non lu(s)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{briefing.pendingTasks.length}</strong> tâche(s) à faire
                </span>
              </div>
            </div>

            {/* Priority items */}
            {priorityItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Priorités du jour</p>
                <div className="flex flex-wrap gap-2">
                  {priorityItems.map((item, i) => (
                    <Link key={i} href={item.link}>
                      <Badge
                        variant="outline"
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-muted gap-1.5 py-1",
                          item.type === "urgent" && "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
                          item.type === "overdue" && "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
                          item.type === "hot" && "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100",
                          item.type === "closing" &&
                            "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                        )}
                      >
                        <item.icon className="h-3 w-3" />
                        {item.label}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="flex flex-wrap gap-4 lg:flex-col lg:items-end lg:gap-3">
            {/* Pipeline Value */}
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Pipeline actif</p>
                <p className="text-lg font-bold">{(briefing.pipelineValue / 1000000).toFixed(1)}M €</p>
              </div>
            </div>

            {/* This Month's Commissions */}
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <Euro className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Commissions ce mois</p>
                <p className="text-lg font-bold">{briefing.monthlyCommissions.toLocaleString("fr-LU")} €</p>
              </div>
            </div>

            {/* Pending Commissions */}
            {briefing.pendingCommissions > 0 && (
              <div className="flex items-center gap-3 rounded-lg border border-dashed bg-card/50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">En attente</p>
                  <p className="text-lg font-bold text-amber-600">
                    {briefing.pendingCommissions.toLocaleString("fr-LU")} €
                  </p>
                </div>
              </div>
            )}

            {/* Weekly Trend */}
            <div className="flex items-center gap-2 text-sm">
              {briefing.trend === "up" ? (
                <>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-600">+{briefing.newLeadsThisWeek} nouveaux leads cette semaine</span>
                </>
              ) : briefing.trend === "down" ? (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-red-600">Activité en baisse cette semaine</span>
                </>
              ) : (
                <>
                  <Minus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Activité stable</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-4 border-t flex flex-wrap gap-2">
          <Link href="/dashboard/pipeline">
            <Button size="sm" className="gap-1.5">
              <Sparkles className="h-4 w-4" />
              Voir les suggestions IA
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
          <Link href="/dashboard/email">
            <Button variant="outline" size="sm" className="gap-1.5 bg-transparent">
              <Mail className="h-4 w-4" />
              Ouvrir la boîte mail
            </Button>
          </Link>
          <Link href="/dashboard/visits/new">
            <Button variant="outline" size="sm" className="gap-1.5 bg-transparent">
              <Calendar className="h-4 w-4" />
              Planifier une visite
            </Button>
          </Link>
          <Link href="/dashboard/contacts/new">
            <Button variant="outline" size="sm" className="gap-1.5 bg-transparent">
              <Phone className="h-4 w-4" />
              Nouveau contact
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
