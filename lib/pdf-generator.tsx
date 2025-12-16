"use client"

import type { Contact, Property, Visit, Deal } from "@/lib/mock-data"

// Document template data structures
export interface MandateData {
  type: "simple" | "exclusive" | "semi-exclusive"
  seller: Contact
  property: Property
  agent: {
    name: string
    agency: string
    registrationNumber: string
    address: string
  }
  commission: {
    percentage: number
    paidBy: "seller" | "buyer"
  }
  duration: {
    months: number
    startDate: string
    endDate: string
  }
  askingPrice: number
  minimumPrice?: number
  marketingMethods: string[]
  specialClauses: string[]
}

export interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
  vatRate: number
}

export interface InvoiceTotals {
  subtotalExclVat: number
  vatTotal: number
  totalInclVat: number
}

export interface InvoiceDocument {
  invoiceNumber: string
  issueDate: string // YYYY-MM-DD
  dueDate: string // YYYY-MM-DD
  currency: "EUR"
  supplier: {
    name: string
    address?: string
    email?: string
    phone?: string
    vatNumber?: string
    rcsNumber?: string
  }
  customer: {
    name: string
    email?: string | null
    phone?: string | null
  }
  items: InvoiceLineItem[]
  totals: InvoiceTotals
  payment: {
    iban?: string
    bic?: string
    reference?: string
    terms?: string
  }
  notes?: string
}

export interface InvoiceData {
  invoice: InvoiceDocument
  property?: Property
  deal?: Deal
}

export interface RentalContractData {
  landlord: Contact
  tenant: Contact
  property: Property
  rent: {
    monthly: number
    charges: number
    deposit: number
    paymentDay: number
  }
  duration: {
    startDate: string
    endDate: string
    type: "furnished" | "unfurnished"
  }
  specialClauses: string[]
}

export interface OfferLetterData {
  buyer: Contact
  seller: Contact
  property: Property
  offer: {
    amount: number
    validUntil: string
    conditions: string[]
    financingType: "cash" | "mortgage" | "mixed"
    mortgageAmount?: number
  }
}

export interface VisitReportData {
  visit: Visit
  property: Property
  contact: Contact
  agent: { name: string }
  observations: {
    generalCondition: "excellent" | "good" | "fair" | "poor"
    rooms: Array<{
      name: string
      condition: string
      notes: string
    }>
  }
  interestLevel: number
  comments: string
  followUpActions: string[]
}

export interface EtatDesLieuxData {
  type: "move_in" | "move_out"
  property: Property
  landlord: Contact
  tenant: Contact
  date: string
  rooms: Array<{
    name: string
    walls: { condition: string; notes: string }
    floor: { condition: string; notes: string }
    ceiling: { condition: string; notes: string }
    windows: { condition: string; notes: string }
    fixtures: Array<{ item: string; condition: string; notes: string }>
  }>
  meterReadings: {
    electricity: number
    gas?: number
    water: number
  }
  keysProvided: Array<{ type: string; quantity: number }>
  generalComments: string
}

// Sale Contract (Compromis de Vente) for existing properties
export interface SaleContractData {
  seller: Contact
  buyer: Contact
  property: Property
  agent: {
    name: string
    agency: string
    registrationNumber: string
    address: string
  }
  price: {
    salePrice: number
    agencyFees: number
    feesPayableBy: "seller" | "buyer"
    depositAmount: number
    depositDueDate: string
  }
  conditions: {
    suspensiveConditions: string[]
    mortgageCondition: boolean
    mortgageAmount?: number
    mortgageDuration?: number
    mortgageRate?: number
  }
  dates: {
    signatureDate: string
    completionDeadline: string
    possessionDate: string
  }
  notary: {
    name: string
    address: string
    phone?: string
  }
  specialClauses: string[]
  diagnostics: {
    dpe?: string
    asbestos?: boolean
    leadPaint?: boolean
    termites?: boolean
    electricalReport?: boolean
    gasReport?: boolean
    naturalRisks?: boolean
  }
}

// Sale Contract VEFA (Vente en État Futur d'Achèvement)
export interface SaleContractVEFAData {
  seller: {
    company: string
    siret: string
    address: string
    representative: string
    guarantor: string
  }
  buyer: Contact
  property: Property
  program: {
    name: string
    permitNumber: string
    permitDate: string
    lotNumber: string
    building: string
    floor: number
    description: string
  }
  price: {
    totalPrice: number
    pricePerSqm: number
    vatRate: number
    parkingPrice?: number
    storagePrice?: number
  }
  payments: {
    reservationDeposit: number
    schedule: Array<{
      stage: string
      percentage: number
      amount: number
      dueDate?: string
    }>
  }
  delivery: {
    estimatedDate: string
    toleranceMonths: number
    penaltyPerDay?: number
  }
  guarantees: {
    completionGuarantee: string
    decennialInsurance: string
    damageInsurance: string
  }
  specialClauses: string[]
}

