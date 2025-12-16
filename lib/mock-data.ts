// Mock data for the Real Estate Platform MVP

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: "agent" | "manager" | "admin"
  avatar?: string
}

export interface Agency {
  id: string
  name: string
  logoUrl?: string
  email?: string
  phone?: string
  address?: string
  vatNumber?: string
  rcsNumber?: string
  iban?: string
  bic?: string
}

export interface Contact {
  id: string
  type: "lead" | "buyer" | "seller" | "investor"
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  source: string
  status: "new" | "contacted" | "qualified" | "nurturing" | "closed"
  assignedTo: string | null
  tags: string[]
  notes: string
  lastContactAt: string | null
  createdAt: string
}

export interface Property {
  id: string
  reference: string
  status: "draft" | "published" | "under_offer" | "sold" | "rented" | "archived"
  type: "house" | "apartment" | "office" | "retail" | "land"
  address: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  characteristics: {
    surface: number
    rooms: number
    bedrooms: number
    bathrooms: number
    yearBuilt?: number
    condition: string
  }
  price: number
  ownerId: string
  tags: string[]
  images: string[]
  createdAt: string
}

export interface Deal {
  id: string
  propertyId: string
  buyerId: string
  assignedTo: string
  type: "sale" | "rental"
  status: "lead" | "visit" | "offer" | "negotiation" | "contract" | "notary" | "closed"
  priceOffered: number | null
  priceAccepted: number | null
  commissionAmount: number | null
  createdAt: string
}

export interface Visit {
  id: string
  propertyId: string
  contactId: string
  agentId: string
  date: string
  startTime: string
  endTime: string
  status: "scheduled" | "confirmed" | "completed" | "cancelled"
  confirmationStatus: "pending" | "confirmed" | "declined"
  notes: string
  feedback?: {
    interestLevel: number
    comments: string
  }
}

export interface Contract {
  id: string
  propertyId: string
  contactId: string | null
  dealId: string | null
  type: "mandate" | "sale_existing" | "sale_vefa" | "rental" | "offer" | "reservation"
  propertyCategory: "house" | "apartment" | "office" | "professional" | "retail"
  status: "draft" | "pending_signature" | "signed" | "declined" | "expired"
  signatureMethod: "electronic" | "scanned" | "manual" | null
  autoFilled: boolean
  signedAt: string | null
  expiresAt: string | null
  createdAt: string
  /**
   * Persisted payload used to re-generate the PDF.
   * Optional for backward compatibility with older mock data.
   */
  data?: Record<string, unknown>
  fileUrl?: string | null
  generatedAt?: string | null
}

export interface OperationalDocument {
  id: string
  propertyId: string
  contactId: string | null
  contractId: string | null
  type: "etat_des_lieux" | "remise_des_cles" | "photo_session" | "surface_calculation" | "evaluation"
  subType?: "move_in" | "move_out" // For état des lieux
  status: "draft" | "scheduled" | "in_progress" | "completed" | "signed"
  scheduledDate: string | null
  completedAt: string | null
  data: Record<string, unknown>
  attachments: string[]
  createdAt: string
}

export interface CommercialDocument {
  id: string
  propertyId: string
  type:
    | "notice_descriptive"
    | "customer_pdf"
    | "price_list"
    | "brochure"
    // Marketing document types (PDF generator supported)
    | "window_display"
    | "cma"
    | "open_house"
    | "property_brochure"
    | "property_postcard"
    | "listing_presentation"
    | "property_feature_sheet"
    | "social_media_post"
    | "email_marketing"
    | "buyer_welcome_kit"
    | "seller_packet"
    | "client_intake_form"
  title: string
  description: string
  version: number
  status: "draft" | "published" | "archived"
  fileUrl: string | null
  generatedAt: string | null
  /**
   * Persisted payload used to re-generate the PDF.
   * Optional for backward compatibility with older mock data.
   */
  data?: Record<string, unknown>
  createdAt: string
}

// Mock portals
export interface Portal {
  id: string
  name: string
  logo: string
  status: "connected" | "pending" | "error"
}

// Mock listings
export interface Listing {
  id: string
  propertyId: string
  portals: Portal[]
  status: "active" | "paused" | "archived"
  headline: string
  description: string
  publishedAt: string | null
  expiresAt: string | null
  views: number
  inquiries: number
  createdAt: string
}

export interface MarketingCampaign {
  id: string
  name: string
  objective: "seller_leads" | "buyer_leads" | "open_house" | "brand_awareness"
  status: "draft" | "active" | "paused" | "completed"
  budgetTotal: number
  currency: "EUR"
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  targetAreas: string[]
  channels: Array<"meta" | "google" | "email" | "portals">
  portals: string[]
  metrics: { spend: number; leads: number; visits: number; offers: number }
  notes?: string
  createdAt: string
}

// Mock commissions
export interface Commission {
  id: string
  dealId: string
  agentId: string
  amount: number
  percentage: number
  status: "pending" | "paid" | "cancelled"
  paidAt: string | null
  createdAt: string
}

// Mock invoices
export interface Invoice {
  id: string
  contactId: string
  dealId: string | null
  invoiceNumber: string
  issueDate: string // YYYY-MM-DD
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
  items: { description: string; quantity: number; unitPrice: number; vatRate: number }[]
  totals: { subtotalExclVat: number; vatTotal: number; totalInclVat: number }
  payment: { iban?: string; bic?: string; reference?: string; terms?: string }
  notes?: string
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
  dueDate: string
  paidAt: string | null
  createdAt: string
  fileUrl?: string | null
  generatedAt?: string | null
}

// Mock tasks
export interface Task {
  id: string
  title: string
  description: string
  assignedTo: string
  relatedTo: { type: "contact" | "property" | "deal" | "visit" | "contract"; id: string } | null
  priority: "low" | "medium" | "high" | "urgent"
  status: "todo" | "in_progress" | "completed" | "cancelled"
  dueDate: string
  completedAt: string | null
  createdAt: string
}

