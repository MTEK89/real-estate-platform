import { renderToBuffer } from "@react-pdf/renderer"
import {
  MandateTemplate,
  InvoiceTemplate,
  RentalContractTemplate,
  OfferLetterTemplate,
  VisitReportTemplate,
  EtatDesLieuxTemplate,
  SaleContractTemplate,
  SaleContractVEFATemplate,
  KeyHandoverTemplate,
  NoticeDescriptiveTemplate,
  ValuationReportTemplate,
  PropertyBrochureTemplate,
  PriceListTemplate,
  WindowDisplayTemplate,
  CMATemplate,
  OpenHouseTemplate,
  JustListedPostcardTemplate,
  ListingPresentationTemplate,
  PropertyFeatureSheetTemplate,
  SocialMediaTemplate,
  EmailMarketingTemplate,
  BuyerWelcomeKitTemplate,
  SellerPacketTemplate,
  ClientIntakeFormTemplate,
  PdfWriterTemplate,
  mergeBrandConfig,
} from "@/lib/pdf"
import type {
  BrandConfig,
  MandateData,
  InvoiceData,
  RentalContractData,
  OfferLetterData,
  VisitReportData,
  EtatDesLieuxData,
  SaleContractData,
  SaleContractVEFAData,
  KeyHandoverData,
  NoticeDescriptiveData,
  ValuationReportData,
  PropertyBrochureData,
  PriceListData,
  WindowDisplayData,
  CMAData,
  OpenHouseData,
  PropertyPostcardData,
  ListingPresentationData,
  PropertyFeatureSheetData,
  SocialMediaPostData,
  EmailMarketingData,
  BuyerWelcomeKitData,
  SellerPacketData,
  PdfWriterData,
} from "@/lib/pdf"

export type ExtendedDocumentType =
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
  | "valuation_report"
  | "property_brochure"
  | "price_list"
  | "window_display"
  | "cma"
  | "open_house"
  | "property_brochure_new"
  | "property_postcard"
  | "listing_presentation"
  | "property_feature_sheet"
  | "social_media_post"
  | "email_marketing"
  | "buyer_welcome_kit"
  | "seller_packet"
  | "client_intake_form"
  | "pdf_writer"

export type DocumentData =
  | MandateData
  | InvoiceData
  | RentalContractData
  | OfferLetterData
  | VisitReportData
  | EtatDesLieuxData
  | SaleContractData
  | SaleContractVEFAData
  | KeyHandoverData
  | NoticeDescriptiveData
  | ValuationReportData
  | PropertyBrochureData
  | PriceListData
  | WindowDisplayData
  | CMAData
  | OpenHouseData
  | PropertyPostcardData
  | ListingPresentationData
  | PropertyFeatureSheetData
  | SocialMediaPostData
  | EmailMarketingData
  | BuyerWelcomeKitData
  | SellerPacketData
  | PdfWriterData

function absolutizeAssetUrl(origin: string, value: string): string {
  if (!value) return value
  if (value.startsWith("data:")) return value
  if (value.startsWith("http://") || value.startsWith("https://")) return value
  if (value.startsWith("//")) return `https:${value}`
  if (value.startsWith("/")) return `${origin}${value}`
  return value
}

function normalizePdfData(origin: string, rawData: DocumentData): DocumentData {
  const data: any = rawData

  if (data?.property?.images && Array.isArray(data.property.images)) {
    data.property = {
      ...data.property,
      images: data.property.images.map((src: string) => absolutizeAssetUrl(origin, src)),
    }
  }

  if (typeof data?.agent?.photo === "string") {
    data.agent = { ...data.agent, photo: absolutizeAssetUrl(origin, data.agent.photo) }
  }

  if (typeof data?.agency?.logo === "string") {
    data.agency = { ...data.agency, logo: absolutizeAssetUrl(origin, data.agency.logo) }
  }

  return data
}

