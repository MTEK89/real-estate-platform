"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Send, Phone, Calendar, ChevronRight, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { generateFollowUpSuggestions, type FollowUpSuggestion } from "@/lib/follow-up-engine"
import type { Contact, Deal, Visit, Task, Email, Property } from "@/lib/mock-data"
import Link from "next/link"

interface ContactAISuggestionsProps {
  contact: Contact
  deals: Deal[]
  visits: Visit[]
  tasks: Task[]
  emails: Email[]
  properties: Property[]
  onSendEmail?: (suggestion: FollowUpSuggestion) => void
}

export function ContactAISuggestions({
  contact,
  deals,
  visits,
  tasks,
  emails,
  properties,
  onSendEmail,
}: ContactAISuggestionsProps) {
  // Filter deals related to this contact
  const contactDeals = deals.filter((d) => d.buyerId === contact.id)

  // Generate suggestions only for this contact's deals
  const suggestions = useMemo(() => {
    if (contactDeals.length === 0) return []

    const allSuggestions = generateFollowUpSuggestions(contactDeals, emails, visits, tasks, [contact], properties)

    return allSuggestions.slice(0, 3)
  }, [contactDeals, emails, visits, tasks, contact, properties])

  const priorityStyles = {
    urgent: "bg-red-100 text-red-700 border-red-200",
    high: "bg-amber-100 text-amber-700 border-amber-200",
    medium: "bg-blue-100 text-blue-700 border-blue-200",
    low: "bg-slate-100 text-slate-700 border-slate-200",
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <Sparkles className="h-8 w-8 text-emerald-500/50" />
            <p className="text-sm text-muted-foreground mt-2 text-center">
              No follow-ups needed. This contact is up to date!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Suggestions
          <Badge variant="secondary">{suggestions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={cn(
              "p-3 rounded-lg border-l-4",
              suggestion.priority === "urgent"
                ? "border-l-red-500 bg-red-50/50"
                : suggestion.priority === "high"
                  ? "border-l-amber-500 bg-amber-50/50"
                  : "border-l-blue-500 bg-blue-50/50",
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-xs", priorityStyles[suggestion.priority])}>
                  {suggestion.priority}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {suggestion.daysSinceLastContact}d ago
                </span>
              </div>
            </div>
            <p className="text-sm font-medium mb-1">{suggestion.reason}</p>
            <p className="text-xs text-muted-foreground mb-3">{suggestion.suggestedAction}</p>
            <div className="flex items-center gap-2">
              {suggestion.type === "email" && (
                <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => onSendEmail?.(suggestion)}>
                  <Send className="h-3 w-3" />
                  Send Email
                </Button>
              )}
              {suggestion.type === "call" && (
                <Button size="sm" className="h-7 gap-1 text-xs" asChild>
                  <a href={`tel:${contact.phone}`}>
                    <Phone className="h-3 w-3" />
                    Call
                  </a>
                </Button>
              )}
              {suggestion.type === "visit" && (
                <Button size="sm" className="h-7 gap-1 text-xs" asChild>
                  <Link href={`/dashboard/visits/new?contactId=${contact.id}`}>
                    <Calendar className="h-3 w-3" />
                    Schedule
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ))}
        <Link href="/dashboard/pipeline">
          <Button variant="ghost" size="sm" className="w-full mt-2 gap-1">
            View in Pipeline
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