// Email interface
export interface Email {
  id: string
  from: {
    name: string
    email: string
  }
  to: {
    name: string
    email: string
  }[]
  subject: string
  body: string
  preview: string
  status: "unread" | "read" | "archived" | "sent" | "draft"
  folder: "inbox" | "sent" | "drafts" | "archived"
  starred: boolean
  relatedTo?: { type: "contact" | "property" | "deal"; id: string }
  receivedAt: string
  readAt: string | null
}

// EmailAccount interface
export interface EmailAccount {
  id: string
  email: string
  provider: "gmail" | "outlook" | "imap"
  name: string
  connected: boolean
  lastSyncedAt: string | null
}

// Current user
export const currentUser: User = {
  id: "u1",
  email: "sarah.johnson@propflow.com",
  firstName: "Sarah",
  lastName: "Johnson",
  role: "agent",
  avatar: "/professional-woman-avatar.png",
}

export const currentAgency: Agency = {
  id: "a1",
  name: "PropFlow Realty",
  logoUrl: "/real-estate-logo-teal.jpg",
  email: "billing@propflow.com",
  phone: "+352 27 00 00 00",
  address: "10 Avenue Monterey, L-2163 Luxembourg",
  vatNumber: "LU12345678",
  rcsNumber: "B123456",
  iban: "LU00 0000 0000 0000 0000",
  bic: "BCEE LU LL",
}

// Mock contacts
export const contacts: Contact[] = [
  {
    id: "c1",
    type: "buyer",
    firstName: "Michael",
    lastName: "Chen",
    email: "michael.chen@email.com",
    phone: "+352 621 123 456",
    source: "Website",
    status: "qualified",
    assignedTo: "u1",
    tags: ["premium", "first-time-buyer"],
    notes: "Looking for 3BR apartment in downtown area",
    lastContactAt: "2025-01-10T14:30:00Z",
    createdAt: "2025-01-05T09:00:00Z",
  },
  {
    id: "c2",
    type: "seller",
    firstName: "Emily",
    lastName: "Rodriguez",
    email: "emily.r@email.com",
    phone: "+352 621 234 567",
    source: "Referral",
    status: "contacted",
    assignedTo: "u1",
    tags: ["motivated-seller"],
    notes: "Relocating for work, needs quick sale",
    lastContactAt: "2025-01-09T10:00:00Z",
    createdAt: "2024-12-03T11:00:00Z",
  },
  {
    id: "c3",
    type: "lead",
    firstName: "James",
    lastName: "Wilson",
    email: "j.wilson@email.com",
    phone: "+352 661 345 678",
    source: "atHome.lu",
    status: "new",
    assignedTo: null,
    tags: ["investor"],
    notes: "Interested in rental properties",
    lastContactAt: null,
    createdAt: "2025-01-10T08:00:00Z",
  },
  {
    id: "c4",
    type: "investor",
    firstName: "David",
    lastName: "Park",
    email: "d.park@investment.com",
    phone: "+352 691 456 789",
    source: "LinkedIn",
    status: "nurturing",
    assignedTo: "u1",
    tags: ["high-value", "multi-property"],
    notes: "Portfolio investor, interested in commercial",
    lastContactAt: "2025-01-08T16:00:00Z",
    createdAt: "2024-12-15T10:00:00Z",
  },
  {
    id: "c5",
    type: "buyer",
    firstName: "Lisa",
    lastName: "Thompson",
    email: "lisa.t@email.com",
    phone: "+352 621 567 890",
    source: "Open House",
    status: "qualified",
    assignedTo: "u1",
    tags: ["family", "suburban"],
    notes: "Family of 4, needs good school district",
    lastContactAt: "2025-01-09T11:30:00Z",
    createdAt: "2025-01-02T14:00:00Z",
  },
]

// Mock properties
export const properties: Property[] = [
  {
    id: "p1",
    reference: "PROP-001",
    status: "published",
    type: "apartment",
    address: {
      street: "123 Downtown Ave, Unit 5A",
      city: "San Francisco",
      postalCode: "94102",
      country: "USA",
    },
    characteristics: {
      surface: 1200,
      rooms: 4,
      bedrooms: 2,
      bathrooms: 2,
      yearBuilt: 2019,
      condition: "Excellent",
    },
    price: 895000,
    ownerId: "c2",
    tags: ["luxury", "downtown", "modern"],
    images: ["/modern-luxury-living-room.png", "/modern-kitchen.png", "/modern-bedroom.png"],
    createdAt: "2025-01-01T10:00:00Z",
  },
  {
    id: "p2",
    reference: "PROP-002",
    status: "published",
    type: "house",
    address: {
      street: "456 Oak Lane",
      city: "Palo Alto",
      postalCode: "94301",
      country: "USA",
    },
    characteristics: {
      surface: 2800,
      rooms: 7,
      bedrooms: 4,
      bathrooms: 3,
      yearBuilt: 2015,
      condition: "Excellent",
    },
    price: 2450000,
    ownerId: "c2",
    tags: ["family-home", "garden", "garage"],
    images: [
      "/modern-luxury-living-room.png",
      "/modern-bedroom.png",
      "/luxury-master-bedroom.png",
    ],
    createdAt: "2024-12-20T09:00:00Z",
  },
  {
    id: "p3",
    reference: "PROP-003",
    status: "under_offer",
    type: "apartment",
    address: {
      street: "789 Marina Blvd, Unit 12B",
      city: "San Francisco",
      postalCode: "94123",
      country: "USA",
    },
    characteristics: {
      surface: 950,
      rooms: 3,
      bedrooms: 1,
      bathrooms: 1,
      yearBuilt: 2020,
      condition: "New",
    },
    price: 725000,
    ownerId: "c2",
    tags: ["waterfront", "views", "modern"],
    images: ["/apartment-with-bay-view.jpg", "/modern-open-kitchen.jpg", "/bedroom-with-city-view.jpg"],
    createdAt: "2024-12-28T11:00:00Z",
  },
  {
    id: "p4",
    reference: "PROP-004",
    status: "draft",
    type: "office",
    address: {
      street: "100 Tech Park Way, Suite 300",
      city: "Mountain View",
      postalCode: "94043",
      country: "USA",
    },
    characteristics: {
      surface: 3500,
      rooms: 10,
      bedrooms: 0,
      bathrooms: 2,
      yearBuilt: 2018,
      condition: "Excellent",
    },
    price: 1850000,
    ownerId: "c4",
    tags: ["commercial", "tech-hub", "parking"],
    images: ["/modern-office-space-open-plan.jpg", "/conference-room-glass-walls.jpg", "/modern-office-exterior.png"],
    createdAt: "2025-01-08T10:00:00Z",
  },
  {
    id: "p5",
    reference: "PROP-005",
    status: "sold",
    type: "house",
    address: {
      street: "222 Hillside Dr",
      city: "Los Altos",
      postalCode: "94022",
      country: "USA",
    },
    characteristics: {
      surface: 3200,
      rooms: 8,
      bedrooms: 5,
      bathrooms: 4,
      yearBuilt: 2010,
      condition: "Very Good",
    },
    price: 3150000,
    ownerId: "c2",
    tags: ["estate", "pool", "views"],
    images: ["/luxury-estate-home-exterior.jpg", "/pool-backyard-mansion.jpg", "/luxury-master-bedroom.png"],
    createdAt: "2024-11-15T09:00:00Z",
  },
]

