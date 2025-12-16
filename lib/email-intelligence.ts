"use client"

import type { Email } from "@/lib/mock-data"

export interface EmailLeadInsights {
  fromEmail: string
  fromName: string
  suggestedFirstName: string
  suggestedLastName: string
  phone: string | null
  budgetEur: number | null
  propertyReference: string | null
  intent: "buy" | "rent" | "sell" | "unknown"
  reason: string
  notes: string
  tags: string[]
}

function cleanWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function parseName(name: string, fallbackEmail: string) {
  const cleaned = cleanWhitespace(name || "")
  if (!cleaned) {
    const local = (fallbackEmail.split("@")[0] || "Lead").replace(/[._-]+/g, " ")
    const parts = cleanWhitespace(local).split(" ").filter(Boolean)
    return {
      firstName: (parts[0] || "Lead").slice(0, 1).toUpperCase() + (parts[0] || "Lead").slice(1),
      lastName: parts.slice(1).join(" ") || "Email",
    }
  }

  const parts = cleaned.split(" ").filter(Boolean)
  if (parts.length === 1) return { firstName: parts[0], lastName: "—" }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") }
}

function extractPhone(text: string) {
  // Loose EU-friendly phone capture (supports +352, etc.)
  const m = text.match(/(\+?\d[\d\s().-]{7,}\d)/)
  if (!m) return null
  const candidate = cleanWhitespace(m[1]).replace(/\s+/g, " ")
  // Avoid accidentally matching years or tiny numbers
  if (candidate.replace(/\D/g, "").length < 8) return null
  return candidate
}

function parseMoneyToNumber(raw: string) {
  const cleaned = raw
    .toLowerCase()
    .replace(/[€$]/g, "")
    .replace(/eur|euro|euros/g, "")
    .replace(/\s/g, "")

  const unitMatch = cleaned.match(/(k|m)$/)
  const unit = unitMatch?.[1] || null
  const numericPart = cleaned.replace(/(k|m)$/, "")
  const normalized = numericPart.replace(/,/g, ".").replace(/[^0-9.]/g, "")
  const n = Number.parseFloat(normalized)
  if (!Number.isFinite(n)) return null
  if (unit === "k") return Math.round(n * 1000)
  if (unit === "m") return Math.round(n * 1000000)
  // If user wrote "500000" or "500.000"
  if (normalized.includes(".") && normalized.split(".").length > 2) return null
  return Math.round(n)
}

function extractBudgetEur(text: string) {
  const lower = text.toLowerCase()

  // Prefer explicit "budget" phrasing
  const budgetPhrase =
    lower.match(/budget[^0-9]{0,20}([0-9][0-9\s.,]*(?:k|m)?\s*(?:€|eur|euros)?)/i) ||
    lower.match(/up to[^0-9]{0,20}([0-9][0-9\s.,]*(?:k|m)?\s*(?:€|eur|euros)?)/i) ||
    lower.match(/max[^0-9]{0,20}([0-9][0-9\s.,]*(?:k|m)?\s*(?:€|eur|euros)?)/i)

  if (budgetPhrase?.[1]) {
    const n = parseMoneyToNumber(budgetPhrase[1])
    if (n) return n
  }

  // Fallback: first euro-looking amount
  const euroAmount =
    text.match(/([0-9][0-9\s.,]*(?:k|m)?)\s*(€|eur|euros)\b/i) ||
    text.match(/€\s*([0-9][0-9\s.,]*(?:k|m)?)/i)

  if (euroAmount?.[1]) {
    const n = parseMoneyToNumber(euroAmount[1])
    if (n) return n
  }

  return null
}

function extractPropertyReference(text: string) {
  // Examples: PROP-001, LUX-2024-001, REF12345
  const m = text.match(/\b([A-Z]{2,6}-\d{2,6}(?:-\d{1,6})?)\b/)
  return m?.[1] || null
}

function detectIntent(text: string): EmailLeadInsights["intent"] {
  const lower = text.toLowerCase()
  if (/(sell|vendeur|vendre|estimation|mandat)/.test(lower)) return "sell"
  if (/(rent|rental|location|louer|locataire)/.test(lower)) return "rent"
  if (/(buy|buyer|achat|acheter|acquéreur)/.test(lower)) return "buy"
  if (/(viewing|visit|visite|interested|intéress)/.test(lower)) return "buy"
  return "unknown"
}

export function extractEmailLeadInsights(email: Email): EmailLeadInsights {
  const combined = `${email.subject}\n\n${email.body}`
  const fromEmail = email.from.email
  const fromName = email.from.name

  const { firstName, lastName } = parseName(fromName, fromEmail)
  const phone = extractPhone(combined)
  const budgetEur = extractBudgetEur(combined)
  const propertyReference = extractPropertyReference(combined)
  const intent = detectIntent(combined)

  const reasonParts: string[] = []
  if (/view|visite|viewing|visit/.test(combined.toLowerCase())) reasonParts.push("Scheduling a visit")
  if (/interested|intéress/.test(combined.toLowerCase())) reasonParts.push("Property interest")
  if (/parking|garage/.test(combined.toLowerCase())) reasonParts.push("Asked about parking")
  if (/budget|€|eur|euros/.test(combined.toLowerCase())) reasonParts.push("Budget discussed")
  const reason = reasonParts.length > 0 ? reasonParts.join(" • ") : "New inbound email"

  const tags: string[] = []
  if (intent !== "unknown") tags.push(`intent:${intent}`)
  if (budgetEur) tags.push(`budget:${budgetEur}`)
  if (propertyReference) tags.push(`property:${propertyReference}`)
  if (phone) tags.push("has:phone")

  const notesLines = [
    `Inbound email summary`,
    `- From: ${fromName} <${fromEmail}>`,
    propertyReference ? `- Property ref: ${propertyReference}` : null,
    budgetEur ? `- Budget: €${budgetEur.toLocaleString("fr-LU")}` : null,
    phone ? `- Phone: ${phone}` : null,
    `- Reason: ${reason}`,
    ``,
    `Email subject: ${email.subject}`,
  ].filter(Boolean)

  return {
    fromEmail,
    fromName,
    suggestedFirstName: firstName,
    suggestedLastName: lastName,
    phone,
    budgetEur,
    propertyReference,
    intent,
    reason,
    notes: notesLines.join("\n"),
    tags,
  }
}
