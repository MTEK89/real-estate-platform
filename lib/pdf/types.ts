// PDF Generation Types
// Re-export existing data types from the original pdf-generator
export type {
  MandateData,
  RentalContractData,
  OfferLetterData,
  VisitReportData,
  EtatDesLieuxData,
  SaleContractData,
  SaleContractVEFAData,
  KeyHandoverData,
  NoticeDescriptiveData,
  PriceListData,
  ValuationReportData,
} from "@/lib/pdf-generator"

// Document types supported by the PDF system
export type DocumentType =
  | "mandate"
  | "invoice"
  | "rental"
  | "offer"
  | "visit"
  | "etat_des_lieux"
  | "sale_existing"
  | "sale_vefa"
  | "key_handover"
  | "notice_descriptive"
  | "property_brochure"
  | "price_list"
  | "valuation_report"
  | "pdf_writer"
  // Marketing & Sales
  | "window_display"
  | "cma"
  | "open_house"
  // Marketing (new)
  | "property_brochure_new"
  | "property_postcard"
  | "listing_presentation"
  | "property_feature_sheet"
  | "social_media_post"
  | "email_marketing"
  // Client packages
  | "buyer_welcome_kit"
  | "seller_packet"
  | "client_intake_form"

export interface PdfWriterData {
  title: string
  reference?: string | null
  body: string
  createdAt?: string
  mode?: "strict" | "format" | "rewrite"
  assets?: Array<{
    path: string
    key?: string | null
    filename?: string | null
    contentType?: string | null
    caption?: string | null
    url?: string | null
  }> | null
  layout?: {
    summary?: string | null
    keyPoints?: string[] | null
    keyFacts?: Array<{ label: string; value: string }> | null
    sections?: Array<{
      title: string
      body?: string | null
      bullets?: string[] | null
      numbered?: string[] | null
      imageUrls?: string[] | null
      images?: Array<{ url: string; caption?: string | null }> | null
      imageKeys?: string[] | null
    }> | null
  } | null
}

// PDF Generation request
export interface PDFGenerationRequest {
  documentType: DocumentType
  data: Record<string, unknown>
  brandConfig?: Partial<BrandConfig>
  options?: PDFGenerationOptions
}

export interface PDFGenerationOptions {
  filename?: string
  isDraft?: boolean
  includeWatermark?: boolean
}

// Brand configuration for white-label support
export interface BrandConfig {
  // Identity
  agencyId: string
  agencyName: string
  logo: string // Base64 encoded image or URL
  registrationNumber: string

  // Contact
  address: string
  phone: string
  email: string
  website: string

  // Colors (hex values)
  colors: {
    primary: string      // Headers, titles
    secondary: string    // Accents, section backgrounds
    text: string         // Body text
    muted: string        // Secondary text, labels
    border: string       // Lines, table borders
    highlight: string    // Important callouts
  }

  // Legal information (French real estate requirements)
  legal: {
    // Luxembourg-oriented baseline (keep legacy FR fields optional for backwards compatibility).
    companyType: string            // SARL / SA / Sàrl-S / etc.
    capitalAmount?: string         // Capital social (optional)
    rcs: string                    // Luxembourg RCS (e.g., "B123456")
    vatNumber?: string             // Luxembourg VAT (TVA) (e.g., "LU12345678")
    establishmentPermit?: string   // Autorisation d'établissement (optional)
    insuranceNumber: string        // Professional indemnity insurance / RCP

    // Legacy (FR) fields (optional; do not rely on them for Luxembourg)
    siret?: string
    professionalCard?: string
    mediatorInfo?: string
  }

  // Layout options
  layout: {
    pageMargin: number        // in points (72pt = 1 inch)
    headerHeight: number
    footerHeight: number
    showPageNumbers: boolean
    pageNumberFormat: "Page X sur Y" | "X/Y" | "X"
  }
}

// Shared component props
export interface HeaderProps {
  brand: BrandConfig
  documentTitle: string
  documentRef?: string
}

export interface FooterProps {
  brand: BrandConfig
  generatedDate?: Date
}

export interface SignatureBlockProps {
  signatories: Array<{
    role: string        // "Le Mandant", "Le Locataire", etc.
    name: string
    showLuApprouve?: boolean
  }>
  location?: string
  date?: string
}

export interface SectionProps {
  number?: number | string
  title: string
  children: React.ReactNode
  highlight?: boolean
}

export interface DataTableProps {
  rows: Array<{
    label: string
    value: string | number
  }>
  brand: BrandConfig
}