// Mock deals
export const deals: Deal[] = [
  {
    id: "d1",
    propertyId: "p1",
    buyerId: "c1",
    assignedTo: "u1",
    type: "sale",
    status: "offer",
    priceOffered: 875000,
    priceAccepted: null,
    commissionAmount: null,
    createdAt: "2025-01-08T10:00:00Z",
  },
  {
    id: "d2",
    propertyId: "p3",
    buyerId: "c5",
    assignedTo: "u1",
    type: "sale",
    status: "negotiation",
    priceOffered: 710000,
    priceAccepted: null,
    commissionAmount: null,
    createdAt: "2025-01-06T14:00:00Z",
  },
  {
    id: "d3",
    propertyId: "p5",
    buyerId: "c1",
    assignedTo: "u1",
    type: "sale",
    status: "closed",
    priceOffered: 3100000,
    priceAccepted: 3100000,
    commissionAmount: 93000,
    createdAt: "2024-12-01T09:00:00Z",
  },
  {
    id: "d4",
    propertyId: "p2",
    buyerId: "c5",
    assignedTo: "u1",
    type: "sale",
    status: "visit",
    priceOffered: null,
    priceAccepted: null,
    commissionAmount: null,
    createdAt: "2025-01-09T16:00:00Z",
  },
]

// Mock visits
export const visits: Visit[] = [
  {
    id: "v1",
    propertyId: "p1",
    contactId: "c1",
    agentId: "u1",
    date: "2025-01-11",
    startTime: "10:00",
    endTime: "11:00",
    status: "confirmed",
    confirmationStatus: "confirmed",
    notes: "Client specifically interested in the kitchen renovation",
  },
  {
    id: "v2",
    propertyId: "p2",
    contactId: "c5",
    agentId: "u1",
    date: "2025-01-11",
    startTime: "14:00",
    endTime: "15:30",
    status: "scheduled",
    confirmationStatus: "pending",
    notes: "Second viewing, bringing spouse",
  },
  {
    id: "v3",
    propertyId: "p3",
    contactId: "c5",
    agentId: "u1",
    date: "2025-01-09",
    startTime: "11:00",
    endTime: "12:00",
    status: "completed",
    confirmationStatus: "confirmed",
    notes: "Completed viewing",
    feedback: {
      interestLevel: 4,
      comments: "Very interested, will discuss with partner",
    },
  },
  {
    id: "v4",
    propertyId: "p1",
    contactId: "c3",
    agentId: "u1",
    date: "2025-01-12",
    startTime: "09:00",
    endTime: "10:00",
    status: "scheduled",
    confirmationStatus: "pending",
    notes: "New lead, first-time viewing",
  },
]

// Mock contracts
export const contracts: Contract[] = [
  {
    id: "ct1",
    propertyId: "p1",
    contactId: "c2",
    dealId: null,
    type: "mandate",
    propertyCategory: "apartment",
    status: "signed",
    signatureMethod: "electronic",
    autoFilled: true,
    signedAt: "2025-01-02T10:00:00Z",
    expiresAt: "2025-07-02T10:00:00Z",
    createdAt: "2025-01-01T09:00:00Z",
  },
  {
    id: "ct2",
    propertyId: "p3",
    contactId: "c5",
    dealId: "d2",
    type: "sale_existing",
    propertyCategory: "apartment",
    status: "pending_signature",
    signatureMethod: "electronic",
    autoFilled: true,
    signedAt: null,
    expiresAt: "2025-02-07T14:00:00Z",
    createdAt: "2025-01-07T14:00:00Z",
  },
  {
    id: "ct3",
    propertyId: "p5",
    contactId: "c1",
    dealId: "d3",
    type: "sale_existing",
    propertyCategory: "house",
    status: "signed",
    signatureMethod: "electronic",
    autoFilled: true,
    signedAt: "2024-12-20T11:00:00Z",
    expiresAt: null,
    createdAt: "2024-12-15T09:00:00Z",
  },
  {
    id: "ct4",
    propertyId: "p2",
    contactId: "c5",
    dealId: "d4",
    type: "rental",
    propertyCategory: "house",
    status: "draft",
    signatureMethod: null,
    autoFilled: false,
    signedAt: null,
    expiresAt: null,
    createdAt: "2025-01-09T16:00:00Z",
  },
  {
    id: "ct5",
    propertyId: "p4",
    contactId: "c4",
    dealId: null,
    type: "sale_vefa",
    propertyCategory: "office",
    status: "pending_signature",
    signatureMethod: "electronic",
    autoFilled: true,
    signedAt: null,
    expiresAt: "2025-02-15T10:00:00Z",
    createdAt: "2025-01-08T10:00:00Z",
  },
]

