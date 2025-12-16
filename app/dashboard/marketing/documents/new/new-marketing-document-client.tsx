"use client"

import type React from "react"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useDataStore } from "@/lib/data-store"
import type {
  CMAData,
  EmailMarketingData,
  ListingPresentationData,
  OpenHouseData,
  PropertyFeatureSheetData,
  SocialMediaPostData,
  WindowDisplayData,
  BuyerWelcomeKitData,
  SellerPacketData,
} from "@/lib/pdf-generator"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Calendar,
  Download,
  Eye,
  LayoutGrid,
  Loader2,
  Sparkles,
  TrendingUp,
  Users,
  FileText,
  Mail,
  Share2,
  Camera,
  ChevronDown,
  ChevronRight,
  Megaphone,
} from "lucide-react"
import { toast } from "sonner"

type MarketingDocType = "window_display" | "cma" | "open_house" | "property_brochure" | "property_postcard" | "listing_presentation" | "property_feature_sheet" | "social_media_post" | "email_marketing" | "buyer_welcome_kit" | "seller_packet" | "client_intake_form"

const DEFAULT_LUX_PORTALS = ["atHome.lu", "IMMOTOP.LU", "Wortimmo.lu"]

const TEMPLATE_CATEGORIES = [
  {
    id: "property-marketing",
    name: "Marketing Immobilier",
    icon: Megaphone,
    templates: [
      {
        id: "property_brochure",
        name: "Brochure Complète",
        description: "Présentation détaillée du bien avec photos et caractéristiques",
        icon: FileText,
        featured: true,
      },
      {
        id: "property_postcard",
        name: "Carte Postale",
        description: "Just Listed/Just Sold - Format A6/A5 pour publipostage",
        icon: Camera,
      },
      {
        id: "property_feature_sheet",
        name: "Fiche Détaillée",
        description: "Caractéristiques techniques et points forts du bien",
        icon: FileText,
      },
    ],
  },
  {
    id: "client-communication",
    name: "Communication Client",
    icon: Users,
    templates: [
      {
        id: "listing_presentation",
        name: "Présentation de Vente",
        description: "Présentation professionnelle pour vendeurs (20-30 pages)",
        icon: TrendingUp,
        featured: true,
      },
      {
        id: "social_media_post",
        name: "Publication Réseaux Sociaux",
        description: "Posts optimisés pour Instagram, Facebook, LinkedIn",
        icon: Share2,
      },
      {
        id: "email_marketing",
        name: "Email Marketing",
        description: "Campagnes emails pour acheteurs et vendeurs",
        icon: Mail,
      },
    ],
  },
  {
    id: "client-packages",
    name: "Dossiers Client",
    icon: Users,
    templates: [
      {
        id: "buyer_welcome_kit",
        name: "Kit d'Achat Immobilier",
        description: "Guide complet 5 pages pour acquéreurs",
        icon: FileText,
        featured: true,
      },
      {
        id: "seller_packet",
        name: "Dossier de Vente",
        description: "Présentation complète 4 pages pour vendeurs",
        icon: FileText,
        featured: true,
      },
      {
        id: "client_intake_form",
        name: "Formulaire d'Information",
        description: "Fiche de renseignement acheteur/vendeur",
        icon: FileText,
      },
    ],
  },
  {
    id: "existing",
    name: "Documents Existant",
    icon: LayoutGrid,
    templates: [
      {
        id: "window_display",
        name: "Vitrine / Window Display",
        description: "Carte vitrine prête à imprimer",
        icon: LayoutGrid,
      },
      {
        id: "cma",
        name: "Rapport d'estimation (CMA)",
        description: "Comparative Market Analysis pour vendeurs",
        icon: TrendingUp,
      },
      {
        id: "open_house",
        name: "Flyer Portes Ouvertes",
        description: "Annonce d'événement + horaires",
        icon: Users,
      },
    ],
  },
]

// Flatten all templates for backward compatibility
const ALL_TEMPLATES = TEMPLATE_CATEGORIES.flatMap(category => category.templates)