// Key Handover (Remise des Clés)
export interface KeyHandoverData {
  property: Property
  previousOccupant: Contact
  newOccupant: Contact
  date: string
  time: string
  agent?: { name: string; agency: string }
  keys: Array<{
    type: string
    quantity: number
    description?: string
  }>
  remoteControls: Array<{
    type: string
    quantity: number
  }>
  accessCodes: Array<{
    location: string
    code: string
  }>
  meterReadings: {
    electricity: { reading: number; pdl?: string }
    gas?: { reading: number; pce?: string }
    water: { reading: number; meter?: string }
  }
  documents: string[]
  observations: string
}

// Notice Descriptive (VEFA technical description)
export interface NoticeDescriptiveData {
  program: {
    name: string
    address: string
    promoter: string
    architect: string
  }
  lot: {
    number: string
    type: string
    floor: number
    orientation: string
    surface: number
    annexSurfaces: Array<{ type: string; surface: number }>
  }
  description: {
    structure: string
    facade: string
    roofing: string
    insulation: string
    heating: string
    ventilation: string
    plumbing: string
    electricity: string
    flooring: Array<{ room: string; material: string }>
    walls: Array<{ room: string; finish: string }>
    fixtures: Array<{ room: string; items: string[] }>
    exterior: string[]
  }
  equipment: {
    kitchen: string[]
    bathroom: string[]
    other: string[]
  }
  commonAreas: string[]
  parkingDetails?: string
  storageDetails?: string
}

// Legacy Customer PDF / Property Brochure (unused by current React-PDF templates)
export interface CustomerPropertyBrochureData {
  property: Property
  agency: {
    name: string
    logo?: string
    phone: string
    email: string
    website: string
  }
  agent: {
    name: string
    phone: string
    email: string
    photo?: string
  }
  highlights: string[]
  description: string
  photos: string[]
  floorPlan?: string
  virtualTourUrl?: string
  nearbyAmenities: Array<{ type: string; name: string; distance: string }>
  priceDetails: {
    price: number
    pricePerSqm: number
    fees?: string
    taxeFonciere?: number
    chargesCopro?: number
  }
}

// Price List
export interface PriceListData {
  program: {
    name: string
    address: string
    promoter: string
    deliveryDate: string
  }
  agency: {
    name: string
    logo?: string
    contact: string
  }
  lots: Array<{
    lotNumber: string
    type: string
    floor: number
    surface: number
    orientation: string
    price: number
    pricePerSqm: number
    parking?: number
    storage?: number
    status: "available" | "reserved" | "sold"
    features: string[]
  }>
  parkingPrices: Array<{ type: string; price: number }>
  storagePrices: Array<{ type: string; price: number }>
  validUntil: string
  notes: string[]
}

// Valuation / Estimation report (lightweight, informational)
export interface ValuationReportData {
  generatedAt: string
  reportTitle: string
  valuation: {
    estimatedValue: number
    lowEstimate: number
    highEstimate: number
    pricePerM2: number
    basePricePerM2: number
    regionName: string
    districtName?: string | null
    regionTrend: number
    energyClass: string
  }
  inputs: {
    region: string
    district: string
    propertyType: string
    surface: number
    bedrooms: number
    bathrooms: number
    yearBuilt: number
    condition: string
    energyClass: string
    features: Record<string, string>
  }
  breakdown: {
    baseValue: number
    energyAdjustment: number
    typeMultiplier: number
    conditionMultiplier: number
    ageDepreciation: number
    featureAdjustments: Record<string, number>
    totalFeatureValue: number
    bedroomAdjustment: number
  }
  notes?: string
  disclaimers: string[]
}

// Window Display Card (Vitrine) - A4/A3 format for agency window
export interface WindowDisplayData {
  property: Property
  agency: {
    name: string
    logo?: string
    phone: string
    website: string
  }
  displaySize: "A4" | "A3"
  priceDisplay: "full" | "from" | "hidden"
  badge?: string // e.g., "NOUVEAU", "EXCLUSIVITÉ", "COUP DE COEUR"
  qrCodeUrl?: string
}

