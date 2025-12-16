"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Sparkles, TrendingUp, Zap, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { calculateLeadScore, getScoreColor } from "@/lib/lead-scoring"
import type { Contact, Deal, Visit, Task, Email } from "@/lib/mock-data"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ContactLeadScoreProps {
  contact: Contact
  deals: Deal[]
  visits: Visit[]
  tasks: Task[]
  emails: Email[]
}

export function ContactLeadScore({ contact, deals, visits, tasks, emails }: ContactLeadScoreProps) {
  const score = useMemo(() => {
    return calculateLeadScore(contact, deals, visits, tasks, emails)
  }, [contact, deals, visits, tasks, emails])

  const colors = getScoreColor(score.grade)

  const breakdownLabels = [
    { key: "engagement", label: "Engagement", max: 20 },
    { key: "budgetMatch", label: "Budget Match", max: 20 },
    { key: "responseRate", label: "Response Rate", max: 20 },
    { key: "activityLevel", label: "Activity Level", max: 20 },
    { key: "recency", label: "Recency", max: 20 },
  ] as const

  return (
    <Card className={cn("border-l-4", colors.border)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Lead Score
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Lead score is calculated based on engagement, budget match, response rate, activity level, and recency
                  of contact.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Main Score Display */}
        <div className="flex items-center gap-4 mb-4">
          <div className={cn("flex h-16 w-16 items-center justify-center rounded-full", colors.bg)}>
            <span className={cn("text-2xl font-bold", colors.text)}>{score.total}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn("text-lg font-semibold", colors.text)}>{score.label}</span>
              <Badge className={cn(colors.bg, colors.text, "border", colors.border)}>Grade {score.grade}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Out of 100 points</p>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-3">
          {breakdownLabels.map(({ key, label, max }) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">
                  {score.breakdown[key]}/{max}
                </span>
              </div>
              <Progress value={(score.breakdown[key] / max) * 100} className="h-1.5" />
            </div>
          ))}
        </div>

        {/* AI Insights */}
        {score.insights.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI Insights
            </p>
            <ul className="space-y-1">
              {score.insights.map((insight, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <TrendingUp className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