// Mock operational documents
export const operationalDocuments: OperationalDocument[] = [
  {
    id: "od1",
    propertyId: "p5",
    contactId: "c1",
    contractId: "ct3",
    type: "etat_des_lieux",
    subType: "move_in",
    status: "completed",
    scheduledDate: "2024-12-22T10:00:00Z",
    completedAt: "2024-12-22T11:30:00Z",
    data: {
      overallCondition: "excellent",
      rooms: [
        { name: "Living Room", condition: "excellent", notes: "No damages" },
        { name: "Kitchen", condition: "excellent", notes: "All appliances working" },
        { name: "Master Bedroom", condition: "excellent", notes: "Freshly painted" },
      ],
      meterReadings: { electricity: 45230, gas: 12450, water: 890 },
    },
    attachments: ["/inspection-report-1.pdf"],
    createdAt: "2024-12-20T09:00:00Z",
  },
  {
    id: "od2",
    propertyId: "p5",
    contactId: "c1",
    contractId: "ct3",
    type: "remise_des_cles",
    status: "completed",
    scheduledDate: "2024-12-22T12:00:00Z",
    completedAt: "2024-12-22T12:15:00Z",
    data: {
      keysHandedOver: [
        { type: "Main entrance", quantity: 2 },
        { type: "Garage", quantity: 1 },
        { type: "Mailbox", quantity: 2 },
      ],
      accessCodes: { gate: "1234", alarm: "5678" },
      witnessName: "Sarah Johnson",
    },
    attachments: [],
    createdAt: "2024-12-20T09:00:00Z",
  },
  {
    id: "od3",
    propertyId: "p1",
    contactId: null,
    contractId: null,
    type: "photo_session",
    status: "completed",
    scheduledDate: "2025-01-01T14:00:00Z",
    completedAt: "2025-01-01T16:00:00Z",
    data: {
      photographer: "John Smith Photography",
      photosCount: 45,
      videoDuration: "3:30",
      droneFootage: true,
      virtualTour: true,
    },
    attachments: ["/photos/p1/gallery.zip"],
    createdAt: "2024-12-28T10:00:00Z",
  },
  {
    id: "od4",
    propertyId: "p1",
    contactId: null,
    contractId: null,
    type: "surface_calculation",
    status: "completed",
    scheduledDate: null,
    completedAt: "2024-12-30T15:00:00Z",
    data: {
      totalSurface: 1200,
      habitableSurface: 1150,
      carrezSurface: 1140,
      rooms: [
        { name: "Living Room", surface: 450 },
        { name: "Kitchen", surface: 180 },
        { name: "Master Bedroom", surface: 220 },
        { name: "Bedroom 2", surface: 150 },
        { name: "Bathrooms", surface: 120 },
        { name: "Hallway", surface: 80 },
      ],
      certifiedBy: "Geo-Survey Inc.",
      certificateNumber: "CERT-2024-12890",
    },
    attachments: ["/surface-certificate-p1.pdf"],
    createdAt: "2024-12-28T09:00:00Z",
  },
  {
    id: "od5",
    propertyId: "p2",
    contactId: null,
    contractId: null,
    type: "evaluation",
    status: "completed",
    scheduledDate: "2024-12-18T10:00:00Z",
    completedAt: "2024-12-19T14:00:00Z",
    data: {
      estimatedValue: 2500000,
      lowEstimate: 2350000,
      highEstimate: 2650000,
      methodology: "comparative_market_analysis",
      comparables: [
        { address: "445 Oak Lane", soldPrice: 2380000, date: "2024-10-15" },
        { address: "478 Oak Lane", soldPrice: 2520000, date: "2024-11-02" },
        { address: "412 Maple St", soldPrice: 2450000, date: "2024-09-28" },
      ],
      appraiser: "Bay Area Valuations",
      licenseNumber: "CA-APR-45678",
    },
    attachments: ["/valuation-report-p2.pdf"],
    createdAt: "2024-12-15T09:00:00Z",
  },
  {
    id: "od6",
    propertyId: "p3",
    contactId: "c5",
    contractId: "ct2",
    type: "etat_des_lieux",
    subType: "move_in",
    status: "scheduled",
    scheduledDate: "2025-01-20T10:00:00Z",
    completedAt: null,
    data: {},
    attachments: [],
    createdAt: "2025-01-08T10:00:00Z",
  },
]

// Mock commercial documents
export const commercialDocuments: CommercialDocument[] = [
  {
    id: "cd1",
    propertyId: "p4",
    type: "notice_descriptive",
    title: "Tech Park Office - Technical Description",
    description: "VEFA mandatory technical description document",
    version: 2,
    status: "published",
    fileUrl: "/documents/notice-descriptive-p4.pdf",
    generatedAt: "2025-01-08T12:00:00Z",
    createdAt: "2025-01-05T10:00:00Z",
  },
  {
    id: "cd2",
    propertyId: "p1",
    type: "customer_pdf",
    title: "123 Downtown Ave - Property Brochure",
    description: "Marketing brochure for client presentation",
    version: 1,
    status: "published",
    fileUrl: "/documents/brochure-p1.pdf",
    generatedAt: "2025-01-02T14:00:00Z",
    createdAt: "2025-01-02T10:00:00Z",
  },
  {
    id: "cd3",
    propertyId: "p2",
    type: "customer_pdf",
    title: "456 Oak Lane - Luxury Home Presentation",
    description: "Premium property presentation for high-value clients",
    version: 3,
    status: "published",
    fileUrl: "/documents/brochure-p2.pdf",
    generatedAt: "2024-12-22T10:00:00Z",
    createdAt: "2024-12-20T09:00:00Z",
  },
  {
    id: "cd4",
    propertyId: "p4",
    type: "price_list",
    title: "Tech Park Way - Pricing Schedule",
    description: "Complete pricing breakdown for office units",
    version: 1,
    status: "published",
    fileUrl: "/documents/pricing-p4.pdf",
    generatedAt: "2025-01-08T11:00:00Z",
    createdAt: "2025-01-08T10:00:00Z",
  },
  {
    id: "cd5",
    propertyId: "p1",
    type: "brochure",
    title: "Downtown Living Collection",
    description: "Multi-property brochure for downtown apartments",
    version: 1,
    status: "draft",
    fileUrl: null,
    generatedAt: null,
    createdAt: "2025-01-10T09:00:00Z",
  },
]

