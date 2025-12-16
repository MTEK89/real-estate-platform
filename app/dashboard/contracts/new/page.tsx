"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useDataStore } from "@/lib/data-store"
import { createDefaultInspection } from "@/lib/inspections"
import type {
  MandateData,
  RentalContractData,
  EtatDesLieuxData,
  KeyHandoverData,
  SaleContractData,
  SaleContractVEFAData,
} from "@/lib/pdf-generator"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  ArrowLeft,
  FileText,
  ClipboardCheck,
  PenTool,
  ScanLine,
  Sparkles,
  Key,
  Camera,
  Ruler,
  FileBarChart,
  BookOpen,
  Euro,
  Eye,
  Download,
  Check,
  Calendar,
} from "lucide-react"

export default function NewContractPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { contacts, properties, addContract, updateContract, addInspection, addOperationalDocument, currentUserId } = useDataStore()

  // Radix UI components generate IDs via useId(); in some Next/React dev setups this can
  // produce hydration attribute mismatches. Render the interactive form only after mount.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [activeTab, setActiveTab] = useState("contracts")
  const [autoFill, setAutoFill] = useState(true)
  const [draftContractId, setDraftContractId] = useState<string | null>(null)

  const [agencyBranding, setAgencyBranding] = useState<Record<string, unknown> | null>(null)
  const [profileInfo, setProfileInfo] = useState<{ firstName?: string; lastName?: string; email?: string | null } | null>(null)

  // Form state
  const [contractType, setContractType] = useState("mandate")
  const [propertyCategory, setPropertyCategory] = useState("apartment")
  const [selectedPropertyId, setSelectedPropertyId] = useState("")
  const [selectedContactId, setSelectedContactId] = useState("")
  const [selectedTenantId, setSelectedTenantId] = useState("")
  const [signatureMethod, setSignatureMethod] = useState("electronic")
  const [notes, setNotes] = useState("")

  // Mandate specific
  const [mandateType, setMandateType] = useState<"simple" | "exclusive" | "semi-exclusive">("exclusive")
  const [commissionPercentage, setCommissionPercentage] = useState("5")
  const [commissionPaidBy, setCommissionPaidBy] = useState<"seller" | "buyer">("seller")
  const [mandateDuration, setMandateDuration] = useState("3")
  const [askingPrice, setAskingPrice] = useState("")
  const [minimumPrice, setMinimumPrice] = useState("")

  // Rental specific
  const [monthlyRent, setMonthlyRent] = useState("")
  const [charges, setCharges] = useState("")
  const [deposit, setDeposit] = useState("")
  const [rentalType, setRentalType] = useState<"furnished" | "unfurnished">("unfurnished")
  const [paymentDay, setPaymentDay] = useState("1")
  const [startDate, setStartDate] = useState("")

  // Sale contract specific
  const [salePrice, setSalePrice] = useState("")
  const [agencyFees, setAgencyFees] = useState("")
  const [feesPayableBy, setFeesPayableBy] = useState<"seller" | "buyer">("buyer")
  const [depositAmount, setDepositAmount] = useState("")
  const [depositDueDate, setDepositDueDate] = useState("")
  const [completionDate, setCompletionDate] = useState("")
  const [possessionDate, setPossessionDate] = useState("")
  const [mortgageCondition, setMortgageCondition] = useState(true)
  const [mortgageAmount, setMortgageAmount] = useState("")
  const [mortgageDuration, setMortgageDuration] = useState("")
  const [mortgageRate, setMortgageRate] = useState("")
  const [notaryName, setNotaryName] = useState("Maître [Nom du notaire]")
  const [buyerId, setBuyerId] = useState("")

  // Operational document specific
  const [operationalType, setOperationalType] = useState("etat_des_lieux")
  const [etatType, setEtatType] = useState<"move_in" | "move_out">("move_in")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")

  // Pre-fill from URL params
  useEffect(() => {
    const contactId = searchParams.get("contactId")
    const propertyId = searchParams.get("propertyId")
    const type = searchParams.get("type")

    if (contactId) setSelectedContactId(contactId)
    if (propertyId) setSelectedPropertyId(propertyId)
    if (type) setContractType(type)
  }, [searchParams])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/v1/settings")
        if (!res.ok) return
        const json = (await res.json()) as any
        if (cancelled) return
        setAgencyBranding((json?.agency?.settings?.pdf_branding as Record<string, unknown> | undefined) ?? null)
        setProfileInfo({
          firstName: json?.profile?.firstName,
          lastName: json?.profile?.lastName,
          email: json?.profile?.email ?? null,
        })
      } catch {
        // ignore
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const agentInfo = useMemo(() => {
    const branding = agencyBranding as any
    const name =
      profileInfo?.firstName || profileInfo?.lastName
        ? `${profileInfo?.firstName ?? ""} ${profileInfo?.lastName ?? ""}`.trim()
        : "Agent"

    return {
      name,
      agency: (branding?.agencyName as string | undefined) ?? "Real Estate Agency",
      registrationNumber: (branding?.registrationNumber as string | undefined) ?? "",
      address: (branding?.address as string | undefined) ?? "",
    }
  }, [agencyBranding, profileInfo])

  // Auto-fill price when property is selected
  useEffect(() => {
    if (selectedPropertyId && autoFill) {
      const property = properties.find((p) => p.id === selectedPropertyId)
      if (property) {
        setAskingPrice(property.price.toString())

        // Set deposit as 1 month rent for rentals (estimate)
        if (contractType === "rental") {
          const estimatedRent = Math.round(property.price / 200) // Rough estimate
          setMonthlyRent(estimatedRent.toString())
          setDeposit(estimatedRent.toString())
          setCharges(Math.round(estimatedRent * 0.15).toString())
        }

        // Set sale price and fees for sale contracts
        if (contractType === "sale_existing" || contractType === "sale_vefa") {
          setSalePrice(property.price.toString())
          const fees = Math.round(property.price * 0.05) // 5% agency fees
          setAgencyFees(fees.toString())
          setDepositAmount(Math.round(property.price * 0.05).toString()) // 5% deposit

          // Set default dates
          const today = new Date()
          const depositDue = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000) // 10 days
          const completion = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000) // 60 days
          const possession = new Date(today.getTime() + 75 * 24 * 60 * 60 * 1000) // 75 days

          setDepositDueDate(depositDue.toISOString().split('T')[0])
          setCompletionDate(completion.toISOString().split('T')[0])
          setPossessionDate(possession.toISOString().split('T')[0])

          if (contractType === "sale_vefa") {
            // VEFA typically has longer timelines
            const veifaCompletion = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year
            setCompletionDate(veifaCompletion.toISOString().split('T')[0])
          }
        }
      }
    }
  }, [selectedPropertyId, autoFill, properties, contractType])

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId)
  const selectedContact = contacts.find((c) => c.id === selectedContactId)
  const selectedTenant = contacts.find((c) => c.id === selectedTenantId)
  const selectedBuyer = contacts.find((c) => c.id === buyerId)

  const handleStartInspectionWalkthrough = () => {
    if (!selectedProperty || !selectedContact || !selectedTenant) return

    const now = new Date().toISOString()
    const scheduledAtIso =
      scheduledDate && scheduledTime
        ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
        : scheduledDate
          ? new Date(`${scheduledDate}T09:00`).toISOString()
          : null

    const inspection = createDefaultInspection({
      property: selectedProperty,
      landlord: selectedContact,
      tenant: selectedTenant,
      type: etatType,
      scheduledDate: scheduledAtIso,
    })

    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...payload } = inspection
    const created = addInspection({
      ...payload,
      status: "in_progress",
      startedAt: now,
      generalNotes: notes,
    })
    router.push(`/dashboard/inspections/${created.id}`)
  }

  // Build document data for PDF generation
  const buildDocumentData = () => {
    if (!selectedProperty) return null

    if (contractType === "mandate" && selectedContact) {
      const data: MandateData = {
        type: mandateType,
        seller: selectedContact,
        property: selectedProperty,
        agent: agentInfo,
        commission: {
          percentage: Number.parseFloat(commissionPercentage),
          paidBy: commissionPaidBy,
        },
        duration: {
          months: Number.parseInt(mandateDuration),
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + Number.parseInt(mandateDuration) * 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        askingPrice: Number.parseFloat(askingPrice) || selectedProperty.price,
        minimumPrice: minimumPrice ? Number.parseFloat(minimumPrice) : undefined,
        marketingMethods: [
          "Publication sur les portails immobiliers (atHome.lu, IMMOTOP.LU, Wortimmo.lu, etc.)",
          "Mise en vitrine de l'agence",
          "Diffusion sur les réseaux sociaux",
          "Base de données clients qualifiés",
          "Panneaux publicitaires sur le bien",
        ],
        specialClauses: notes ? [notes] : [],
      }
      return { type: "mandate" as const, data }
    }

    if (contractType === "rental" && selectedContact && selectedTenant) {
      const data: RentalContractData = {
        landlord: selectedContact,
        tenant: selectedTenant,
        property: selectedProperty,
        rent: {
          monthly: Number.parseFloat(monthlyRent) || 0,
          charges: Number.parseFloat(charges) || 0,
          deposit: Number.parseFloat(deposit) || 0,
          paymentDay: Number.parseInt(paymentDay),
        },
        duration: {
          startDate: startDate || new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          type: rentalType,
        },
        specialClauses: notes ? [notes] : [],
      }
      return { type: "rental" as const, data }
    }

    if (contractType === "sale_existing" && selectedContact && selectedBuyer) {
      const data: SaleContractData = {
        seller: selectedContact,
        buyer: selectedBuyer,
        property: selectedProperty,
        price: {
          salePrice: Number.parseFloat(salePrice) || selectedProperty.price,
          agencyFees: Number.parseFloat(agencyFees) || Math.round(selectedProperty.price * 0.05),
          feesPayableBy: feesPayableBy,
          depositAmount: Number.parseFloat(depositAmount) || Math.round(selectedProperty.price * 0.05),
          depositDueDate: depositDueDate || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
        conditions: {
          mortgageCondition: mortgageCondition,
          mortgageAmount: mortgageCondition ? Number.parseFloat(mortgageAmount) || 0 : undefined,
          mortgageDuration: mortgageCondition ? Number.parseInt(mortgageDuration) || 20 : undefined,
          mortgageRate: mortgageCondition ? Number.parseFloat(mortgageRate) || 3.5 : undefined,
          suspensiveConditions: notes ? [notes] : [],
        },
        dates: {
          signatureDate: new Date().toISOString(),
          completionDeadline: completionDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          possessionDate: possessionDate || new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString(),
        },
        diagnostics: {
          dpe: undefined,
          asbestos: undefined,
          leadPaint: undefined,
          termites: undefined,
          electricalReport: false,
          gasReport: false,
          naturalRisks: false,
        },
        notary: {
          name: notaryName,
          address: "Luxembourg",
          phone: "+352",
        },
        agent: agentInfo,
        specialClauses: notes ? [notes] : [],
      }
      return { type: "sale_existing" as const, data }
    }

    if (contractType === "sale_vefa" && selectedContact && selectedBuyer) {
      const totalPrice = Number.parseFloat(salePrice) || selectedProperty.price
      const pricePerSqm = Math.round(totalPrice / selectedProperty.characteristics.surface)

      const data: SaleContractVEFAData = {
	        seller: {
	          company: `${selectedContact.firstName} ${selectedContact.lastName} Immobilier`,
	          siret: ((agencyBranding as any)?.legal?.rcs as string | undefined) ?? "B123456",
	          address: selectedContact.address || "À compléter",
	          representative: `${selectedContact.firstName} ${selectedContact.lastName}`,
	          guarantor: "Banque Populaire",
	        },
        buyer: selectedBuyer,
        property: selectedProperty,
        program: {
          name: "Nouveau Programme Premium",
          permitNumber: "PC2023-001234",
          permitDate: "2023-03-15",
          lotNumber: "Lot 123",
          building: "Bâtiment A",
          floor: selectedProperty.characteristics.floor || 1,
          description: `Appartement ${selectedProperty.characteristics.rooms} pièces de ${selectedProperty.characteristics.surface}m²`,
        },
        price: {
          totalPrice: totalPrice,
          pricePerSqm: pricePerSqm,
          vatRate: 20,
          parkingPrice: 25000,
          storagePrice: 5000,
        },
        payments: {
          reservationDeposit: Number.parseFloat(depositAmount) || Math.round(totalPrice * 0.05),
          schedule: [
            {
              stage: "Dépôt de garantie",
              percentage: 5,
              amount: Math.round(totalPrice * 0.05),
              dueDate: new Date().toISOString(),
            },
            {
              stage: "30% à l'achèvement des fondations",
              percentage: 30,
              amount: Math.round(totalPrice * 0.30),
              dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              stage: "30% à la mise hors d'eau",
              percentage: 30,
              amount: Math.round(totalPrice * 0.30),
              dueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              stage: "35% à la livraison",
              percentage: 35,
              amount: Math.round(totalPrice * 0.35),
              dueDate: completionDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
        },
        delivery: {
          estimatedDate: completionDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          toleranceMonths: 3,
          penaltyPerDay: 50,
        },
        guarantees: {
          completionGuarantee: "Garantie d'achèvement à première demande (GAP)",
          decennialInsurance: "Assurance décennale obligatoire",
          damageInsurance: "Assurance dommages ouvrage",
        },
        specialClauses: notes ? [notes] : [],
      }
      return { type: "sale_vefa" as const, data }
    }

    return null
  }

  // Build operational document data for PDF generation
  const buildOperationalDocumentData = () => {
    if (!selectedProperty) return null

    if (operationalType === "etat_des_lieux" && selectedContact && selectedTenant) {
      // Generate default rooms based on property characteristics
      const defaultRooms = [
        { name: "Entrée", walls: { condition: "Bon", notes: "" }, floor: { condition: "Bon", notes: "" }, ceiling: { condition: "Bon", notes: "" }, windows: { condition: "N/A", notes: "" }, fixtures: [{ item: "Interrupteur", condition: "Bon", notes: "" }, { item: "Prise électrique", condition: "Bon", notes: "" }] },
        { name: "Séjour", walls: { condition: "Bon", notes: "" }, floor: { condition: "Bon", notes: "" }, ceiling: { condition: "Bon", notes: "" }, windows: { condition: "Bon", notes: "" }, fixtures: [{ item: "Interrupteur", condition: "Bon", notes: "" }, { item: "Prises électriques", condition: "Bon", notes: "" }, { item: "Radiateur", condition: "Bon", notes: "" }] },
        { name: "Cuisine", walls: { condition: "Bon", notes: "" }, floor: { condition: "Bon", notes: "" }, ceiling: { condition: "Bon", notes: "" }, windows: { condition: "Bon", notes: "" }, fixtures: [{ item: "Évier", condition: "Bon", notes: "" }, { item: "Robinetterie", condition: "Bon", notes: "" }, { item: "Plaques de cuisson", condition: "Bon", notes: "" }, { item: "Hotte", condition: "Bon", notes: "" }] },
        { name: "Chambre 1", walls: { condition: "Bon", notes: "" }, floor: { condition: "Bon", notes: "" }, ceiling: { condition: "Bon", notes: "" }, windows: { condition: "Bon", notes: "" }, fixtures: [{ item: "Interrupteur", condition: "Bon", notes: "" }, { item: "Prises électriques", condition: "Bon", notes: "" }, { item: "Placard", condition: "Bon", notes: "" }] },
        { name: "Salle de bain", walls: { condition: "Bon", notes: "" }, floor: { condition: "Bon", notes: "" }, ceiling: { condition: "Bon", notes: "" }, windows: { condition: "N/A", notes: "" }, fixtures: [{ item: "Lavabo", condition: "Bon", notes: "" }, { item: "Baignoire/Douche", condition: "Bon", notes: "" }, { item: "WC", condition: "Bon", notes: "" }, { item: "Miroir", condition: "Bon", notes: "" }] },
      ]

      const data: EtatDesLieuxData = {
        type: etatType,
        property: selectedProperty,
        landlord: selectedContact,
        tenant: selectedTenant,
        date: scheduledDate || new Date().toISOString(),
        rooms: defaultRooms,
        meterReadings: {
          electricity: 0,
          gas: 0,
          water: 0,
        },
        keysProvided: [
          { type: "Clé porte d'entrée", quantity: 2 },
          { type: "Clé boîte aux lettres", quantity: 1 },
          { type: "Badge immeuble", quantity: 1 },
        ],
        generalComments: notes || "",
      }
      return { type: "etat_des_lieux" as const, data }
    }

    if (operationalType === "remise_des_cles" && selectedContact && selectedTenant) {
      const data: KeyHandoverData = {
        property: selectedProperty,
        landlord: selectedContact,
        tenant: selectedTenant,
        date: scheduledDate || new Date().toISOString(),
        handoverType: etatType === "move_in" ? "move_in" : "move_out",
        keys: [
          { type: "Clé porte d'entrée", quantity: 2, notes: "" },
          { type: "Clé boîte aux lettres", quantity: 1, notes: "" },
        ],
        remoteControls: [
          { type: "Télécommande portail", quantity: 1, notes: "" },
        ],
        accessCodes: [
          { location: "Porte immeuble", code: "****" },
        ],
        meterReadings: {
          electricity: { reading: 0, photos: false },
          water: { reading: 0, photos: false },
        },
        documents: [
          { name: "Attestation d'assurance", provided: true },
          { name: "RIB", provided: true },
        ],
        observations: notes || "",
      }
      return { type: "key_handover" as const, data }
    }

    return null
  }

  const persistAndGetUrl = async (args: {
    kind: "contract" | "operational"
    id: string
    docType: string
    data: Record<string, unknown>
    filename: string
  }) => {
    const res = await fetch("/api/v1/documents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentType: args.docType,
        data: args.data,
        options: { filename: args.filename },
        persist: { kind: args.kind, id: args.id },
      }),
    })

    const json = await res.json().catch(() => ({} as any))
    if (!res.ok) throw new Error(json.error || "Failed to generate PDF")
    if (!json.signedUrl) throw new Error("Missing signed URL")
    return json as { signedUrl: string; storagePath?: string }
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
    const docData = buildDocumentData()
    if (!docData) return

    setIsGeneratingPdf(true)
    try {
      let contractId = draftContractId
      if (!contractId) {
        const created = addContract({
          propertyId: selectedPropertyId,
          contactId: selectedContactId || null,
          dealId: null,
          type: contractType as any,
          propertyCategory: propertyCategory as any,
          status: "draft",
          signatureMethod: signatureMethod as any,
          autoFilled: autoFill,
          signedAt: null,
          expiresAt: new Date(Date.now() + Number.parseInt(mandateDuration) * 30 * 24 * 60 * 60 * 1000).toISOString(),
          data: docData.data as unknown as Record<string, unknown>,
        })
        contractId = created.id
        setDraftContractId(created.id)
      } else {
        updateContract(contractId, { data: docData.data as unknown as Record<string, unknown> })
      }

      const filename = `${contractType}_${selectedProperty?.reference || contractId}_${new Date().toISOString().split("T")[0]}.pdf`
      const { signedUrl, storagePath } = await persistAndGetUrl({
        kind: "contract",
        id: contractId,
        docType: docData.type,
        data: docData.data as unknown as Record<string, unknown>,
        filename,
      })
      if (storagePath) updateContract(contractId, { fileUrl: storagePath, generatedAt: new Date().toISOString() })
      window.open(signedUrl, "_blank", "noopener,noreferrer")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to preview document")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handleDownload = async () => {
    const docData = buildDocumentData()
    if (!docData) return

    setIsGeneratingPdf(true)
    try {
      let contractId = draftContractId
      if (!contractId) {
        const created = addContract({
          propertyId: selectedPropertyId,
          contactId: selectedContactId || null,
          dealId: null,
          type: contractType as any,
          propertyCategory: propertyCategory as any,
          status: "draft",
          signatureMethod: signatureMethod as any,
          autoFilled: autoFill,
          signedAt: null,
          expiresAt: new Date(Date.now() + Number.parseInt(mandateDuration) * 30 * 24 * 60 * 60 * 1000).toISOString(),
          data: docData.data as unknown as Record<string, unknown>,
        })
        contractId = created.id
        setDraftContractId(created.id)
      } else {
        updateContract(contractId, { data: docData.data as unknown as Record<string, unknown> })
      }

      const filename = `${contractType}_${selectedProperty?.reference || contractId}_${new Date().toISOString().split("T")[0]}.pdf`
      const { signedUrl, storagePath } = await persistAndGetUrl({
        kind: "contract",
        id: contractId,
        docType: docData.type,
        data: docData.data as unknown as Record<string, unknown>,
        filename,
      })
      if (storagePath) updateContract(contractId, { fileUrl: storagePath, generatedAt: new Date().toISOString() })
      downloadFromUrl(signedUrl, filename)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to download document")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // Operational document handlers
  const handleOperationalPreview = async () => {
    const docData = buildOperationalDocumentData()
    if (!docData) return

    setIsGeneratingPdf(true)
    try {
      const created = addOperationalDocument({
        propertyId: selectedPropertyId,
        contactId: selectedContactId || null,
        contractId: null,
        type: operationalType as any,
        subType: operationalType === "etat_des_lieux" || operationalType === "remise_des_cles" ? (etatType as any) : undefined,
        status: "draft",
        scheduledDate: null,
        completedAt: null,
        data: docData.data as unknown as Record<string, unknown>,
        attachments: [],
      })

      const filename = `${operationalType}_${selectedProperty?.reference || created.id}_${new Date().toISOString().split("T")[0]}.pdf`
      const { signedUrl } = await persistAndGetUrl({
        kind: "operational",
        id: created.id,
        docType: docData.type,
        data: docData.data as unknown as Record<string, unknown>,
        filename,
      })
      window.open(signedUrl, "_blank", "noopener,noreferrer")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to preview document")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handleOperationalDownload = async () => {
    const docData = buildOperationalDocumentData()
    if (!docData) return

    setIsGeneratingPdf(true)
    try {
      const created = addOperationalDocument({
        propertyId: selectedPropertyId,
        contactId: selectedContactId || null,
        contractId: null,
        type: operationalType as any,
        subType: operationalType === "etat_des_lieux" || operationalType === "remise_des_cles" ? (etatType as any) : undefined,
        status: "draft",
        scheduledDate: null,
        completedAt: null,
        data: docData.data as unknown as Record<string, unknown>,
        attachments: [],
      })

      const filename = `${operationalType}_${selectedProperty?.reference || created.id}_${new Date().toISOString().split("T")[0]}.pdf`
      const { signedUrl } = await persistAndGetUrl({
        kind: "operational",
        id: created.id,
        docType: docData.type,
        data: docData.data as unknown as Record<string, unknown>,
        filename,
      })
      downloadFromUrl(signedUrl, filename)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to download document")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPropertyId) return

    setIsSubmitting(true)

    if (activeTab === "operational") {
      const docData = buildOperationalDocumentData()
      if (!docData) {
        setIsSubmitting(false)
        return
      }

      const dateTime = scheduledDate
        ? `${scheduledDate}T${scheduledTime || "00:00"}:00.000Z`
        : null

      addOperationalDocument({
        propertyId: selectedPropertyId,
        contactId: selectedContactId || null,
        contractId: null,
        type: operationalType as any,
        subType: (operationalType === "etat_des_lieux" || operationalType === "remise_des_cles") ? (etatType as any) : undefined,
        status: scheduledDate ? "scheduled" : "draft",
        scheduledDate: dateTime,
        completedAt: null,
        data: docData.data as unknown as Record<string, unknown>,
        attachments: [],
      })

      await new Promise((resolve) => setTimeout(resolve, 400))
      router.push("/dashboard/contracts")
      return
    }

    // Contracts tab
    const contractDoc = buildDocumentData()
    if (!contractDoc) {
      toast.error("Please complete the required fields before creating the contract.")
      setIsSubmitting(false)
      return
    }

    const nextStatus = signatureMethod === "electronic" ? "pending_signature" : "draft"
    const nextExpiresAt = new Date(Date.now() + Number.parseInt(mandateDuration) * 30 * 24 * 60 * 60 * 1000).toISOString()

    if (draftContractId) {
      updateContract(draftContractId, {
        propertyId: selectedPropertyId,
        contactId: selectedContactId || null,
        dealId: null,
        type: contractType as any,
        propertyCategory: propertyCategory as any,
        status: nextStatus as any,
        signatureMethod: signatureMethod as any,
        autoFilled: autoFill,
        signedAt: null,
        expiresAt: nextExpiresAt,
        data: contractDoc.data as unknown as Record<string, unknown>,
      })
    } else {
      const created = addContract({
        propertyId: selectedPropertyId,
        contactId: selectedContactId || null,
        dealId: null,
        type: contractType as any,
        propertyCategory: propertyCategory as any,
        status: nextStatus as any,
        signatureMethod: signatureMethod as any,
        autoFilled: autoFill,
        signedAt: null,
        expiresAt: nextExpiresAt,
        data: contractDoc.data as unknown as Record<string, unknown>,
      })
      setDraftContractId(created.id)
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
    router.push("/dashboard/contracts")
  }

  const contractTemplates = [
    {
      id: "mandate",
      name: "Mandate",
      description: "Exclusive or simple selling mandate",
      icon: FileText,
    },
    {
      id: "sale_existing",
      name: "Sale Contract (Existing)",
      description: "For existing properties",
      icon: FileText,
    },
    {
      id: "sale_vefa",
      name: "Sale Contract (VEFA)",
      description: "For new builds / off-plan",
      icon: FileText,
    },
    {
      id: "rental",
      name: "Rental Contract",
      description: "Standard rental lease agreement",
      icon: FileText,
    },
  ]

  const operationalTemplates = [
    {
      id: "etat_des_lieux",
      name: "État des Lieux",
      description: "Move-in/move-out inspection report",
      icon: ClipboardCheck,
    },
    {
      id: "remise_des_cles",
      name: "Remise des Clés",
      description: "Key handover documentation",
      icon: Key,
    },
    {
      id: "photo_session",
      name: "Photo Session",
      description: "Property photography session",
      icon: Camera,
    },
    {
      id: "surface_calculation",
      name: "Surface Calculation",
      description: "Carrez law surface measurement",
      icon: Ruler,
    },
    {
      id: "evaluation",
      name: "Evaluation",
      description: "Property valuation/appraisal",
      icon: FileBarChart,
    },
  ]

  // Filter contacts by type for different roles
  const sellers = contacts.filter((c) => c.type === "seller" || c.type === "investor")
  const buyers = contacts.filter((c) => c.type === "buyer" || c.type === "lead")
  const allContacts = contacts

  if (!mounted) {
    return (
      <div className="flex flex-col">
        <DashboardHeader title="Create Document" description="Generate a new contract or operational document" />
        <div className="flex-1 p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <DashboardHeader
        title="Create Document"
        description="Generate a new contract or operational document"
      />

      <div className="flex-1 p-6">
        <Link
          href="/dashboard/contracts"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Documents
        </Link>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-2">
            <TabsTrigger value="contracts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contracts
            </TabsTrigger>
            <TabsTrigger value="operational" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Operational
            </TabsTrigger>
          </TabsList>

          {/* Contracts Tab */}
          <TabsContent value="contracts">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  {/* Contract Type Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Select Contract Type</CardTitle>
                      <CardDescription>Choose the type of contract you want to create</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {contractTemplates.map((template) => (
                          <label
                            key={template.id}
                            className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                          >
                            <input
                              type="radio"
                              name="contractType"
                              value={template.id}
                              className="mt-1"
                              checked={contractType === template.id}
                              onChange={(e) => setContractType(e.target.value)}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <template.icon className="h-4 w-4 text-primary" />
                                <span className="font-medium text-card-foreground">{template.name}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Property Category */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Property Category</CardTitle>
                      <CardDescription>Select the category that matches the property type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 sm:grid-cols-5">
                        {["house", "apartment", "office", "professional", "retail"].map((category) => (
                          <label
                            key={category}
                            className="flex items-center justify-center rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                          >
                            <input
                              type="radio"
                              name="category"
                              value={category}
                              className="sr-only"
                              checked={propertyCategory === category}
                              onChange={(e) => setPropertyCategory(e.target.value)}
                            />
                            <span className="text-sm font-medium capitalize">{category}</span>
                          </label>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contract Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Contract Details</CardTitle>
                      {autoFill && selectedProperty && (
                        <Badge variant="secondary" className="w-fit">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Auto-filled from property data
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
	                      <div className="space-y-2">
	                        <Label htmlFor="property">Property *</Label>
	                        <Select
	                          value={selectedPropertyId}
	                          onValueChange={(v) => {
	                            if (v === "__no_properties__") return
	                            setSelectedPropertyId(v)
	                          }}
	                          disabled={properties.length === 0}
	                        >
	                          <SelectTrigger>
	                            <SelectValue placeholder={properties.length === 0 ? "No properties yet" : "Select property"} />
	                          </SelectTrigger>
	                          <SelectContent>
	                            {properties.length === 0 ? (
	                              <SelectItem value="__no_properties__" disabled>
	                                No properties yet — create one first
	                              </SelectItem>
	                            ) : (
	                              properties.map((property) => (
	                                <SelectItem key={property.id} value={property.id}>
	                                  {property.reference} - {property.address.street} ({property.type})
	                                </SelectItem>
	                              ))
	                            )}
	                          </SelectContent>
	                        </Select>
	                        {properties.length === 0 && (
	                          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3 text-sm">
	                            <div className="text-muted-foreground">Create a property to start generating contracts.</div>
	                            <Button asChild size="sm">
	                              <Link href="/dashboard/properties/new?next=/dashboard/contracts/new">Create property</Link>
	                            </Button>
	                          </div>
	                        )}
	                        {selectedProperty && (
	                          <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm">
	                            <p className="font-medium">{selectedProperty.address.street}</p>
	                            <p className="text-muted-foreground">
                              {selectedProperty.address.postalCode} {selectedProperty.address.city} |{" "}
                              {selectedProperty.characteristics.surface}m² | {selectedProperty.characteristics.rooms}{" "}
                              rooms
                            </p>
                            <p className="text-primary font-medium mt-1">
                              €{selectedProperty.price.toLocaleString("de-DE")}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contact">
                          {contractType === "mandate" ? "Property Owner (Seller) *" : "Contact *"}
                        </Label>
                        <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select contact" />
                          </SelectTrigger>
                          <SelectContent>
                            {(contractType === "mandate" ? sellers : allContacts).map((contact) => (
                              <SelectItem key={contact.id} value={contact.id}>
                                {contact.firstName} {contact.lastName} ({contact.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedContact && (
                          <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm">
                            <p className="font-medium">
                              {selectedContact.firstName} {selectedContact.lastName}
                            </p>
                            <p className="text-muted-foreground">
                              {selectedContact.email} | {selectedContact.phone}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Rental: Additional Tenant Selection */}
                      {contractType === "rental" && (
                        <div className="space-y-2">
                          <Label htmlFor="tenant">Tenant *</Label>
                          <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tenant" />
                            </SelectTrigger>
                            <SelectContent>
                              {buyers.map((contact) => (
                                <SelectItem key={contact.id} value={contact.id}>
                                  {contact.firstName} {contact.lastName} ({contact.type})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Mandate Specific Fields */}
                      {contractType === "mandate" && (
                        <>
                          <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                              <Label>Mandate Type</Label>
                              <Select
                                value={mandateType}
                                onValueChange={(v) => setMandateType(v as typeof mandateType)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="simple">Simple</SelectItem>
                                  <SelectItem value="exclusive">Exclusive</SelectItem>
                                  <SelectItem value="semi-exclusive">Semi-Exclusive</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Duration (months)</Label>
                              <Select value={mandateDuration} onValueChange={setMandateDuration}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="3">3 months</SelectItem>
                                  <SelectItem value="6">6 months</SelectItem>
                                  <SelectItem value="12">12 months</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Commission (%)</Label>
                              <Input
                                type="number"
                                value={commissionPercentage}
                                onChange={(e) => setCommissionPercentage(e.target.value)}
                                min="0"
                                max="10"
                                step="0.5"
                              />
                            </div>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Asking Price (€)</Label>
                              <Input
                                type="number"
                                value={askingPrice}
                                onChange={(e) => setAskingPrice(e.target.value)}
                                placeholder="Enter asking price"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Minimum Price (€) - Optional</Label>
                              <Input
                                type="number"
                                value={minimumPrice}
                                onChange={(e) => setMinimumPrice(e.target.value)}
                                placeholder="Enter minimum acceptable price"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Commission Paid By</Label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="commissionPaidBy"
                                  value="seller"
                                  checked={commissionPaidBy === "seller"}
                                  onChange={() => setCommissionPaidBy("seller")}
                                />
                                <span className="text-sm">Seller</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="commissionPaidBy"
                                  value="buyer"
                                  checked={commissionPaidBy === "buyer"}
                                  onChange={() => setCommissionPaidBy("buyer")}
                                />
                                <span className="text-sm">Buyer</span>
                              </label>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Rental Specific Fields */}
                      {contractType === "rental" && (
                        <>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Rental Type</Label>
                              <Select value={rentalType} onValueChange={(v) => setRentalType(v as typeof rentalType)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unfurnished">Unfurnished</SelectItem>
                                  <SelectItem value="furnished">Furnished</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Start Date</Label>
                              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            </div>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-4">
                            <div className="space-y-2">
                              <Label>Monthly Rent (€)</Label>
                              <Input
                                type="number"
                                value={monthlyRent}
                                onChange={(e) => setMonthlyRent(e.target.value)}
                                placeholder="0"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Charges (€)</Label>
                              <Input
                                type="number"
                                value={charges}
                                onChange={(e) => setCharges(e.target.value)}
                                placeholder="0"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Deposit (€)</Label>
                              <Input
                                type="number"
                                value={deposit}
                                onChange={(e) => setDeposit(e.target.value)}
                                placeholder="0"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Payment Day</Label>
                              <Select value={paymentDay} onValueChange={setPaymentDay}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[1, 5, 10, 15].map((day) => (
                                    <SelectItem key={day} value={day.toString()}>
                                      {day}st of month
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Sale Contract Specific Fields */}
                      {(contractType === "sale_existing" || contractType === "sale_vefa") && (
                        <>
                          <div className="space-y-2">
                            <Label>Buyer *</Label>
                            <Select value={buyerId} onValueChange={setBuyerId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select buyer" />
                              </SelectTrigger>
                              <SelectContent>
                                {buyers.map((contact) => (
                                  <SelectItem key={contact.id} value={contact.id}>
                                    {contact.firstName} {contact.lastName} ({contact.type})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                              <Label>Sale Price (€)</Label>
                              <Input
                                type="number"
                                value={salePrice}
                                onChange={(e) => setSalePrice(e.target.value)}
                                placeholder="0"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Agency Fees (€)</Label>
                              <Input
                                type="number"
                                value={agencyFees}
                                onChange={(e) => setAgencyFees(e.target.value)}
                                placeholder="0"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Fees Paid By</Label>
                              <Select value={feesPayableBy} onValueChange={(v) => setFeesPayableBy(v as "seller" | "buyer")}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="seller">Seller</SelectItem>
                                  <SelectItem value="buyer">Buyer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Deposit Amount (€)</Label>
                              <Input
                                type="number"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                placeholder="0"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Deposit Due Date</Label>
                              <Input
                                type="date"
                                value={depositDueDate}
                                onChange={(e) => setDepositDueDate(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Completion Date</Label>
                              <Input
                                type="date"
                                value={completionDate}
                                onChange={(e) => setCompletionDate(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Possession Date</Label>
                              <Input
                                type="date"
                                value={possessionDate}
                                onChange={(e) => setPossessionDate(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="mortgageCondition"
                                checked={mortgageCondition}
                                onChange={(e) => setMortgageCondition(e.target.checked)}
                              />
                              <Label htmlFor="mortgageCondition">Subject to mortgage approval</Label>
                            </div>
                          </div>

                          {mortgageCondition && (
                            <div className="grid gap-4 sm:grid-cols-3">
                              <div className="space-y-2">
                                <Label>Mortgage Amount (€)</Label>
                                <Input
                                  type="number"
                                  value={mortgageAmount}
                                  onChange={(e) => setMortgageAmount(e.target.value)}
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Duration (years)</Label>
                                <Input
                                  type="number"
                                  value={mortgageDuration}
                                  onChange={(e) => setMortgageDuration(e.target.value)}
                                  placeholder="20"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Maximum Rate (%)</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={mortgageRate}
                                  onChange={(e) => setMortgageRate(e.target.value)}
                                  placeholder="3.5"
                                />
                              </div>
                            </div>
                          )}

                          {contractType === "sale_vefa" && (
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-sm text-blue-800">
                                <strong>VEFA (Vente en l'État Futur d'Achèvement)</strong><br/>
                                This is an off-plan property sale with construction timeline.
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes / Special Clauses</Label>
                        <Textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Any specific clauses or modifications to include..."
                          className="min-h-[100px]"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Signature Options */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Signature Method</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3">
                        <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                          <input
                            type="radio"
                            name="signatureMethod"
                            value="electronic"
                            checked={signatureMethod === "electronic"}
                            onChange={(e) => setSignatureMethod(e.target.value)}
                            className="mt-0.5"
                          />
                          <PenTool className="h-4 w-4 text-primary" />
                          <div>
                            <span className="text-sm font-medium">Electronic Signature</span>
                            <p className="text-xs text-muted-foreground">Send for digital signing</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                          <input
                            type="radio"
                            name="signatureMethod"
                            value="scanned"
                            checked={signatureMethod === "scanned"}
                            onChange={(e) => setSignatureMethod(e.target.value)}
                            className="mt-0.5"
                          />
                          <ScanLine className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="text-sm font-medium">Scanned Document</span>
                            <p className="text-xs text-muted-foreground">Upload signed scan</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                          <input
                            type="radio"
                            name="signatureMethod"
                            value="manual"
                            checked={signatureMethod === "manual"}
                            onChange={(e) => setSignatureMethod(e.target.value)}
                            className="mt-0.5"
                          />
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="text-sm font-medium">Manual/Physical</span>
                            <p className="text-xs text-muted-foreground">Print for wet signature</p>
                          </div>
                        </label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Auto-fill Option */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Auto-fill
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="autofill">Enable Auto-fill</Label>
                          <p className="text-xs text-muted-foreground">
                            Automatically populate fields from property and contact data
                          </p>
                        </div>
                        <Switch id="autofill" checked={autoFill} onCheckedChange={setAutoFill} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Workflow */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Workflow</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                          <Check className="h-3 w-3" />
                        </span>
                        <span>Create Draft</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                          2
                        </span>
                        <span>Review & Edit</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                          3
                        </span>
                        <span>Send for Signature</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                          4
                        </span>
                        <span>Signed & Archived</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3">
                    {selectedPropertyId && selectedContactId && (
                      (contractType === "mandate") ||
                      (contractType === "rental" && selectedTenantId) ||
                      (contractType === "sale_existing" && selectedBuyer) ||
                      (contractType === "sale_vefa" && selectedBuyer)
                    ) && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePreview}
                          disabled={isGeneratingPdf}
                          className="bg-transparent"
                        >
                          {isGeneratingPdf ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="mr-2 h-4 w-4" />
                          )}
                          {isGeneratingPdf ? "Generating..." : "Preview Document"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleDownload}
                          disabled={isGeneratingPdf}
                          className="bg-transparent"
                        >
                          {isGeneratingPdf ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          {isGeneratingPdf ? "Generating..." : "Download PDF"}
                        </Button>
                      </>
                    )}
                    <Button type="submit" disabled={
                      isSubmitting ||
                      !selectedPropertyId ||
                      !selectedContactId ||
                      (contractType === "rental" && !selectedTenantId) ||
                      (contractType === "sale_existing" && !selectedBuyer) ||
                      (contractType === "sale_vefa" && !selectedBuyer)
                    }>
                      {isSubmitting ? "Creating..." : "Create Contract"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </TabsContent>

          {/* Operational Documents Tab */}
          <TabsContent value="operational">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  {/* Document Type Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Select Document Type</CardTitle>
                      <CardDescription>Choose the operational document you want to create</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {operationalTemplates.map((template) => (
                          <label
                            key={template.id}
                            className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                          >
                            <input
                              type="radio"
                              name="operationalType"
                              value={template.id}
                              className="mt-1"
                              checked={operationalType === template.id}
                              onChange={(e) => setOperationalType(e.target.value)}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <template.icon className="h-4 w-4 text-primary" />
                                <span className="font-medium text-card-foreground">{template.name}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Document Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Document Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="property">Property</Label>
                        <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select property" />
                          </SelectTrigger>
                          <SelectContent>
                            {properties.map((property) => (
                              <SelectItem key={property.id} value={property.id}>
                                {property.reference} - {property.address.street}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contact">Landlord</Label>
                        <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select landlord" />
                          </SelectTrigger>
                          <SelectContent>
                            {sellers.map((contact) => (
                              <SelectItem key={contact.id} value={contact.id}>
                                {contact.firstName} {contact.lastName} ({contact.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tenant">Tenant</Label>
                        <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tenant" />
                          </SelectTrigger>
                          <SelectContent>
                            {buyers.map((contact) => (
                              <SelectItem key={contact.id} value={contact.id}>
                                {contact.firstName} {contact.lastName} ({contact.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="scheduledDate">Scheduled Date</Label>
                          <Input
                            type="date"
                            id="scheduledDate"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="scheduledTime">Scheduled Time</Label>
                          <Input
                            type="time"
                            id="scheduledTime"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Additional instructions or notes..."
                          className="min-h-[100px]"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Sub-type selection - shows only for État des Lieux and Remise des Clés */}
                  {(operationalType === "etat_des_lieux" || operationalType === "remise_des_cles") && (
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          {operationalType === "etat_des_lieux" ? "Type d'État des Lieux" : "Type de Remise"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3">
                          <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                            <input
                              type="radio"
                              name="subType"
                              value="move_in"
                              checked={etatType === "move_in"}
                              onChange={() => setEtatType("move_in")}
                            />
                            <span className="text-sm font-medium">
                              {operationalType === "etat_des_lieux" ? "État des lieux d'entrée" : "Remise des clés (entrée)"}
                            </span>
                          </label>
                          <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                            <input
                              type="radio"
                              name="subType"
                              value="move_out"
                              checked={etatType === "move_out"}
                              onChange={() => setEtatType("move_out")}
                            />
                            <span className="text-sm font-medium">
                              {operationalType === "etat_des_lieux" ? "État des lieux de sortie" : "Remise des clés (sortie)"}
                            </span>
                          </label>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3">
                    {operationalType === "etat_des_lieux" && selectedPropertyId && selectedContactId && selectedTenantId && (
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-transparent w-full"
                        onClick={handleStartInspectionWalkthrough}
                      >
                        Start walkthrough (checklist + photos)
                      </Button>
                    )}
                    {selectedPropertyId && selectedContactId && selectedTenantId && (operationalType === "etat_des_lieux" || operationalType === "remise_des_cles") && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleOperationalPreview}
                          disabled={isGeneratingPdf}
                          className="bg-transparent"
                        >
                          {isGeneratingPdf ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="mr-2 h-4 w-4" />
                          )}
                          {isGeneratingPdf ? "Generating..." : "Preview Document"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleOperationalDownload}
                          disabled={isGeneratingPdf}
                          className="bg-transparent"
                        >
                          {isGeneratingPdf ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          {isGeneratingPdf ? "Generating..." : "Download PDF"}
                        </Button>
                      </>
                    )}
                    <Button type="submit" disabled={isSubmitting || !selectedPropertyId || !selectedContactId || !selectedTenantId}>
                      {isSubmitting ? "Creating..." : "Create Document"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </TabsContent>

          {/* Commercial / marketing documents moved to Marketing */}
          <TabsContent value="commercial">
            <Card>
              <CardHeader>
                <CardTitle>Marketing documents moved</CardTitle>
                <CardDescription>Window cards, flyers, and CMA reports now live in Marketing.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <Button asChild>
                  <Link
                    href={`/dashboard/marketing/documents/new?propertyId=${encodeURIComponent(
                      selectedPropertyId || "",
                    )}&contactId=${encodeURIComponent(selectedContactId || "")}`}
                  >
                    Open Marketing Documents
                  </Link>
                </Button>
                <Button variant="outline" className="bg-transparent" onClick={() => router.back()}>
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
