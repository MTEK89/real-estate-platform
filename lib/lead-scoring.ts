// Lead scoring engine based on contact behavior and engagement

import type { Contact, Deal, Visit, Task, Email } from "./mock-data"

export interface LeadScore {
  total: number
  grade: "A" | "B" | "C" | "D" | "F"
  label: string
  breakdown: {
    engagement: number
    budgetMatch: number
    responseRate: number
    activityLevel: number
    recency: number
  }
  insights: string[]
}

export function calculateLeadScore(
  contact: Contact,
  deals: Deal[],
  visits: Visit[],
  tasks: Task[],
  emails: Email[],
): LeadScore {
  const breakdown = {
    engagement: 0,
    budgetMatch: 0,
    responseRate: 0,
    activityLevel: 0,
    recency: 0,
  }
  const insights: string[] = []

  // Engagement Score (0-20)
  // Based on number of interactions
  const totalInteractions = deals.length + visits.length
  if (totalInteractions >= 5) {
    breakdown.engagement = 20
    insights.push("Highly engaged with multiple interactions")
  } else if (totalInteractions >= 3) {
    breakdown.engagement = 15
  } else if (totalInteractions >= 1) {
    breakdown.engagement = 10
  } else {
    breakdown.engagement = 5
    insights.push("Low engagement - consider outreach")
  }

  // Budget Match Score (0-20)
  // Based on deal values and property interests
  const hasHighValueDeal = deals.some((d) => (d.priceOffered || 0) > 500000)
  const hasActiveDeal = deals.some((d) => d.status !== "closed" && d.status !== "lost")
  if (hasHighValueDeal) {
    breakdown.budgetMatch = 20
    insights.push("High-value prospect")
  } else if (hasActiveDeal) {
    breakdown.budgetMatch = 15
  } else if (deals.length > 0) {
    breakdown.budgetMatch = 10
  } else {
    breakdown.budgetMatch = 5
  }

  // Response Rate Score (0-20)
  // Based on email interactions
  const sentEmails = emails.filter((e) => e.to.some((t) => t.email === contact.email))
  const receivedEmails = emails.filter((e) => e.from.email === contact.email)
  const responseRatio = sentEmails.length > 0 ? receivedEmails.length / sentEmails.length : 0
  if (responseRatio >= 0.5) {
    breakdown.responseRate = 20
    insights.push("Excellent response rate")
  } else if (responseRatio >= 0.3) {
    breakdown.responseRate = 15
  } else if (responseRatio > 0) {
    breakdown.responseRate = 10
  } else if (sentEmails.length === 0) {
    breakdown.responseRate = 10 // No emails sent yet
  } else {
    breakdown.responseRate = 5
    insights.push("Low response rate - try different approach")
  }

  // Activity Level Score (0-20)
  // Based on visits and completed tasks
  const completedVisits = visits.filter((v) => v.status === "completed").length
  const scheduledVisits = visits.filter((v) => v.status === "scheduled" || v.status === "confirmed").length
  if (completedVisits >= 3) {
    breakdown.activityLevel = 20
    insights.push("Very active - multiple property visits")
  } else if (completedVisits >= 1 || scheduledVisits >= 1) {
    breakdown.activityLevel = 15
  } else if (visits.length > 0) {
    breakdown.activityLevel = 10
  } else {
    breakdown.activityLevel = 5
  }

  // Recency Score (0-20)
  // Based on last contact date
  const lastContact = contact.lastContactAt ? new Date(contact.lastContactAt) : null
  const daysSinceContact = lastContact
    ? Math.floor((new Date().getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
    : 999

  if (daysSinceContact <= 3) {
    breakdown.recency = 20
    insights.push("Recently contacted - hot lead")
  } else if (daysSinceContact <= 7) {
    breakdown.recency = 15
  } else if (daysSinceContact <= 14) {
    breakdown.recency = 10
    insights.push("Contact needed within a week")
  } else if (daysSinceContact <= 30) {
    breakdown.recency = 5
    insights.push("Contact overdue - risk of losing interest")
  } else {
    breakdown.recency = 0
    insights.push("Cold lead - immediate re-engagement needed")
  }

  // Calculate total
  const total =
    breakdown.engagement + breakdown.budgetMatch + breakdown.responseRate + breakdown.activityLevel + breakdown.recency

  // Determine grade and label
  let grade: LeadScore["grade"]
  let label: string

  if (total >= 80) {
    grade = "A"
    label = "Hot Lead"
  } else if (total >= 60) {
    grade = "B"
    label = "Warm Lead"
  } else if (total >= 40) {
    grade = "C"
    label = "Qualified"
  } else if (total >= 20) {
    grade = "D"
    label = "Nurturing"
  } else {
    grade = "F"
    label = "Cold"
  }

  return {
    total,
    grade,
    label,
    breakdown,
    insights: insights.slice(0, 3), // Max 3 insights
  }
}

export function getScoreColor(grade: LeadScore["grade"]) {
  switch (grade) {
    case "A":
      return {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        border: "border-emerald-200",
        fill: "fill-emerald-500",
      }
    case "B":
      return {
        bg: "bg-blue-100",
        text: "text-blue-700",
        border: "border-blue-200",
        fill: "fill-blue-500",
      }
    case "C":
      return {
        bg: "bg-amber-100",
        text: "text-amber-700",
        border: "border-amber-200",
        fill: "fill-amber-500",
      }
    case "D":
      return {
        bg: "bg-orange-100",
        text: "text-orange-700",
        border: "border-orange-200",
        fill: "fill-orange-500",
      }
    case "F":
      return {
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-200",
        fill: "fill-red-500",
      }
  }
}