// Dashboard stats
export const dashboardStats = {
  activeListings: 3,
  totalContacts: 5,
  upcomingVisits: 3,
  dealsInPipeline: 3,
  monthlyRevenue: 93000,
  conversionRate: 25,
}

// Marketing stats
export const marketingStats = {
  totalListings: 3,
  activeListings: 2,
  totalViews: 4980,
  totalInquiries: 80,
  avgDaysOnMarket: 18,
  conversionRate: 1.6,
}

// Finance stats
export const financeStats = {
  totalRevenue: 93500,
  pendingCommissions: 47550,
  paidCommissions: 93000,
  outstandingInvoices: 750,
  monthlyTarget: 150000,
  yearToDateRevenue: 186500,
}

// Mock portals
export const portals: Portal[] = [
  { id: "portal1", name: "atHome.lu", logo: "", status: "connected" },
  { id: "portal2", name: "IMMOTOP.LU", logo: "", status: "connected" },
  { id: "portal3", name: "Wortimmo.lu", logo: "", status: "pending" },
  { id: "portal4", name: "vivi.lu", logo: "", status: "connected" },
]

// Mock listings
export const listings: Listing[] = [
  {
    id: "l1",
    propertyId: "p1",
    portals: [portals[0], portals[1], portals[3]],
    status: "active",
    headline: "Stunning Downtown Apartment with Modern Finishes",
    description: "Beautiful 2BR/2BA apartment in the heart of downtown SF...",
    publishedAt: "2025-01-02T10:00:00Z",
    expiresAt: "2025-02-02T10:00:00Z",
    views: 1250,
    inquiries: 23,
    createdAt: "2025-01-01T10:00:00Z",
  },
  {
    id: "l2",
    propertyId: "p2",
    portals: [portals[0], portals[1], portals[2], portals[3]],
    status: "active",
    headline: "Spacious Family Home in Prestigious Palo Alto",
    description: "Elegant 4BR/3BA home with beautiful garden...",
    publishedAt: "2024-12-21T09:00:00Z",
    expiresAt: "2025-01-21T09:00:00Z",
    views: 2840,
    inquiries: 45,
    createdAt: "2024-12-20T09:00:00Z",
  },
  {
    id: "l3",
    propertyId: "p3",
    portals: [portals[0], portals[2]],
    status: "paused",
    headline: "Waterfront Living at Marina Blvd",
    description: "Gorgeous 1BR apartment with stunning bay views...",
    publishedAt: "2024-12-29T11:00:00Z",
    expiresAt: null,
    views: 890,
    inquiries: 12,
    createdAt: "2024-12-28T11:00:00Z",
  },
]

export const campaigns: MarketingCampaign[] = [
  {
    id: "mc1",
    name: "PROP-001 - Just Listed (Lux City)",
    objective: "buyer_leads",
    status: "active",
    budgetTotal: 600,
    currency: "EUR",
    startDate: "2025-01-03",
    endDate: "2025-01-31",
    targetAreas: ["Luxembourg-Ville", "Kirchberg", "Gasperich"],
    channels: ["meta", "email", "portals"],
    portals: ["atHome.lu", "IMMOTOP.LU", "Wortimmo.lu", "vivi.lu"],
    metrics: { spend: 180, leads: 14, visits: 5, offers: 1 },
    notes: "Focus on qualified buyers, highlight parking & view.",
    createdAt: "2025-01-03T09:00:00Z",
  },
  {
    id: "mc2",
    name: "Seller Leads - Q1 Retargeting",
    objective: "seller_leads",
    status: "draft",
    budgetTotal: 1200,
    currency: "EUR",
    startDate: "2025-02-01",
    endDate: "2025-03-31",
    targetAreas: ["Luxembourg-Ville", "Esch-sur-Alzette"],
    channels: ["meta", "google"],
    portals: [],
    metrics: { spend: 0, leads: 0, visits: 0, offers: 0 },
    notes: "Landing page: estimation + mandate request.",
    createdAt: "2025-01-20T10:00:00Z",
  },
]

// Mock commissions
export const commissions: Commission[] = [
  {
    id: "com1",
    dealId: "d1",
    agentId: "u1",
    amount: 22500,
    percentage: 3,
    status: "paid",
    paidAt: "2025-01-10T10:00:00Z",
    createdAt: "2025-01-05T10:00:00Z",
  },
  {
    id: "com2",
    dealId: "d2",
    agentId: "u1",
    amount: 67500,
    percentage: 2.5,
    status: "pending",
    paidAt: null,
    createdAt: "2025-01-08T10:00:00Z",
  },
  {
    id: "com3",
    dealId: "d3",
    agentId: "u1",
    amount: 15750,
    percentage: 3,
    status: "pending",
    paidAt: null,
    createdAt: "2025-01-12T10:00:00Z",
  },
  {
    id: "com4",
    dealId: "d4",
    agentId: "u1",
    amount: 28500,
    percentage: 3,
    status: "paid",
    paidAt: "2024-12-28T10:00:00Z",
    createdAt: "2024-12-20T10:00:00Z",
  },
  {
    id: "com5",
    dealId: "d5",
    agentId: "u1",
    amount: 42000,
    percentage: 3,
    status: "paid",
    paidAt: "2024-12-15T10:00:00Z",
    createdAt: "2024-12-10T10:00:00Z",
  },
]

