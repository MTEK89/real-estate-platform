// PDF Generation System
// Main entry point for the white-label PDF document generation

// Types
export type {
  BrandConfig,
  DocumentType,
  PDFGenerationRequest,
  PDFGenerationOptions,
  PdfWriterData,
  HeaderProps,
  FooterProps,
  SignatureBlockProps,
  SectionProps,
  DataTableProps,
} from "./types"

// Re-export data types from original generator
export type {
  MandateData,
  InvoiceData,
  InvoiceDocument,
  InvoiceLineItem,
  InvoiceTotals,
  RentalContractData,
  OfferLetterData,
  VisitReportData,
  EtatDesLieuxData,
  SaleContractData,
  SaleContractVEFAData,
  KeyHandoverData,
  NoticeDescriptiveData,
  PropertyBrochureData,
  PriceListData,
  ValuationReportData,
  // Marketing & Sales
  WindowDisplayData,
  CMAData,
  OpenHouseData,
  PropertyAnnouncementData,
  InvestmentAnalysisData,
  // New Property Marketing Documents
  ListingPresentationData,
  PropertyFeatureSheetData,
  SocialMediaPostData,
  EmailMarketingData,
  PropertyPostcardData,
  // Client Package Documents
  BuyerWelcomeKitData,
  SellerPacketData,
} from "@/lib/pdf-generator"

// Brand Configuration
export { defaultBrandConfig, mergeBrandConfig, brandThemes } from "./config/brand-config"
export type { BrandTheme } from "./config/brand-config"

// Shared Components
export {
  Header,
  Footer,
  PageWrapper,
  MultiPageWrapper,
  Section,
  Article,
  DataTable,
  InfoBox,
  TwoColumn,
  SignatureBlock,
  SingleSignature,
  Paragraph,
  LabelValue,
  BulletList,
  CheckboxList,
  Callout,
  AmountDisplay,
} from "./components/shared"

// Document Templates
export {
  MandateTemplate,
  InvoiceTemplate,
  RentalContractTemplate,
  OfferLetterTemplate,
  PdfWriterTemplate,
  SaleContractTemplate,
  SaleContractVEFATemplate,
  VisitReportTemplate,
  EtatDesLieuxTemplate,
  KeyHandoverTemplate,
  NoticeDescriptiveTemplate,
  ValuationReportTemplate,
  PropertyBrochureTemplate,
  PriceListTemplate,
  // Marketing & Sales
  WindowDisplayTemplate,
  CMATemplate,
  OpenHouseTemplate,
  // New Property Marketing Templates
  JustListedPostcardTemplate,
  ListingPresentationTemplate,
  PropertyFeatureSheetTemplate,
  SocialMediaTemplate,
  EmailMarketingTemplate,
  // Client Package Templates
  BuyerWelcomeKitTemplate,
  SellerPacketTemplate,
  ClientIntakeFormTemplate,
} from "./components/templates"

// Utilities
export {
  formatDate,
  formatShortDate,
  formatCurrency,
  formatNumber,
  numberToWords,
  getPropertyTypeLabel,
  getConditionLabel,
  getMandateTypeLabel,
  getFinancingTypeLabel,
} from "./utils/formatters"