export async function generatePdfBuffer(args: {
  documentType: ExtendedDocumentType
  data: DocumentData
  brandConfig?: Partial<BrandConfig>
  origin: string
}): Promise<{ pdfBuffer: Buffer; brand: BrandConfig }>
{
  const { documentType, data, brandConfig: partialBrandConfig, origin } = args
  const brand = mergeBrandConfig(partialBrandConfig)
  if (typeof (brand as any)?.logo === "string") {
    brand.logo = absolutizeAssetUrl(origin, brand.logo)
  }
  const normalizedData = normalizePdfData(origin, data)

  let pdfBuffer: Buffer

  switch (documentType) {
    case "mandate":
      pdfBuffer = await renderToBuffer(<MandateTemplate data={normalizedData as MandateData} brand={brand} />)
      break
    case "invoice":
      pdfBuffer = await renderToBuffer(<InvoiceTemplate data={normalizedData as InvoiceData} brand={brand} />)
      break
    case "rental":
      pdfBuffer = await renderToBuffer(<RentalContractTemplate data={normalizedData as RentalContractData} brand={brand} />)
      break
    case "offer":
      pdfBuffer = await renderToBuffer(<OfferLetterTemplate data={normalizedData as OfferLetterData} brand={brand} />)
      break
    case "sale_existing":
      pdfBuffer = await renderToBuffer(<SaleContractTemplate data={normalizedData as SaleContractData} brand={brand} />)
      break
    case "sale_vefa":
      pdfBuffer = await renderToBuffer(<SaleContractVEFATemplate data={normalizedData as SaleContractVEFAData} brand={brand} />)
      break
    case "visit":
      pdfBuffer = await renderToBuffer(<VisitReportTemplate data={normalizedData as VisitReportData} brand={brand} />)
      break
    case "etat_des_lieux":
      pdfBuffer = await renderToBuffer(<EtatDesLieuxTemplate data={normalizedData as EtatDesLieuxData} brand={brand} />)
      break
    case "key_handover":
      pdfBuffer = await renderToBuffer(<KeyHandoverTemplate data={normalizedData as KeyHandoverData} brand={brand} />)
      break
    case "notice_descriptive":
      pdfBuffer = await renderToBuffer(<NoticeDescriptiveTemplate data={normalizedData as NoticeDescriptiveData} brand={brand} />)
      break
    case "valuation_report":
      pdfBuffer = await renderToBuffer(<ValuationReportTemplate data={normalizedData as ValuationReportData} brand={brand} />)
      break
    case "property_brochure":
      pdfBuffer = await renderToBuffer(<PropertyBrochureTemplate data={normalizedData as PropertyBrochureData} brand={brand} />)
      break
    case "price_list":
      pdfBuffer = await renderToBuffer(<PriceListTemplate data={normalizedData as PriceListData} brand={brand} />)
      break
    case "window_display":
      pdfBuffer = await renderToBuffer(<WindowDisplayTemplate data={normalizedData as WindowDisplayData} brand={brand} />)
      break
    case "cma":
      pdfBuffer = await renderToBuffer(<CMATemplate data={normalizedData as CMAData} brand={brand} />)
      break
    case "open_house":
      pdfBuffer = await renderToBuffer(<OpenHouseTemplate data={normalizedData as OpenHouseData} brand={brand} />)
      break
    case "property_brochure_new":
      pdfBuffer = await renderToBuffer(<PropertyBrochureTemplate data={normalizedData as any} brand={brand} />)
      break
    case "property_postcard":
      pdfBuffer = await renderToBuffer(<JustListedPostcardTemplate data={normalizedData as PropertyPostcardData} brand={brand} />)
      break
    case "listing_presentation":
      pdfBuffer = await renderToBuffer(<ListingPresentationTemplate data={normalizedData as ListingPresentationData} brand={brand} />)
      break
    case "property_feature_sheet":
      pdfBuffer = await renderToBuffer(<PropertyFeatureSheetTemplate data={normalizedData as PropertyFeatureSheetData} brand={brand} />)
      break
    case "social_media_post":
      pdfBuffer = await renderToBuffer(<SocialMediaTemplate data={normalizedData as SocialMediaPostData} brand={brand} />)
      break
    case "email_marketing":
      pdfBuffer = await renderToBuffer(<EmailMarketingTemplate data={normalizedData as EmailMarketingData} brand={brand} />)
      break
    case "buyer_welcome_kit":
      pdfBuffer = await renderToBuffer(<BuyerWelcomeKitTemplate data={normalizedData as BuyerWelcomeKitData} brand={brand} />)
      break
    case "seller_packet":
      pdfBuffer = await renderToBuffer(<SellerPacketTemplate data={normalizedData as SellerPacketData} brand={brand} />)
      break
    case "client_intake_form":
      pdfBuffer = await renderToBuffer(<ClientIntakeFormTemplate data={normalizedData as any} brand={brand} />)
      break
    case "pdf_writer":
      pdfBuffer = await renderToBuffer(<PdfWriterTemplate data={normalizedData as PdfWriterData} brand={brand} />)
      break
    default:
      throw new Error(`Unsupported document type: ${documentType}`)
  }

  return { pdfBuffer, brand }
}