// Mock invoices
export const invoices: Invoice[] = [
  {
    id: "inv1",
    contactId: "c1",
    dealId: "d1",
    invoiceNumber: "INV-2025-0001",
    issueDate: "2025-01-05",
    currency: "EUR",
    supplier: {
      name: currentAgency.name,
      address: currentAgency.address,
      email: currentAgency.email,
      phone: currentAgency.phone,
      vatNumber: currentAgency.vatNumber,
      rcsNumber: currentAgency.rcsNumber,
    },
    customer: { name: "Michael Chen", email: "michael.chen@email.com", phone: "+352 621 123 456" },
    items: [
      { description: "Commission de courtage - Vente - 15 Rue de Rivoli", quantity: 1, unitPrice: 22500, vatRate: 17 },
      { description: "Frais administratifs", quantity: 1, unitPrice: 250, vatRate: 17 },
    ],
    totals: { subtotalExclVat: 22750, vatTotal: 3867.5, totalInclVat: 26617.5 },
    payment: { iban: currentAgency.iban, bic: currentAgency.bic, reference: "INV-2025-0001", terms: "Paiement à 14 jours" },
    status: "paid",
    dueDate: "2025-01-20",
    paidAt: "2025-01-15T10:00:00Z",
    createdAt: "2025-01-05T10:00:00Z",
  },
  {
    id: "inv2",
    contactId: "c2",
    dealId: "d2",
    invoiceNumber: "INV-2025-0002",
    issueDate: "2025-01-08",
    currency: "EUR",
    supplier: {
      name: currentAgency.name,
      address: currentAgency.address,
      email: currentAgency.email,
      phone: currentAgency.phone,
      vatNumber: currentAgency.vatNumber,
      rcsNumber: currentAgency.rcsNumber,
    },
    customer: { name: "Emily Rodriguez", email: "emily.r@email.com", phone: "+352 621 234 567" },
    items: [
      { description: "Commission de courtage - Vente - 10 Avenue Monterey", quantity: 1, unitPrice: 67500, vatRate: 17 },
      { description: "Frais administratifs", quantity: 1, unitPrice: 500, vatRate: 17 },
    ],
    totals: { subtotalExclVat: 68000, vatTotal: 11560, totalInclVat: 79560 },
    payment: { iban: currentAgency.iban, bic: currentAgency.bic, reference: "INV-2025-0002", terms: "Paiement à 14 jours" },
    status: "sent",
    dueDate: "2025-02-01",
    paidAt: null,
    createdAt: "2025-01-08T10:00:00Z",
  },
  {
    id: "inv3",
    contactId: "c3",
    dealId: "d3",
    invoiceNumber: "INV-2024-0049",
    issueDate: "2024-12-28",
    currency: "EUR",
    supplier: {
      name: currentAgency.name,
      address: currentAgency.address,
      email: currentAgency.email,
      phone: currentAgency.phone,
      vatNumber: currentAgency.vatNumber,
      rcsNumber: currentAgency.rcsNumber,
    },
    customer: { name: "James Wilson", email: "j.wilson@email.com", phone: "+352 661 345 678" },
    items: [
      { description: "Commission de courtage - Location - 8 Rue du Marais", quantity: 1, unitPrice: 1575, vatRate: 17 },
      { description: "Frais de dossier", quantity: 1, unitPrice: 200, vatRate: 17 },
    ],
    totals: { subtotalExclVat: 1775, vatTotal: 301.75, totalInclVat: 2076.75 },
    payment: { iban: currentAgency.iban, bic: currentAgency.bic, reference: "INV-2024-0049", terms: "Paiement à 14 jours" },
    status: "overdue",
    dueDate: "2025-01-10",
    paidAt: null,
    createdAt: "2024-12-28T10:00:00Z",
  },
  {
    id: "inv4",
    contactId: "c4",
    dealId: null,
    invoiceNumber: "INV-2025-0003",
    issueDate: "2025-01-12",
    currency: "EUR",
    supplier: {
      name: currentAgency.name,
      address: currentAgency.address,
      email: currentAgency.email,
      phone: currentAgency.phone,
      vatNumber: currentAgency.vatNumber,
      rcsNumber: currentAgency.rcsNumber,
    },
    customer: { name: "David Park", email: "d.park@investment.com", phone: "+352 691 456 789" },
    items: [
      { description: "Service d'estimation", quantity: 1, unitPrice: 450, vatRate: 17 },
      { description: "Rapport d'analyse du marché", quantity: 1, unitPrice: 300, vatRate: 17 },
    ],
    totals: { subtotalExclVat: 750, vatTotal: 127.5, totalInclVat: 877.5 },
    payment: { iban: currentAgency.iban, bic: currentAgency.bic, reference: "INV-2025-0003", terms: "Paiement à 14 jours" },
    status: "draft",
    dueDate: "2025-01-25",
    paidAt: null,
    createdAt: "2025-01-12T10:00:00Z",
  },
  {
    id: "inv5",
    contactId: "c5",
    dealId: "d4",
    invoiceNumber: "INV-2024-0048",
    issueDate: "2024-12-20",
    currency: "EUR",
    supplier: {
      name: currentAgency.name,
      address: currentAgency.address,
      email: currentAgency.email,
      phone: currentAgency.phone,
      vatNumber: currentAgency.vatNumber,
      rcsNumber: currentAgency.rcsNumber,
    },
    customer: { name: "Lisa Thompson", email: "lisa.t@email.com", phone: "+352 621 345 678" },
    items: [{ description: "Commission de courtage - Vente - 25 Boulevard Haussmann", quantity: 1, unitPrice: 28500, vatRate: 17 }],
    totals: { subtotalExclVat: 28500, vatTotal: 4845, totalInclVat: 33345 },
    payment: { iban: currentAgency.iban, bic: currentAgency.bic, reference: "INV-2024-0048", terms: "Paiement à 14 jours" },
    status: "paid",
    dueDate: "2025-01-05",
    paidAt: "2024-12-30T10:00:00Z",
    createdAt: "2024-12-20T10:00:00Z",
  },
]

// Mock tasks
export const tasks: Task[] = [
  // Mock tasks data here
]