// Comparative Market Analysis (CMA)
export interface CMAData {
  property: Property
  preparedFor: {
    name: string
    email?: string
  }
  preparedBy: {
    name: string
    title: string
    phone: string
    email: string
    photo?: string
  }
  agency: {
    name: string
    logo?: string
  }
  suggestedPrice: {
    low: number
    recommended: number
    high: number
  }
  comparables: Array<{
    address: string
    type: string
    surface: number
    rooms: number
    soldPrice: number
    pricePerSqm: number
    soldDate: string
    daysOnMarket: number
    distance: string
    adjustedPrice?: number
    notes?: string
  }>
  marketAnalysis: {
    averagePricePerSqm: number
    medianPrice: number
    averageDaysOnMarket: number
    inventoryLevel: "low" | "balanced" | "high"
    marketTrend: "declining" | "stable" | "rising"
    demandLevel: "weak" | "moderate" | "strong"
  }
  strengths: string[]
  improvements: string[]
  marketingRecommendations: string[]
  generatedAt: string
}

// Open House Flyer
export interface OpenHouseData {
  property: Property
  agency: {
    name: string
    logo?: string
    phone: string
    website: string
  }
  agent: {
    name: string
    phone: string
    photo?: string
  }
  event: {
    date: string
    startTime: string
    endTime: string
    address: string
    instructions?: string
  }
  highlights: string[]
  mainPhoto?: string
  qrCodeUrl?: string
  rsvpRequired: boolean
  rsvpContact?: string
}

// Property Brochure
export interface PropertyBrochureData {
  property: Property
  agent: {
    name: string
    phone: string
    email: string
    photo?: string
    license?: string
  }
  agency: {
    name: string
    logo?: string
    phone: string
    website: string
    address: string
  }
  features: string[]
  highlights: {
    title: string
    description: string
  }[]
  nearbyAmenities: Array<{
    name: string
    distance: string
    type: "school" | "transport" | "shopping" | "healthcare" | "leisure"
  }>
  energyRating?: {
    consumption: number
    emissions: number
    class: string
  }
  includeVirtualTour: boolean
  customMessage?: string
}

// Listing Presentation
export interface ListingPresentationData {
  property: Property
  seller: Contact
  agent: {
    name: string
    phone: string
    email: string
    photo?: string
    experience: string
    recentSales: number
  }
  agency: {
    name: string
    logo?: string
    phone: string
    website: string
    address: string
    about: string
  }
  marketingPlan: {
    onlinePortals: string[]
    professionalPhotography: boolean
    virtualTour: boolean
    openHouse: boolean
    socialMedia: boolean
    emailCampaign: boolean
    printAdvertising: boolean
  }
  comparativeAnalysis: {
    selectedProperties: Array<{
      address: string
      price: number
      surface: number
      saleDate: string
      daysOnMarket: number
    }>
    averagePricePerSqm: number
    marketPosition: "premium" | "average" | "value"
    priceRecommendation: {
      minimum: number
      recommended: number
      maximum: number
    }
  }
  timeline: {
    listingDate: string
    expectedSaleDate: string
    keyMilestones: Array<{
      date: string
      task: string
      completed: boolean
    }>
  }
  commission: {
    percentage: number
    estimatedAmount: number
    includes: string[]
  }
}

// Property Feature Sheet
export interface PropertyFeatureSheetData {
  property: Property
  agent: {
    name: string
    phone: string
    email: string
    photo?: string
  }
  agency: {
    name: string
    logo?: string
    phone: string
    website: string
  }
  roomDetails: Array<{
    room: string
    surface: number
    description: string
    features: string[]
  }>
  exteriorFeatures: string[]
  interiorFeatures: string[]
  utilities: {
    heating: string
    cooling: string
    electricity: string
    water: string
    sewer: string
  }
  parking: {
    type: string
    capacity: number
    covered: boolean
  }
  outdoorSpaces: string[]
  buildingDetails?: {
    yearBuilt: number
    construction: string
    foundation: string
    roof: string
    floors: number
    units?: number
  }
}

// Social Media Post
export interface SocialMediaPostData {
  property: Property
  agent: {
    name: string
    phone: string
    email: string
    website?: string
  }
  agency: {
    name: string
    logo?: string
  }
  platform: "instagram" | "facebook" | "linkedin" | "twitter"
  postType: "new_listing" | "price_reduced" | "open_house" | "just_sold" | "featured"
  caption: string
  hashtags: string[]
  callToAction: string
  showPrice: boolean
  showAddress: boolean
  customBranding?: {
    colors: {
      primary: string
      secondary: string
    }
    logo?: string
  }
}