export function NewMarketingDocumentClient({
  initialType,
  initialPropertyId,
  initialAgentId,
}: {
  initialType?: string
  initialPropertyId?: string
  initialAgentId?: string
}) {
  const router = useRouter()
  const { contacts, properties, addMarketingDocument, updateMarketingDocument } = useDataStore()
  const [isGenerating, setIsGenerating] = useState(false)

  const initialDocType: MarketingDocType = ALL_TEMPLATES.some((t) => t.id === initialType)
    ? (initialType as MarketingDocType)
    : "window_display"

  const [docType, setDocType] = useState<MarketingDocType>(initialDocType)
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialPropertyId || "")
  const [selectedAgentId, setSelectedAgentId] = useState(initialAgentId || "")

  // Window display
  const [displaySize, setDisplaySize] = useState<"A4" | "A3">("A4")
  const [priceDisplay, setPriceDisplay] = useState<"full" | "from" | "hidden">("full")
  const [windowBadge, setWindowBadge] = useState("")

  // CMA
  const [suggestedLow, setSuggestedLow] = useState("")
  const [suggestedHigh, setSuggestedHigh] = useState("")
  const [suggestedRecommended, setSuggestedRecommended] = useState("")

  // Open house
  const [openHouseDate, setOpenHouseDate] = useState("")
  const [openHouseStartTime, setOpenHouseStartTime] = useState("10:00")
  const [openHouseEndTime, setOpenHouseEndTime] = useState("12:00")
  const [openHouseHighlights, setOpenHouseHighlights] = useState("")
  const [notes, setNotes] = useState("")

  const [includePhotos, setIncludePhotos] = useState(true)
  const [includeQrCode, setIncludeQrCode] = useState(false)
  const [intakeType, setIntakeType] = useState<"buyer" | "seller">("buyer")
  const requiresProperty = docType !== "buyer_welcome_kit" && docType !== "client_intake_form"

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === selectedPropertyId) || null,
    [properties, selectedPropertyId],
  )
  const selectedAgent = useMemo(() => contacts.find((c) => c.id === selectedAgentId) || null, [contacts, selectedAgentId])

  const [marketingDocId, setMarketingDocId] = useState<string | null>(null)

  useEffect(() => {
    if (requiresProperty && !selectedPropertyId && properties.length > 0) {
      setSelectedPropertyId(properties[0].id)
    }
  }, [requiresProperty, selectedPropertyId, properties])

  const [agencyInfo, setAgencyInfo] = useState<{ name: string; phone: string; website: string; address: string; email: string }>({
    name: "Your Agency",
    phone: "",
    website: "",
    address: "",
    email: "",
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/v1/settings")
        if (!res.ok) return
        const json = await res.json()
        const agency = json?.agency
        if (!agency || cancelled) return
        setAgencyInfo({
          name: agency.name || "Your Agency",
          phone: agency.phone || "",
          website: agency.website || "",
          address: agency.address || "",
          email: agency.email || "",
        })
      } catch {
        // ignore
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const defaultAgency = {
    name: agencyInfo.name,
    phone: agencyInfo.phone,
    website: agencyInfo.website,
    logo: undefined,
  }

  const defaultAgent = {
    name: selectedAgent ? `${selectedAgent.firstName} ${selectedAgent.lastName}` : "Agent Immobilier",
    phone: selectedAgent?.phone || agencyInfo.phone || "",
    email: selectedAgent?.email || agencyInfo.email || "",
    title: "Conseiller Immobilier",
    photo: undefined,
  }

  const buildMarketingDocumentData = () => {
    if (docType === "client_intake_form") {
      const data = {
        type: intakeType as const,
        agency: {
          name: defaultAgency.name,
          address: agencyInfo.address || "",
          phone: defaultAgency.phone,
          website: defaultAgency.website,
        },
        agent: {
          name: defaultAgent.name,
          phone: defaultAgent.phone,
          email: defaultAgent.email,
        },
      }
      return { type: "client_intake_form" as const, data }
    }

    if (!selectedProperty) return null

    if (docType === "window_display") {
      const data: WindowDisplayData = {
        property: selectedProperty,
        agency: defaultAgency,
        displaySize,
        priceDisplay,
        badge: windowBadge || undefined,
        qrCodeUrl: includeQrCode ? "https://example.com/property" : undefined,
      }
      return { type: "window_display" as const, data }
    }

    if (docType === "cma") {
      const data: CMAData = {
        property: selectedProperty,
        preparedFor: {
          name: selectedAgent ? `${selectedAgent.firstName} ${selectedAgent.lastName}` : "Client",
          email: selectedAgent?.email,
        },
        preparedBy: defaultAgent,
        agency: defaultAgency,
        suggestedPrice: {
          low: Number(suggestedLow) || selectedProperty.price * 0.9,
          recommended: Number(suggestedRecommended) || selectedProperty.price,
          high: Number(suggestedHigh) || selectedProperty.price * 1.1,
        },
        comparables: [],
        marketAnalysis: {
          averagePricePerSqm: Math.round(selectedProperty.price / (selectedProperty.characteristics?.surface || 100)),
          medianPrice: selectedProperty.price,
          averageDaysOnMarket: 45,
          inventoryLevel: "balanced",
          marketTrend: "stable",
          demandLevel: "moderate",
        },
        strengths: ["Emplacement recherché", "Bon état général", "Luminosité"],
        improvements: ["Cuisine à moderniser", "Double vitrage à installer"],
        marketingRecommendations: ["Photos professionnelles", "Visite virtuelle", "Publication sur portails majeurs"],
        generatedAt: new Date().toISOString(),
      }
      return { type: "cma" as const, data }
    }

    if (docType === "open_house") {
      const highlights = openHouseHighlights
        ? openHouseHighlights.split(",").map((h) => h.trim()).filter(Boolean)
        : ["Lumineux", "Calme", "Proche transports"]

      const data: OpenHouseData = {
        property: selectedProperty,
        agency: defaultAgency,
        agent: {
          name: defaultAgent.name,
          phone: defaultAgent.phone,
          photo: undefined,
        },
        event: {
          date: openHouseDate || new Date().toISOString(),
          startTime: openHouseStartTime,
          endTime: openHouseEndTime,
          address: `${selectedProperty.address.street}, ${selectedProperty.address.postalCode} ${selectedProperty.address.city}`,
          instructions: notes || undefined,
        },
        highlights,
        mainPhoto: includePhotos ? selectedProperty.images?.[0] : undefined,
        qrCodeUrl: includeQrCode ? "https://example.com/property" : undefined,
        rsvpRequired: false,
        rsvpContact: undefined,
      }
      return { type: "open_house" as const, data }
    }

    // New document types
    if (docType === "property_brochure") {
      const data = {
        property: selectedProperty,
        agent: {
          name: defaultAgent.name,
          phone: defaultAgent.phone,
          email: defaultAgent.email,
          photo: undefined,
          license: undefined,
        },
        agency: {
          ...defaultAgency,
          address: agencyInfo.address || "",
        },
        features: ["Luminosité exceptionnelle", "Hauteur sous plafond", "Parquet massif", "Double vitrage", "Cuisine équipée"],
        highlights: [
          {
            title: "Emplacement de choix",
            description: "Situé dans le quartier recherché avec toutes les commodités à proximité",
          },
          {
            title: "Récemment rénové",
            description: "Travaux de rénovation complète réalisés en 2023",
          },
        ],
        nearbyAmenities: [
          { name: "École primaire", distance: "200m", type: "school" as const },
          { name: "Station de métro", distance: "300m", type: "transport" as const },
          { name: "Supermarché", distance: "500m", type: "shopping" as const },
        ],
        energyRating: {
          consumption: 150,
          emissions: 35,
          class: "D",
        },
        includeVirtualTour: includeQrCode,
        customMessage: notes || undefined,
      }
      return { type: "property_brochure" as const, data }
    }

    if (docType === "property_postcard") {
      const bedrooms = selectedProperty.characteristics?.bedrooms
      const rooms = selectedProperty.characteristics?.rooms
      const surface = selectedProperty.characteristics?.surface
      const features = [
        bedrooms ? `${bedrooms} chambres` : null,
        rooms ? `${rooms} pièces` : null,
        surface ? `${surface} m²` : null,
        selectedProperty.characteristics?.parking ? "Parking" : null,
        selectedProperty.characteristics?.balcony ? "Balcon" : null,
      ].filter(Boolean) as string[]

      const data = {
        type: "just_listed" as const,
        property: selectedProperty,
        agent: {
          name: defaultAgent.name,
          phone: defaultAgent.phone,
          email: defaultAgent.email,
          photo: undefined,
          license: undefined,
        },
        agency: defaultAgency,
        size: "A6" as const,
        orientation: "portrait" as const,
        headline: "Exceptionnel ! Bien de prestige disponible",
        price: selectedProperty.price,
        features: features.length > 0 ? features : ["Bien rare", "Emplacement premium", "À visiter"],
        qrCodeUrl: includeQrCode ? "https://example.com/property" : undefined,
        customMessage: notes || undefined,
      }
      return { type: "property_postcard" as const, data }
    }

    // Client Package Templates
    if (docType === "buyer_welcome_kit") {
      const data = {
        buyer: selectedAgent || {
          firstName: "Prénom",
          lastName: "Nom",
          email: "email@example.com",
          phone: "06 00 00 00 00",
          avatar: undefined,
          role: "client",
        },
        agent: {
          name: defaultAgent.name,
          phone: defaultAgent.phone,
          email: defaultAgent.email,
          photo: undefined,
        },
        agency: {
          ...defaultAgency,
          address: agencyInfo.address || "",
          about: "Agence immobilière spécialisée dans l'accompagnement des acquéreurs",
        },
        preferences: {
          propertyTypes: ["Appartement", "Maison"],
          locations: ["Luxembourg", "Esch-sur-Alzette", "Differdange"],
          priceRange: { min: 300000, max: 500000 },
        },
        timeline: {
          preApproval: true,
          desiredMoveDate: "2024-06-01",
          financingType: "Prêt bancaire",
        },
      }
      return { type: "buyer_welcome_kit" as const, data }
    }

    if (docType === "seller_packet") {
      const data = {
        seller: selectedAgent || {
          firstName: "Prénom",
          lastName: "Nom",
          email: "email@example.com",
          phone: "06 00 00 00 00",
          avatar: undefined,
          role: "client",
        },
        property: selectedProperty,
        agent: {
          name: defaultAgent.name,
          phone: defaultAgent.phone,
          email: defaultAgent.email,
          photo: undefined,
          experience: "10 ans",
          recentSales: 150,
        },
        agency: {
          ...defaultAgency,
          address: agencyInfo.address || "",
          about: "Agence immobilière leader dans votre secteur",
        },
        marketAnalysis: {
          currentDemand: "Forte",
          averageSaleTime: 45,
          recentSales: properties.slice(0, 5).map(p => ({
            address: p.address.street,
            price: p.price,
            surface: p.characteristics.surface,
            saleDate: new Date().toISOString(),
            daysOnMarket: Math.floor(Math.random() * 90),
          })),
        },
        servicesIncluded: [
          "Photographie professionnelle",
          "Visite virtuelle 360°",
          `Publication sur ${DEFAULT_LUX_PORTALS.join(", ")}`,
          "Suivi personnalisé",
          "Négociation",
          "Accompagnement jusqu'à la signature",
        ],
        commission: {
          percentage: 5,
          estimatedAmount: Math.round(selectedProperty.price * 0.05),
          includes: "Tous frais inclus - sans frais de dossier",
        },
      }
      return { type: "seller_packet" as const, data }
    }

    if (docType === "listing_presentation") {
      const toSqm = (surface: number) => (surface >= 300 ? Math.round(surface * 0.092903) : surface)

      const seller = selectedAgent || {
        firstName: "Prénom",
        lastName: "Nom",
        email: "email@example.com",
        phone: "06 00 00 00 00",
        avatar: undefined,
        role: "client",
      }

      const otherProps = properties.filter((p) => p.id !== selectedProperty.id).slice(0, 4)
      const subjectSurfaceSqm = toSqm(selectedProperty.characteristics?.surface || 0)

      const data: ListingPresentationData = {
        property: selectedProperty,
        seller,
        agent: {
          name: defaultAgent.name,
          phone: defaultAgent.phone,
          email: defaultAgent.email,
          photo: undefined,
          experience: "10 ans",
          recentSales: 120,
        },
        agency: {
          ...defaultAgency,
          address: agencyInfo.address || "",
          about: "Une agence orientée résultats, avec un accompagnement de bout en bout.",
        },
        marketingPlan: {
          onlinePortals: DEFAULT_LUX_PORTALS,
          professionalPhotography: true,
          virtualTour: includeQrCode,
          openHouse: true,
          socialMedia: true,
          emailCampaign: true,
          printAdvertising: false,
        },
        comparativeAnalysis: {
          selectedProperties: otherProps.map((p) => ({
            address: `${p.address.street}, ${p.address.postalCode} ${p.address.city}`,
            price: p.price,
            surface: toSqm(p.characteristics?.surface || 0),
            saleDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * (20 + Math.floor(Math.random() * 60))).toISOString(),
            daysOnMarket: 20 + Math.floor(Math.random() * 80),
          })),
          averagePricePerSqm: Math.round(selectedProperty.price / (subjectSurfaceSqm || 100)),
          marketPosition: "average",
          priceRecommendation: {
            minimum: Math.round(selectedProperty.price * 0.95),
            recommended: selectedProperty.price,
            maximum: Math.round(selectedProperty.price * 1.05),
          },
        },
        timeline: {
          listingDate: new Date().toISOString(),
          expectedSaleDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
          keyMilestones: [
            { date: new Date().toISOString(), task: "Photos & mise en ligne", completed: false },
            { date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), task: "Premières visites", completed: false },
            { date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), task: "Ajustement du prix si nécessaire", completed: false },
          ],
        },
        commission: {
          percentage: 5,
          estimatedAmount: Math.round(selectedProperty.price * 0.05),
          includes: ["Photos pro", "Diffusion multi-portails", "Visite virtuelle (option)", "Négociation", "Accompagnement notaire"],
        },
      }

      return { type: "listing_presentation" as const, data }
    }

    if (docType === "property_feature_sheet") {
      const data: PropertyFeatureSheetData = {
        property: selectedProperty,
        agent: {
          name: defaultAgent.name,
          phone: defaultAgent.phone,
          email: defaultAgent.email,
          photo: undefined,
        },
        agency: {
          ...defaultAgency,
          website: defaultAgency.website,
        },
        roomDetails: [
          { room: "Séjour", surface: Math.round((selectedProperty.characteristics?.surface || 100) * 0.35), description: "Pièce de vie lumineuse", features: ["Parquet", "Baies vitrées"] },
          { room: "Cuisine", surface: 12, description: "Cuisine équipée", features: ["Four", "Lave-vaisselle"] },
          { room: "Chambre", surface: 14, description: "Chambre au calme", features: ["Rangements"] },
        ],
        exteriorFeatures: ["Balcon", "Parking", "Local vélo"],
        interiorFeatures: ["Double vitrage", "Hauteur sous plafond", "Rangements"],
        utilities: {
          heating: "Gaz",
          cooling: "—",
          electricity: "Conforme",
          water: "Collectif",
          sewer: "Tout à l'égout",
        },
        parking: {
          type: "Sous-sol",
          capacity: 1,
          covered: true,
        },
        outdoorSpaces: ["Balcon", "Terrasse (selon lot)"],
        buildingDetails: selectedProperty.characteristics?.yearBuilt
          ? {
              yearBuilt: selectedProperty.characteristics.yearBuilt,
              construction: "Pierre / Béton",
              foundation: "Dalle béton",
              roof: "Tuile / Terrasse",
              floors: 5,
            }
          : undefined,
      }
      return { type: "property_feature_sheet" as const, data }
    }

    if (docType === "social_media_post") {
      const data: SocialMediaPostData = {
        property: selectedProperty,
        agent: {
          name: defaultAgent.name,
          phone: defaultAgent.phone,
          email: defaultAgent.email,
          website: defaultAgency.website,
        },
        agency: {
          ...defaultAgency,
        },
        platform: "instagram",
        postType: "new_listing",
        caption: `NOUVEAUTÉ • ${selectedProperty.address.city}\n\n${selectedProperty.description || "Un bien rare à découvrir. Contactez-nous pour une visite."}`,
        hashtags: ["immobilier", "nouveaute", "paris", "appartement", "investissement"],
        callToAction: "Contactez-nous pour une visite",
        showPrice: true,
        showAddress: true,
      }
      return { type: "social_media_post" as const, data }
    }

    if (docType === "email_marketing") {
      const recipient = selectedAgent || {
        firstName: "Prénom",
        lastName: "Nom",
        email: "email@example.com",
        phone: "06 00 00 00 00",
        avatar: undefined,
        role: "client",
      }

      const data: EmailMarketingData = {
        campaign: "new_listing",
        recipients: [recipient],
        sender: {
          name: defaultAgent.name,
          email: defaultAgent.email,
          phone: defaultAgent.phone,
          signature: `À bientôt,\n${defaultAgent.name}\n${defaultAgency.name}`,
        },
        agency: {
          name: defaultAgency.name,
          logo: defaultAgency.logo,
          website: defaultAgency.website,
          address: agencyInfo.address || "",
        },
        properties: [selectedProperty],
        subject: `Nouveau bien à ${selectedProperty.address.city}`,
        preheader: "Découvrez ce bien sélectionné par notre équipe.",
        headline: "Nouveau bien disponible",
        body: {
          sections: [
            {
              type: "text",
              content:
                "Bonjour,\n\nNous avons le plaisir de vous présenter un bien pouvant correspondre à votre recherche. Retrouvez ci-dessous les informations principales et contactez-nous pour organiser une visite.",
            },
            { type: "property", content: "Biens", properties: [selectedProperty] },
            { type: "text", content: defaultAgent.email },
          ],
        },
        callToAction: {
          text: "Voir le bien",
          link: "https://example.com/property",
        },
        footer: {
          unsubscribeLink: "https://example.com/unsubscribe",
          companyAddress: agencyInfo.address || "",
          privacyPolicy: "https://example.com/privacy",
        },
      }
      return { type: "email_marketing" as const, data }
    }

    // Return empty object for unimplemented templates
    return null
  }

  const ensureMarketingDoc = (args: { templateName: string; templateDescription: string; data: Record<string, unknown> }) => {
    const now = new Date().toISOString()
    if (!marketingDocId) {
      const created = addMarketingDocument({
        propertyId: selectedProperty?.id ?? "",
        type: docType,
        title: args.templateName,
        description: args.templateDescription,
        version: 1,
        status: "draft",
        fileUrl: null,
        generatedAt: now,
        data: args.data,
      })
      setMarketingDocId(created.id)
      return created.id
    }

    updateMarketingDocument(marketingDocId, { generatedAt: now, data: args.data })
    return marketingDocId
  }

  const persistPdf = async (args: { docId: string; documentType: string; data: Record<string, unknown>; filename: string }) => {
    const res = await fetch("/api/v1/documents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentType: args.documentType,
        data: args.data,
        options: { filename: args.filename },
        persist: { kind: "marketing", id: args.docId },
      }),
    })

    const json = await res.json().catch(() => ({} as any))
    if (!res.ok) throw new Error(json.error || "Failed to generate PDF")
    if (!json.signedUrl) throw new Error("Missing signed URL")

    if (typeof json.storagePath === "string") {
      updateMarketingDocument(args.docId, { fileUrl: json.storagePath, generatedAt: new Date().toISOString() })
    }

    return json.signedUrl as string
  }

  const downloadFromUrl = (url: string, filename: string) => {
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.rel = "noopener"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handlePreview = async () => {
    const docData = buildMarketingDocumentData()
    if (!docData) return
    const filename = `${docType}_${selectedProperty?.reference || "document"}_${new Date().toISOString().split("T")[0]}.pdf`

    const template = ALL_TEMPLATES.find((t) => t.id === docType)
    if (!template) return

    const docId = ensureMarketingDoc({
      templateName: template.name,
      templateDescription: template.description,
      data: docData.data as unknown as Record<string, unknown>,
    })

    // Open synchronously to avoid popup blockers.
    const previewWindow = window.open("about:blank", "_blank")
    try {
      setIsGenerating(true)
      const signedUrl = await persistPdf({
        docId,
        documentType: docData.type,
        data: docData.data as unknown as Record<string, unknown>,
        filename,
      })
      if (previewWindow) previewWindow.location.href = signedUrl
      else window.open(signedUrl, "_blank")
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : "Failed to generate PDF")
      if (previewWindow) previewWindow.close()
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    const docData = buildMarketingDocumentData()
    if (!docData) return
    const filename = `${docType}_${selectedProperty?.reference || "document"}_${new Date().toISOString().split("T")[0]}.pdf`

    const template = ALL_TEMPLATES.find((t) => t.id === docType)
    if (!template) return

    const docId = ensureMarketingDoc({
      templateName: template.name,
      templateDescription: template.description,
      data: docData.data as unknown as Record<string, unknown>,
    })

    try {
      setIsGenerating(true)
      const signedUrl = await persistPdf({
        docId,
        documentType: docData.type,
        data: docData.data as unknown as Record<string, unknown>,
        filename,
      })
      downloadFromUrl(signedUrl, filename)
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : "Failed to generate PDF")
    } finally {
      setIsGenerating(false)
    }
  }

  const template = ALL_TEMPLATES.find((t) => t.id === docType)

  return (
    <div className="flex flex-col">
      <DashboardHeader title="Marketing Documents" description="Generate and save marketing materials (Supabase)." />

      <div className="flex-1 p-6">
        <Link
          href="/dashboard/marketing"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Marketing
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Choose a template
                </CardTitle>
                <CardDescription>Pick what you want to generate.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {TEMPLATE_CATEGORIES.map((category) => (
                    <div key={category.id}>
                      <div className="flex items-center gap-2 mb-3">
                        <category.icon className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">{category.name}</h3>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {category.templates.map((t) => (
                          <label
                            key={t.id}
                            className={cn(
                              "flex flex-col items-center gap-2 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors text-center relative",
                              docType === t.id ? "border-amber-500 bg-amber-500/5" : "",
                              "featured" in t && t.featured ? "ring-2 ring-amber-200" : "",
                            )}
                          >
                            {"featured" in t && t.featured && (
                              <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                                Populaire
                              </div>
                            )}
                            <input
                              type="radio"
                              name="docType"
                              value={t.id}
                              checked={docType === t.id}
                              onChange={(e) => setDocType(e.target.value as MarketingDocType)}
                              className="sr-only"
                            />
                            <t.icon className={cn(
                              "h-8 w-8",
                              docType === t.id ? "text-amber-500" : "text-muted-foreground"
                            )} />
                            <span className="font-medium text-card-foreground text-sm">{t.name}</span>
                            <p className="text-xs text-muted-foreground">{t.description}</p>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Context</CardTitle>
                <CardDescription>Choose the property and (optional) contact/agent.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {requiresProperty ? (
                  <div className="space-y-2">
                    <Label>Property *</Label>
                    <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.reference} — {p.address.street}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Property</Label>
                    <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                      Not required for this template.
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Contact/Agent (optional)</Label>
                  <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.firstName} {c.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {docType === "window_display" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Window display options</CardTitle>
                  <CardDescription>Layout & pricing display.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Display Size</Label>
                    <Select value={displaySize} onValueChange={(v) => setDisplaySize(v as "A4" | "A3")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4 (Standard)</SelectItem>
                        <SelectItem value="A3">A3 (Large)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Price Display</Label>
                    <Select value={priceDisplay} onValueChange={(v) => setPriceDisplay(v as "full" | "from" | "hidden")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Price</SelectItem>
                        <SelectItem value="from">From Price</SelectItem>
                        <SelectItem value="hidden">Price on Request</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Badge (Optional)</Label>
                    <Select
                      value={windowBadge || "__none__"}
                      onValueChange={(v) => setWindowBadge(v === "__none__" ? "" : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No badge" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No Badge</SelectItem>
                        <SelectItem value="NOUVEAU">NOUVEAU</SelectItem>
                        <SelectItem value="EXCLUSIVITÉ">EXCLUSIVITÉ</SelectItem>
                        <SelectItem value="COUP DE CŒUR">COUP DE CŒUR</SelectItem>
                        <SelectItem value="PRIX EN BAISSE">PRIX EN BAISSE</SelectItem>
                        <SelectItem value="VENDU">VENDU</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {docType === "cma" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Estimation inputs</CardTitle>
                  <CardDescription>Optional overrides for the CMA numbers.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Low (€)</Label>
                    <Input value={suggestedLow} onChange={(e) => setSuggestedLow(e.target.value)} placeholder="e.g. 650000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Recommended (€)</Label>
                    <Input
                      value={suggestedRecommended}
                      onChange={(e) => setSuggestedRecommended(e.target.value)}
                      placeholder="e.g. 690000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>High (€)</Label>
                    <Input value={suggestedHigh} onChange={(e) => setSuggestedHigh(e.target.value)} placeholder="e.g. 720000" />
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {docType === "open_house" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Open house details</CardTitle>
                  <CardDescription>Date, time, and highlights.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="date"
                          value={openHouseDate}
                          onChange={(e) => setOpenHouseDate(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Start</Label>
                      <Input type="time" value={openHouseStartTime} onChange={(e) => setOpenHouseStartTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>End</Label>
                      <Input type="time" value={openHouseEndTime} onChange={(e) => setOpenHouseEndTime(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Highlights (comma-separated)</Label>
                    <Input
                      value={openHouseHighlights}
                      onChange={(e) => setOpenHouseHighlights(e.target.value)}
                      placeholder="e.g. Terrasse, Parking, Vue dégagée"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Instructions / notes</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional instructions" />
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {docType === "client_intake_form" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Intake form type</CardTitle>
                  <CardDescription>Choose buyer or seller version.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Label>Form Type</Label>
                  <Select value={intakeType} onValueChange={(v) => setIntakeType(v as typeof intakeType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">Acheteur</SelectItem>
                      <SelectItem value="seller">Vendeur</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
                <CardDescription>What will be generated.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  {docType === "window_display" && <LayoutGrid className="h-6 w-6 text-amber-500" />}
                  {docType === "cma" && <TrendingUp className="h-6 w-6 text-amber-500" />}
                  {docType === "open_house" && <Users className="h-6 w-6 text-amber-500" />}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{template?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{template?.description}</p>
                  </div>
                </div>

                {selectedProperty ? (
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm font-medium">{selectedProperty.reference}</p>
                    <p className="text-xs text-muted-foreground">{selectedProperty.address.street}</p>
                    <p className="text-sm font-semibold text-primary mt-1">
                      {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
                        selectedProperty.price,
                      )}
                    </p>
                  </div>
                ) : requiresProperty ? (
                  <div className="rounded-lg border p-3 text-sm text-muted-foreground">Select a property to enable generation.</div>
                ) : (
                  <div className="rounded-lg border p-3 text-sm text-muted-foreground">No property needed for this template.</div>
                )}

                {selectedAgent ? (
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="truncate">
                      Contact: {selectedAgent.firstName} {selectedAgent.lastName}
                    </Badge>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {requiresProperty ? (
              <Card>
                <CardHeader>
                  <CardTitle>Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Include Photos</Label>
                      <p className="text-xs text-muted-foreground">Add property images</p>
                    </div>
                    <Switch checked={includePhotos} onCheckedChange={setIncludePhotos} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Include QR Code</Label>
                      <p className="text-xs text-muted-foreground">Link to property page</p>
                    </div>
                    <Switch checked={includeQrCode} onCheckedChange={setIncludeQrCode} />
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <div className="flex flex-col gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreview}
                disabled={(requiresProperty && !selectedProperty) || isGenerating}
                className="bg-transparent"
              >
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                {isGenerating ? "Generating..." : "Preview PDF"}
              </Button>
              <Button type="button" onClick={handleDownload} disabled={(requiresProperty && !selectedProperty) || isGenerating}>
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {isGenerating ? "Generating..." : "Download PDF"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="bg-transparent">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