// Mock emails
export const emails: Email[] = [
  {
    id: "em1",
    from: { name: "Michael Chen", email: "michael.chen@email.com" },
    to: [{ name: "Sarah Johnson", email: "sarah.johnson@propflow.com" }],
    subject: "Re: Downtown apartment viewing - Very interested!",
    body: `Hi Sarah,

Thank you for showing me the apartment at 123 Downtown Ave yesterday. I was very impressed with the modern finishes and the layout is exactly what I've been looking for.

I'd like to schedule a second viewing with my wife this weekend if possible. Could Saturday morning work?

Also, I wanted to ask about the parking situation - is the spot included in the price or is it an additional cost?

Looking forward to hearing from you.

Best regards,
Michael`,
    preview: "Thank you for showing me the apartment at 123 Downtown Ave yesterday...",
    status: "unread",
    folder: "inbox",
    starred: true,
    relatedTo: { type: "contact", id: "c1" },
    receivedAt: "2025-01-11T08:30:00Z",
    readAt: null,
  },
  {
    id: "em2",
    from: { name: "Emily Rodriguez", email: "emily.r@email.com" },
    to: [{ name: "Sarah Johnson", email: "sarah.johnson@propflow.com" }],
    subject: "Question about marketing strategy for my property",
    body: `Dear Sarah,

I hope this email finds you well. I wanted to follow up on our conversation about selling my property.

I've been thinking about the pricing strategy and I'm wondering if we should consider staging the home before listing it. What are your thoughts on this?

Also, could you send me a list of the online portals where the property will be advertised?

Thank you for all your help with this process.

Best,
Emily`,
    preview: "I hope this email finds you well. I wanted to follow up on our conversation...",
    status: "unread",
    folder: "inbox",
    starred: false,
    relatedTo: { type: "contact", id: "c2" },
    receivedAt: "2025-01-11T07:15:00Z",
    readAt: null,
  },
  {
    id: "em3",
    from: { name: "David Park", email: "d.park@investment.com" },
    to: [{ name: "Sarah Johnson", email: "sarah.johnson@propflow.com" }],
    subject: "Commercial property portfolio discussion",
    body: `Sarah,

Following our meeting last week, I've reviewed the investment analysis you provided for the Tech Park property.

The numbers look promising. I'd like to discuss:
1. Potential for multi-tenant configuration
2. Expected ROI timeline
3. Possibility of viewing similar properties in the area

When would be a good time for a call this week?

Regards,
David Park
Park Investment Group`,
    preview: "Following our meeting last week, I've reviewed the investment analysis...",
    status: "read",
    folder: "inbox",
    starred: true,
    relatedTo: { type: "contact", id: "c4" },
    receivedAt: "2025-01-10T16:45:00Z",
    readAt: "2025-01-10T17:30:00Z",
  },
  {
    id: "em4",
    from: { name: "Lisa Thompson", email: "lisa.t@email.com" },
    to: [{ name: "Sarah Johnson", email: "sarah.johnson@propflow.com" }],
    subject: "Kids loved the backyard!",
    body: `Hi Sarah!

Just wanted to thank you again for the tour of the Oak Lane property yesterday. The kids absolutely loved the backyard and my husband was impressed with the garage space.

We're definitely very interested. We'd like to know more about the school district and any HOA fees before making a decision.

Can we schedule another visit for this weekend?

Thanks!
Lisa`,
    preview: "Just wanted to thank you again for the tour of the Oak Lane property...",
    status: "read",
    folder: "inbox",
    starred: false,
    relatedTo: { type: "contact", id: "c5" },
    receivedAt: "2025-01-10T10:20:00Z",
    readAt: "2025-01-10T11:00:00Z",
  },
  {
    id: "em5",
    from: { name: "atHome.lu Leads", email: "leads@athome.lu" },
    to: [{ name: "Sarah Johnson", email: "sarah.johnson@propflow.com" }],
    subject: "New inquiry for PROP-001",
    body: `You have received a new inquiry for your listing:

Property: 123 Downtown Ave, Unit 5A
Inquiry from: James Wilson
Email: j.wilson@email.com
Phone: +352 661 345 678

Message: "I'm an investor looking at rental properties in the downtown area. This property caught my eye. What's the potential rental income?"

Reply directly to engage with this lead.`,
    preview: "You have received a new inquiry for your listing: 123 Downtown Ave...",
    status: "unread",
    folder: "inbox",
    starred: false,
    relatedTo: { type: "property", id: "p1" },
    receivedAt: "2025-01-11T06:00:00Z",
    readAt: null,
  },
  {
    id: "em6",
    from: { name: "Sarah Johnson", email: "sarah.johnson@propflow.com" },
    to: [{ name: "Michael Chen", email: "michael.chen@email.com" }],
    subject: "Re: Downtown apartment - Viewing confirmation",
    body: `Dear Michael,

Thank you for your interest in the Downtown Ave apartment. I'm delighted to hear you'd like to schedule a second viewing.

Saturday at 10:00 AM works perfectly. I've blocked out 90 minutes so we can go through everything in detail with your wife.

Regarding parking - yes, one dedicated parking spot in the underground garage is included in the price. Additional spots can be purchased for €35,000 each if needed.

Please let me know if Saturday works for you.

Best regards,
Sarah Johnson
PropFlow Realty`,
    preview: "Thank you for your interest in the Downtown Ave apartment...",
    status: "sent",
    folder: "sent",
    starred: false,
    relatedTo: { type: "contact", id: "c1" },
    receivedAt: "2025-01-10T14:00:00Z",
    readAt: null,
  },
]

export const emailAccounts: EmailAccount[] = [
  {
    id: "ea1",
    email: "sarah.johnson@propflow.com",
    provider: "gmail",
    name: "Work Email",
    connected: true,
    lastSyncedAt: "2025-01-11T09:00:00Z",
  },
]

// Helper functions
export function getContactById(id: string): Contact | undefined {
  return contacts.find((c) => c.id === id)
}

export function getPropertyById(id: string): Property | undefined {
  return properties.find((p) => p.id === id)
}

export function getDealById(id: string): Deal | undefined {
  return deals.find((d) => d.id === id)
}

export function getVisitsByDate(date: string): Visit[] {
  return visits.filter((v) => v.date === date)
}

export function getContactsByStatus(status: Contact["status"]): Contact[] {
  return contacts.filter((c) => c.status === status)
}

export function getPropertiesByStatus(status: Property["status"]): Property[] {
  return properties.filter((p) => p.status === status)
}

export function getDealsByStatus(status: Deal["status"]): Deal[] {
  return deals.filter((d) => d.status === status)
}

export function getOperationalDocumentById(id: string): OperationalDocument | undefined {
  return operationalDocuments.find((d) => d.id === id)
}

export function getOperationalDocumentsByPropertyId(propertyId: string): OperationalDocument[] {
  return operationalDocuments.filter((d) => d.propertyId === propertyId)
}