// Email Marketing Template
export interface EmailMarketingData {
  campaign: "new_listing" | "price_reduction" | "open_house" | "market_update" | "newsletter"
  recipients: Contact[]
  sender: {
    name: string
    email: string
    phone: string
    signature: string
  }
  agency: {
    name: string
    logo?: string
    website: string
    address: string
  }
  properties?: Property[]
  subject: string
  preheader: string
  headline: string
  body: {
    sections: Array<{
      type: "text" | "image" | "property" | "button"
      content: string
      properties?: Property[]
    }>
  }
  callToAction: {
    text: string
    link: string
  }
  footer: {
    unsubscribeLink: string
    companyAddress: string
    privacyPolicy: string
  }
}

// Just Listed / Just Sold Postcard
export interface PropertyPostcardData {
  type: "just_listed" | "just_sold" | "price_reduced" | "open_house" | "coming_soon"
  property: Property
  agent: {
    name: string
    phone: string
    email: string
    photo?: string
    license?: string
  }
  agency: {
    name: string
    logo?: string
    phone: string
    website: string
  }
  size: "A6" | "A5" | "DL"
  orientation: "portrait" | "landscape"
  mainImage?: string
  headline: string
  price?: number
  priceText?: string // e.g., "Starting from", "Previously"
  features: string[]
  openHouseInfo?: {
    date: string
    startTime: string
    endTime: string
  }
  qrCodeUrl?: string
  neighborhoodHighlight?: {
    name: string
    description: string
  }
  customMessage?: string
}

// Just Listed / Just Sold Card
export interface PropertyAnnouncementData {
  type: "just_listed" | "just_sold" | "price_reduced" | "open_house"
  property: Property
  agency: {
    name: string
    logo?: string
    phone: string
    website: string
  }
  agent: {
    name: string
    phone: string
    photo?: string
  }
  soldInfo?: {
    soldPrice?: number
    daysOnMarket?: number
    aboveAsking?: boolean
  }
  priceReduction?: {
    oldPrice: number
    newPrice: number
    percentOff: number
  }
  mainPhoto?: string
  callToAction: string
}

// Investment Analysis Report
export interface InvestmentAnalysisData {
  property: Property
  agency: {
    name: string
    logo?: string
  }
  preparedFor: {
    name: string
  }
  purchaseDetails: {
    askingPrice: number
    estimatedClosingCosts: number
    renovationBudget?: number
    totalInvestment: number
  }
  financing: {
    downPayment: number
    loanAmount: number
    interestRate: number
    loanTermYears: number
    monthlyMortgage: number
  }
  rentalProjection: {
    monthlyRent: number
    annualRent: number
    vacancyRate: number
    effectiveRent: number
  }
  expenses: {
    propertyTax: number
    insurance: number
    maintenance: number
    managementFee?: number
    hoaFees?: number
    utilities?: number
    totalMonthly: number
    totalAnnual: number
  }
  returns: {
    netOperatingIncome: number
    cashFlow: number
    capRate: number
    cashOnCash: number
    grossYield: number
    netYield: number
  }
  appreciation: {
    assumedRate: number
    projectedValue5Years: number
    projectedValue10Years: number
    totalEquityGain5Years: number
  }
  notes?: string
  generatedAt: string
}

// Format helpers
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}

