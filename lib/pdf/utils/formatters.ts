// Date formatting
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function formatShortDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// Currency formatting
function normalizeIntlSpacing(value: string): string {
  // Intl for fr-FR commonly uses NBSP / narrow NBSP for grouping and before €
  // Some PDF fonts render these characters incorrectly, so normalize to plain spaces.
  return value.replace(/[\u00A0\u202F\u2007\u2009]/g, " ")
}

export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
  return normalizeIntlSpacing(formatted)
}

export function formatNumber(num: number): string {
  return normalizeIntlSpacing(new Intl.NumberFormat("fr-FR").format(num))
}

// Number to French words (for legal documents)
export function numberToWords(num: number): string {
  const units = [
    "",
    "un",
    "deux",
    "trois",
    "quatre",
    "cinq",
    "six",
    "sept",
    "huit",
    "neuf",
  ]
  const teens = [
    "dix",
    "onze",
    "douze",
    "treize",
    "quatorze",
    "quinze",
    "seize",
    "dix-sept",
    "dix-huit",
    "dix-neuf",
  ]
  const tens = [
    "",
    "",
    "vingt",
    "trente",
    "quarante",
    "cinquante",
    "soixante",
    "soixante-dix",
    "quatre-vingt",
    "quatre-vingt-dix",
  ]

  if (num === 0) return "zéro"

  if (num >= 1000000) {
    const millions = Math.floor(num / 1000000)
    const remainder = num % 1000000
    return `${millions === 1 ? "un" : numberToWords(millions)} million${millions > 1 ? "s" : ""}${remainder > 0 ? " " + numberToWords(remainder) : ""}`
  }

  if (num >= 1000) {
    const thousands = Math.floor(num / 1000)
    const remainder = num % 1000
    return `${thousands === 1 ? "" : numberToWords(thousands) + " "}mille${remainder > 0 ? " " + numberToWords(remainder) : ""}`
  }

  if (num >= 100) {
    const hundreds = Math.floor(num / 100)
    const remainder = num % 100
    return `${hundreds === 1 ? "" : units[hundreds] + " "}cent${hundreds > 1 && remainder === 0 ? "s" : ""}${remainder > 0 ? " " + numberToWords(remainder) : ""}`
  }

  if (num >= 20) {
    const ten = Math.floor(num / 10)
    const unit = num % 10
    if (ten === 7 || ten === 9) {
      return tens[ten - 1] + "-" + teens[unit]
    }
    return tens[ten] + (unit > 0 ? "-" + units[unit] : "")
  }

  if (num >= 10) {
    return teens[num - 10]
  }

  return units[num]
}

// Property type labels
export function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    apartment: "Appartement",
    house: "Maison",
    villa: "Villa",
    studio: "Studio",
    loft: "Loft",
    duplex: "Duplex",
    triplex: "Triplex",
    penthouse: "Penthouse",
    land: "Terrain",
    commercial: "Local commercial",
    office: "Bureau",
    warehouse: "Entrepôt",
    parking: "Parking",
    garage: "Garage",
  }
  return labels[type.toLowerCase()] || type
}

// Condition labels
export function getConditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    new: "Neuf",
    excellent: "Excellent état",
    good: "Bon état",
    fair: "État correct",
    "to_renovate": "À rénover",
    "to_refresh": "À rafraîchir",
  }
  return labels[condition.toLowerCase()] || condition
}

// Mandate type labels
export function getMandateTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    simple: "Mandat Simple",
    exclusive: "Mandat Exclusif",
    "semi-exclusive": "Mandat Semi-Exclusif",
  }
  return labels[type] || type
}

// Financing type labels
export function getFinancingTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    cash: "Comptant (sans crédit)",
    mortgage: "Crédit immobilier",
    mixed: "Mixte (apport + crédit)",
  }
  return labels[type] || type
}