export function getOperationalDocumentsByContractId(contractId: string): OperationalDocument[] {
  return operationalDocuments.filter((d) => d.contractId === contractId)
}

export function getCommercialDocumentById(id: string): CommercialDocument | undefined {
  return commercialDocuments.find((d) => d.id === id)
}

export function getCommercialDocumentsByPropertyId(propertyId: string): CommercialDocument[] {
  return commercialDocuments.filter((d) => d.propertyId === propertyId)
}

export function getListingById(id: string): Listing | undefined {
  return listings.find((l) => l.id === id)
}

export function getPortalById(id: string): Portal | undefined {
  return portals.find((p) => p.id === id)
}

export function getCommissionById(id: string): Commission | undefined {
  return commissions.find((c) => c.id === id)
}

export function getInvoiceById(id: string): Invoice | undefined {
  return invoices.find((i) => i.id === id)
}

export function getTaskById(id: string): Task | undefined {
  return tasks.find((t) => t.id === id)
}

export function getEmailById(id: string): Email | undefined {
  return emails.find((e) => e.id === id)
}

export function getEmailAccountById(id: string): EmailAccount | undefined {
  return emailAccounts.find((ea) => ea.id === id)
}

export function getPropertiesByListingId(listingId: string): Property[] {
  return properties.filter((p) => p.id === listingId)
}

export function getContactsByListingId(listingId: string): Contact[] {
  return contacts.filter((c) => c.ownerId === listingId)
}

export function getDealsByListingId(listingId: string): Deal[] {
  return deals.filter((d) => d.propertyId === listingId)
}

export function getVisitsByListingId(listingId: string): Visit[] {
  return visits.filter((v) => v.propertyId === listingId)
}

export function getContractsByListingId(listingId: string): Contract[] {
  return contracts.filter((c) => c.propertyId === listingId)
}

export function getCommissionsByDealId(dealId: string): Commission[] {
  return commissions.filter((c) => c.dealId === dealId)
}

export function getInvoicesByDealId(dealId: string): Invoice[] {
  return invoices.filter((i) => i.dealId === dealId)
}

export function getTasksByDealId(dealId: string): Task[] {
  return tasks.filter((t) => t.relatedTo?.id === dealId && t.relatedTo?.type === "deal")
}

export function getCommissionsByAgentId(agentId: string): Commission[] {
  return commissions.filter((c) => c.agentId === agentId)
}

export function getInvoicesByAgentId(agentId: string): Invoice[] {
  return invoices.filter((i) => i.contactId === agentId)
}

export function getTasksByAgentId(agentId: string): Task[] {
  return tasks.filter((t) => t.assignedTo === agentId)
}

export function getCommissionsByContactId(contactId: string): Commission[] {
  return commissions.filter((c) => c.dealId && getDealsByContactId(contactId).some((d) => d.id === c.dealId))
}

export function getInvoicesByContactId(contactId: string): Invoice[] {
  return invoices.filter((i) => i.dealId && getDealsByContactId(contactId).some((d) => d.id === i.dealId))
}

export function getTasksByContactId(contactId: string): Task[] {
  return tasks.filter((t) => t.relatedTo?.id === contactId && t.relatedTo?.type === "contact")
}

export function getCommissionsByPropertyId(propertyId: string): Commission[] {
  return commissions.filter((c) => c.dealId && getDealsByPropertyId(propertyId).some((d) => d.id === c.dealId))
}

export function getInvoicesByPropertyId(propertyId: string): Invoice[] {
  return invoices.filter((i) => i.dealId && getDealsByPropertyId(propertyId).some((d) => d.id === i.dealId))
}

export function getTasksByPropertyId(propertyId: string): Task[] {
  return tasks.filter((t) => t.relatedTo?.id === propertyId && t.relatedTo?.type === "property")
}

export function getCommissionsByVisitId(visitId: string): Commission[] {
  return commissions.filter((c) => c.dealId && getDealsByVisitId(visitId).some((d) => d.id === c.dealId))
}

export function getInvoicesByVisitId(visitId: string): Invoice[] {
  return invoices.filter((i) => i.dealId && getDealsByVisitId(visitId).some((d) => d.id === i.dealId))
}

export function getTasksByVisitId(visitId: string): Task[] {
  return tasks.filter((t) => t.relatedTo?.id === visitId && t.relatedTo?.type === "visit")
}

export function getCommissionsByContractId(contractId: string): Commission[] {
  return commissions.filter((c) => c.dealId && getDealsByContractId(contractId).some((d) => d.id === c.dealId))
}

export function getInvoicesByContractId(contractId: string): Invoice[] {
  return invoices.filter((i) => i.dealId && getDealsByContractId(contractId).some((d) => d.id === i.dealId))
}

export function getTasksByContractId(contractId: string): Task[] {
  return tasks.filter((t) => t.relatedTo?.id === contractId && t.relatedTo?.type === "contract")
}

export function getDealsByContactId(contactId: string): Deal[] {
  return deals.filter((d) => d.buyerId === contactId)
}

export function getDealsByPropertyId(propertyId: string): Deal[] {
  return deals.filter((d) => d.propertyId === propertyId)
}

export function getDealsByVisitId(visitId: string): Deal[] {
  return deals.filter((d) => d.propertyId === getVisitById(visitId)?.propertyId)
}

export function getDealsByContractId(contractId: string): Deal[] {
  return deals.filter((d) => d.id === getContractById(contractId)?.dealId)
}

export function getContactsByPropertyId(propertyId: string): Contact[] {
  return contacts.filter((c) => c.ownerId === propertyId)
}

export function getVisitsByPropertyId(propertyId: string): Visit[] {
  return visits.filter((v) => v.propertyId === propertyId)
}

export function getContractsByPropertyId(propertyId: string): Contract[] {
  return contracts.filter((c) => c.propertyId === propertyId)
}

// Helper functions for undeclared variables
function getVisitById(id: string): Visit | undefined {
  return visits.find((v) => v.id === id)
}

function getContractById(id: string): Contract | undefined {
  return contracts.find((c) => c.id === id)
}