// Generate HTML content for documents
export function generateMandateHTML(data: MandateData): string {
  const mandateTypeLabels = {
    simple: "Mandat Simple",
    exclusive: "Mandat Exclusif",
    "semi-exclusive": "Mandat Semi-Exclusif",
  }

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Mandat de Vente - ${data.property.reference}</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px; }
        h1 { text-align: center; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 10px; }
        h2 { color: #334155; margin-top: 30px; }
        .header { text-align: center; margin-bottom: 40px; }
        .header img { max-width: 150px; }
        .section { margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 8px; }
        .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .party { padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; }
        .party h3 { margin-top: 0; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f1f5f9; font-weight: 600; }
        .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; }
        .signature-block { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .signature { border-top: 1px solid #1a1a1a; padding-top: 10px; text-align: center; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #64748b; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${mandateTypeLabels[data.type]}</h1>
        <p>Réf: ${data.property.reference} | Date: ${formatDate(data.duration.startDate)}</p>
      </div>

      <h2>1. Les Parties</h2>
      <div class="parties">
        <div class="party">
          <h3>Le Mandant (Vendeur)</h3>
          <p><strong>${data.seller.firstName} ${data.seller.lastName}</strong></p>
          <p>Email: ${data.seller.email || "Non renseigné"}</p>
          <p>Téléphone: ${data.seller.phone || "Non renseigné"}</p>
        </div>
        <div class="party">
          <h3>Le Mandataire (Agent)</h3>
          <p><strong>${data.agent.name}</strong></p>
          <p>${data.agent.agency}</p>
          <p>N° Registre: ${data.agent.registrationNumber}</p>
          <p>${data.agent.address}</p>
        </div>
      </div>

      <h2>2. Objet du Mandat</h2>
      <div class="section">
        <p>Le mandant confie au mandataire, qui accepte, le mandat de vendre le bien immobilier suivant:</p>
        <table>
          <tr><th>Type de bien</th><td>${data.property.type}</td></tr>
          <tr><th>Adresse</th><td>${data.property.address.street}, ${data.property.address.postalCode} ${data.property.address.city}</td></tr>
          <tr><th>Surface</th><td>${data.property.characteristics.surface} m²</td></tr>
          <tr><th>Nombre de pièces</th><td>${data.property.characteristics.rooms}</td></tr>
          <tr><th>Chambres</th><td>${data.property.characteristics.bedrooms}</td></tr>
          <tr><th>Salles de bain</th><td>${data.property.characteristics.bathrooms}</td></tr>
          <tr><th>État</th><td>${data.property.characteristics.condition}</td></tr>
        </table>
      </div>

      <h2>3. Prix et Conditions</h2>
      <div class="section">
        <table>
          <tr><th>Prix de vente demandé</th><td><strong>${formatCurrency(data.askingPrice)}</strong></td></tr>
          ${data.minimumPrice ? `<tr><th>Prix minimum accepté</th><td>${formatCurrency(data.minimumPrice)}</td></tr>` : ""}
          <tr><th>Commission</th><td>${data.commission.percentage}% à la charge ${data.commission.paidBy === "seller" ? "du vendeur" : "de l'acquéreur"}</td></tr>
        </table>
      </div>

      <h2>4. Durée du Mandat</h2>
      <div class="section">
        <p>Le présent mandat est conclu pour une durée de <strong>${data.duration.months} mois</strong>.</p>
        <p>Date de début: ${formatDate(data.duration.startDate)}</p>
        <p>Date de fin: ${formatDate(data.duration.endDate)}</p>
      </div>

      <h2>5. Moyens de Commercialisation</h2>
      <div class="section">
        <ul>
          ${data.marketingMethods.map((method) => `<li>${method}</li>`).join("")}
        </ul>
      </div>

      ${
        data.specialClauses.length > 0
          ? `
      <h2>6. Clauses Particulières</h2>
      <div class="highlight">
        <ul>
          ${data.specialClauses.map((clause) => `<li>${clause}</li>`).join("")}
        </ul>
      </div>
      `
          : ""
      }

      <div class="signature-block">
        <div>
          <p>Fait à ________________, le ${formatDate(data.duration.startDate)}</p>
          <p>En deux exemplaires originaux</p>
        </div>
        <div></div>
        <div class="signature">
          <p>Le Mandant</p>
          <p style="margin-top: 60px;">${data.seller.firstName} ${data.seller.lastName}</p>
        </div>
        <div class="signature">
          <p>Le Mandataire</p>
          <p style="margin-top: 60px;">${data.agent.name}</p>
        </div>
      </div>

      <div class="footer">
        <p>Document généré le ${formatDate(new Date().toISOString())}</p>
      </div>
    </body>
    </html>
  `
}

export function generateRentalContractHTML(data: RentalContractData): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Contrat de Location - ${data.property.reference}</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px; }
        h1 { text-align: center; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 10px; }
        h2 { color: #334155; margin-top: 30px; }
        .section { margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 8px; }
        .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .party { padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; }
        .party h3 { margin-top: 0; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f1f5f9; font-weight: 600; }
        .highlight { background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .signature-block { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .signature { border-top: 1px solid #1a1a1a; padding-top: 10px; text-align: center; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #64748b; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <h1>Contrat de Location ${data.duration.type === "furnished" ? "Meublée" : "Non Meublée"}</h1>

      <h2>1. Les Parties</h2>
      <div class="parties">
        <div class="party">
          <h3>Le Bailleur</h3>
          <p><strong>${data.landlord.firstName} ${data.landlord.lastName}</strong></p>
          <p>Email: ${data.landlord.email || "Non renseigné"}</p>
          <p>Téléphone: ${data.landlord.phone || "Non renseigné"}</p>
        </div>
        <div class="party">
          <h3>Le Locataire</h3>
          <p><strong>${data.tenant.firstName} ${data.tenant.lastName}</strong></p>
          <p>Email: ${data.tenant.email || "Non renseigné"}</p>
          <p>Téléphone: ${data.tenant.phone || "Non renseigné"}</p>
        </div>
      </div>

      <h2>2. Désignation du Logement</h2>
      <div class="section">
        <table>
          <tr><th>Adresse</th><td>${data.property.address.street}, ${data.property.address.postalCode} ${data.property.address.city}</td></tr>
          <tr><th>Type</th><td>${data.property.type}</td></tr>
          <tr><th>Surface habitable</th><td>${data.property.characteristics.surface} m²</td></tr>
          <tr><th>Nombre de pièces</th><td>${data.property.characteristics.rooms}</td></tr>
          <tr><th>Équipements</th><td>${data.duration.type === "furnished" ? "Meublé" : "Non meublé"}</td></tr>
        </table>
      </div>

      <h2>3. Durée du Bail</h2>
      <div class="section">
        <p>Le présent bail est conclu pour une durée de:</p>
        <p><strong>${data.duration.type === "furnished" ? "1 an renouvelable" : "3 ans renouvelables"}</strong></p>
        <p>À compter du: ${formatDate(data.duration.startDate)}</p>
      </div>

      <h2>4. Conditions Financières</h2>
      <div class="highlight">
        <table>
          <tr><th>Loyer mensuel hors charges</th><td><strong>${formatCurrency(data.rent.monthly)}</strong></td></tr>
          <tr><th>Charges mensuelles</th><td>${formatCurrency(data.rent.charges)}</td></tr>
          <tr><th>Total mensuel</th><td><strong>${formatCurrency(data.rent.monthly + data.rent.charges)}</strong></td></tr>
          <tr><th>Dépôt de garantie</th><td>${formatCurrency(data.rent.deposit)}</td></tr>
          <tr><th>Date de paiement</th><td>Le ${data.rent.paymentDay} de chaque mois</td></tr>
        </table>
      </div>

      ${
        data.specialClauses.length > 0
          ? `
      <h2>5. Clauses Particulières</h2>
      <div class="section">
        <ul>
          ${data.specialClauses.map((clause) => `<li>${clause}</li>`).join("")}
        </ul>
      </div>
      `
          : ""
      }

      <div class="signature-block">
        <div class="signature">
          <p>Le Bailleur</p>
          <p style="margin-top: 60px;">${data.landlord.firstName} ${data.landlord.lastName}</p>
          <p>Date: ________________</p>
        </div>
        <div class="signature">
          <p>Le Locataire</p>
          <p style="margin-top: 60px;">${data.tenant.firstName} ${data.tenant.lastName}</p>
          <p>Date: ________________</p>
        </div>
      </div>

      <div class="footer">
        <p>Document généré le ${formatDate(new Date().toISOString())}</p>
      </div>
    </body>
    </html>
  `
}

export function generateOfferLetterHTML(data: OfferLetterData): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Offre d'Achat - ${data.property.reference}</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px; }
        h1 { text-align: center; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 10px; }
        h2 { color: #334155; margin-top: 30px; }
        .section { margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 8px; }
        .highlight { background: #dcfce7; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; text-align: center; }
        .highlight .amount { font-size: 2em; font-weight: bold; color: #166534; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f1f5f9; font-weight: 600; }
        .conditions { background: #fef3c7; padding: 15px; border-radius: 8px; }
        .signature-block { margin-top: 60px; }
        .signature { border-top: 1px solid #1a1a1a; padding-top: 10px; max-width: 300px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #64748b; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <h1>Offre d'Achat</h1>

      <div class="section">
        <p>Je soussigné(e),</p>
        <p><strong>${data.buyer.firstName} ${data.buyer.lastName}</strong></p>
        <p>Email: ${data.buyer.email || "Non renseigné"}</p>
        <p>Téléphone: ${data.buyer.phone || "Non renseigné"}</p>
      </div>

      <p>Formule par la présente une offre d'achat ferme et définitive pour le bien immobilier suivant:</p>

      <h2>Désignation du Bien</h2>
      <div class="section">
        <table>
          <tr><th>Référence</th><td>${data.property.reference}</td></tr>
          <tr><th>Adresse</th><td>${data.property.address.street}, ${data.property.address.postalCode} ${data.property.address.city}</td></tr>
          <tr><th>Type</th><td>${data.property.type}</td></tr>
          <tr><th>Surface</th><td>${data.property.characteristics.surface} m²</td></tr>
          <tr><th>Prix affiché</th><td>${formatCurrency(data.property.price)}</td></tr>
        </table>
      </div>

      <h2>Montant de l'Offre</h2>
      <div class="highlight">
        <p class="amount">${formatCurrency(data.offer.amount)}</p>
        <p>(${numberToWords(data.offer.amount)} euros)</p>
      </div>

      <h2>Financement</h2>
      <div class="section">
        <p>Mode de financement: <strong>${
          data.offer.financingType === "cash"
            ? "Comptant"
            : data.offer.financingType === "mortgage"
              ? "Crédit immobilier"
              : "Mixte (apport + crédit)"
        }</strong></p>
        ${data.offer.mortgageAmount ? `<p>Montant du crédit sollicité: ${formatCurrency(data.offer.mortgageAmount)}</p>` : ""}
      </div>

      <h2>Conditions Suspensives</h2>
      <div class="conditions">
        <ul>
          ${data.offer.conditions.map((condition) => `<li>${condition}</li>`).join("")}
        </ul>
      </div>

      <h2>Validité de l'Offre</h2>
      <div class="section">
        <p>Cette offre est valable jusqu'au: <strong>${formatDate(data.offer.validUntil)}</strong></p>
        <p>Passé ce délai, sans acceptation de votre part, la présente offre sera considérée comme caduque.</p>
      </div>

      <div class="signature-block">
        <p>Fait à ________________, le ________________</p>
        <p>En deux exemplaires originaux</p>
        <br/>
        <div class="signature">
          <p>L'Acquéreur</p>
          <p style="margin-top: 60px;">${data.buyer.firstName} ${data.buyer.lastName}</p>
          <p><em>Signature précédée de la mention "Lu et approuvé"</em></p>
        </div>
      </div>

      <div class="footer">
        <p>Document généré le ${formatDate(new Date().toISOString())}</p>
      </div>
    </body>
    </html>
  `
}

export function generateVisitReportHTML(data: VisitReportData): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Compte-Rendu de Visite - ${data.property.reference}</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px; }
        h1 { text-align: center; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 10px; }
        h2 { color: #334155; margin-top: 30px; }
        .section { margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 8px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f1f5f9; font-weight: 600; }
        .interest-level { display: flex; gap: 5px; align-items: center; }
        .interest-dot { width: 20px; height: 20px; border-radius: 50%; }
        .interest-dot.filled { background: #22c55e; }
        .interest-dot.empty { background: #e2e8f0; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #64748b; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <h1>Compte-Rendu de Visite</h1>

      <div class="info-grid">
        <div class="section">
          <h3>Informations de la Visite</h3>
          <p><strong>Date:</strong> ${formatDate(data.visit.date)}</p>
          <p><strong>Heure:</strong> ${data.visit.startTime} - ${data.visit.endTime}</p>
          <p><strong>Agent:</strong> ${data.agent.name}</p>
        </div>
        <div class="section">
          <h3>Visiteur</h3>
          <p><strong>${data.contact.firstName} ${data.contact.lastName}</strong></p>
          <p>Email: ${data.contact.email || "Non renseigné"}</p>
          <p>Téléphone: ${data.contact.phone || "Non renseigné"}</p>
        </div>
      </div>

      <h2>Bien Visité</h2>
      <div class="section">
        <table>
          <tr><th>Référence</th><td>${data.property.reference}</td></tr>
          <tr><th>Adresse</th><td>${data.property.address.street}, ${data.property.address.postalCode} ${data.property.address.city}</td></tr>
          <tr><th>Type</th><td>${data.property.type}</td></tr>
          <tr><th>Prix</th><td>${formatCurrency(data.property.price)}</td></tr>
        </table>
      </div>

      <h2>Observations</h2>
      <div class="section">
        <p><strong>État général:</strong> ${data.observations.generalCondition}</p>
        ${
          data.observations.rooms.length > 0
            ? `
        <table>
          <tr><th>Pièce</th><th>État</th><th>Notes</th></tr>
          ${data.observations.rooms.map((room) => `<tr><td>${room.name}</td><td>${room.condition}</td><td>${room.notes}</td></tr>`).join("")}
        </table>
        `
            : ""
        }
      </div>

      <h2>Niveau d'Intérêt</h2>
      <div class="section">
        <div class="interest-level">
          ${[1, 2, 3, 4, 5]
            .map((i) => `<div class="interest-dot ${i <= data.interestLevel ? "filled" : "empty"}"></div>`)
            .join("")}
          <span style="margin-left: 10px;">${data.interestLevel}/5</span>
        </div>
      </div>

      <h2>Commentaires</h2>
      <div class="section">
        <p>${data.comments || "Aucun commentaire"}</p>
      </div>

      <h2>Actions de Suivi</h2>
      <div class="section">
        <ul>
          ${data.followUpActions.map((action) => `<li>${action}</li>`).join("")}
        </ul>
      </div>

      <div class="footer">
        <p>Document généré le ${formatDate(new Date().toISOString())}</p>
      </div>
    </body>
    </html>
  `
}

export function generateEtatDesLieuxHTML(data: EtatDesLieuxData): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>État des Lieux - ${data.property.reference}</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px; }
        h1 { text-align: center; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 10px; }
        h2 { color: #334155; margin-top: 30px; }
        h3 { color: #475569; margin-top: 20px; }
        .section { margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 8px; }
        .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .party { padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 8px; text-align: left; border: 1px solid #e2e8f0; }
        th { background: #f1f5f9; font-weight: 600; }
        .room-section { margin: 15px 0; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; }
        .signature-block { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .signature { border-top: 1px solid #1a1a1a; padding-top: 10px; text-align: center; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #64748b; }
        @media print { body { padding: 20px; } .room-section { page-break-inside: avoid; } }
      </style>
    </head>
    <body>
      <h1>État des Lieux ${data.type === "move_in" ? "d'Entrée" : "de Sortie"}</h1>

      <div class="section">
        <p><strong>Date:</strong> ${formatDate(data.date)}</p>
        <p><strong>Adresse du bien:</strong> ${data.property.address.street}, ${data.property.address.postalCode} ${data.property.address.city}</p>
      </div>

      <h2>Les Parties</h2>
      <div class="parties">
        <div class="party">
          <h3>Le Bailleur</h3>
          <p><strong>${data.landlord.firstName} ${data.landlord.lastName}</strong></p>
          <p>Email: ${data.landlord.email || "Non renseigné"}</p>
          <p>Téléphone: ${data.landlord.phone || "Non renseigné"}</p>
        </div>
        <div class="party">
          <h3>Le Locataire</h3>
          <p><strong>${data.tenant.firstName} ${data.tenant.lastName}</strong></p>
          <p>Email: ${data.tenant.email || "Non renseigné"}</p>
          <p>Téléphone: ${data.tenant.phone || "Non renseigné"}</p>
        </div>
      </div>

      <h2>Relevés des Compteurs</h2>
      <div class="section">
        <table>
          <tr><th>Compteur</th><th>Index</th></tr>
          <tr><td>Électricité</td><td>${data.meterReadings.electricity}</td></tr>
          ${data.meterReadings.gas ? `<tr><td>Gaz</td><td>${data.meterReadings.gas}</td></tr>` : ""}
          <tr><td>Eau</td><td>${data.meterReadings.water}</td></tr>
        </table>
      </div>

      <h2>État des Pièces</h2>
      ${data.rooms
        .map(
          (room) => `
        <div class="room-section">
          <h3>${room.name}</h3>
          <table>
            <tr><th>Élément</th><th>État</th><th>Observations</th></tr>
            <tr><td>Murs</td><td>${room.walls.condition}</td><td>${room.walls.notes}</td></tr>
            <tr><td>Sol</td><td>${room.floor.condition}</td><td>${room.floor.notes}</td></tr>
            <tr><td>Plafond</td><td>${room.ceiling.condition}</td><td>${room.ceiling.notes}</td></tr>
            <tr><td>Fenêtres</td><td>${room.windows.condition}</td><td>${room.windows.notes}</td></tr>
            ${room.fixtures.map((f) => `<tr><td>${f.item}</td><td>${f.condition}</td><td>${f.notes}</td></tr>`).join("")}
          </table>
        </div>
      `,
        )
        .join("")}

      <h2>Clés Remises</h2>
      <div class="section">
        <table>
          <tr><th>Type</th><th>Quantité</th></tr>
          ${data.keysProvided.map((key) => `<tr><td>${key.type}</td><td>${key.quantity}</td></tr>`).join("")}
        </table>
      </div>

      ${
        data.generalComments
          ? `
      <h2>Observations Générales</h2>
      <div class="section">
        <p>${data.generalComments}</p>
      </div>
      `
          : ""
      }

      <div class="signature-block">
        <div class="signature">
          <p>Le Bailleur</p>
          <p style="margin-top: 60px;">${data.landlord.firstName} ${data.landlord.lastName}</p>
        </div>
        <div class="signature">
          <p>Le Locataire</p>
          <p style="margin-top: 60px;">${data.tenant.firstName} ${data.tenant.lastName}</p>
        </div>
      </div>

      <div class="footer">
        <p>Document généré le ${formatDate(new Date().toISOString())}</p>
      </div>
    </body>
    </html>
  `
}

// Helper function to convert numbers to French words (simplified)
function numberToWords(num: number): string {
  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"]
  const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"]
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

// Download PDF function using browser print
export function downloadAsPDF(htmlContent: string, filename: string) {
  const printWindow = window.open("", "_blank")
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}

// Preview document in new tab
export function previewDocument(htmlContent: string) {
  const previewWindow = window.open("", "_blank")
  if (previewWindow) {
    previewWindow.document.write(htmlContent)
    previewWindow.document.close()
  }
}
