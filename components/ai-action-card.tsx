"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import {
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Send,
  Edit3,
  Building2,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { FollowUpSuggestion } from "@/lib/follow-up-engine"
import type { Contact, Property, Deal } from "@/lib/mock-data"

interface AIActionCardProps {
  suggestion: FollowUpSuggestion
  contact: Contact
  property: Property
  deal: Deal
  onSendEmail: (subject: string, body: string) => void
  onScheduleCall: () => void
  onScheduleVisit: () => void
  onDismiss: () => void
  onComplete: () => void
}

export function AIActionCard({
  suggestion,
  contact,
  property,
  deal,
  onSendEmail,
  onScheduleCall,
  onScheduleVisit,
  onDismiss,
  onComplete,
}: AIActionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [emailSubject, setEmailSubject] = useState(suggestion.suggestedSubject || "")
  const [emailBody, setEmailBody] = useState(suggestion.suggestedBody || "")

  const priorityStyles = {
    urgent: {
      border: "border-l-4 border-l-red-500",
      badge: "bg-red-100 text-red-700 border-red-200",
      icon: "text-red-500",
    },
    high: {
      border: "border-l-4 border-l-amber-500",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      icon: "text-amber-500",
    },
    medium: {
      border: "border-l-4 border-l-blue-500",
      badge: "bg-blue-100 text-blue-700 border-blue-200",
      icon: "text-blue-500",
    },
    low: {
      border: "border-l-4 border-l-slate-300",
      badge: "bg-slate-100 text-slate-700 border-slate-200",
      icon: "text-slate-400",
    },
  }

  const style = priorityStyles[suggestion.priority]

  const handleSendEmail = () => {
    onSendEmail(emailSubject, emailBody)
    onComplete()
  }

  return (
    <Card className={cn("transition-all hover:shadow-md", style.border)}>
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {contact.firstName[0]}
              {contact.lastName[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {contact.firstName} {contact.lastName}
                </span>
                <Badge variant="outline" className={cn("text-xs", style.badge)}>
                  {suggestion.priority === "urgent" ? "Urgent" : suggestion.priority === "high" ? "High" : "Medium"}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{suggestion.daysSinceLastContact}d ago</span>
              </div>
            </div>

            {/* Suggestion Reason with AI indicator */}
            <div className="flex items-center gap-1.5 mt-1">
              <Sparkles className={cn("h-3.5 w-3.5", style.icon)} />
              <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
            </div>

            {/* Property Info */}
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span>{property.address.street}</span>
              <span className="text-muted-foreground/50">|</span>
              <span className="capitalize">{deal.status}</span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 mt-3">
              {suggestion.type === "email" && (
                <Button
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => {
                    if (isExpanded) {
                      handleSendEmail()
                    } else {
                      setIsExpanded(true)
                    }
                  }}
                >
                  <Send className="h-3.5 w-3.5" />
                  {isExpanded ? "Send Email" : "Quick Email"}
                </Button>
              )}
              {suggestion.type === "call" && (
                <Button size="sm" className="h-8 gap-1.5" onClick={onScheduleCall}>
                  <Phone className="h-3.5 w-3.5" />
                  Call Now
                </Button>
              )}
              {suggestion.type === "visit" && (
                <Button size="sm" className="h-8 gap-1.5" onClick={onScheduleVisit}>
                  <Calendar className="h-3.5 w-3.5" />
                  Schedule Visit
                </Button>
              )}
              <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-transparent" onClick={onComplete}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Done
              </Button>
              <Button size="sm" variant="ghost" className="h-8 ml-auto" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Expanded Email Editor */}
        {isExpanded && suggestion.type === "email" && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Email Preview</span>
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => setIsEditing(!isEditing)}>
                <Edit3 className="h-3 w-3" />
                {isEditing ? "Preview" : "Edit"}
              </Button>
            </div>

            {isEditing ? (
              <>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                  placeholder="Subject"
                />
                <Textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="min-h-[150px] text-sm"
                  placeholder="Email body..."
                />
              </>
            ) : (
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium">{emailSubject}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{emailBody}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
