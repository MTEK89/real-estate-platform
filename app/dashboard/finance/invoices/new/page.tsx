"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Download, Eye, Loader2, Plus, Save } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useDataStore } from "@/lib/data-store"
import type { InvoiceData } from "@/lib/pdf"
import { toast } from "sonner"

type InvoiceLineItemDraft = { description: string; quantity: number; unitPrice: number; vatRate: number }

function getTodayISODate(): string {
  return new Date().toISOString().split("T")[0]
}

function addDaysISODate(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map((v) => Number.parseInt(v, 10))
  const date = new Date(y, (m ?? 1) - 1, d ?? 1)
  date.setDate(date.getDate() + days)
  return date.toISOString().split("T")[0]
}

function generateInvoiceNumber(): string {
  const today = getTodayISODate()
  const stamp = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `INV-${today.replaceAll("-", "")}-${stamp}`
}

function computeInvoiceTotals(items: InvoiceLineItemDraft[]) {
  const subtotalExclVat = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0)
  const vatTotal = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0) * ((item.vatRate || 0) / 100),
    0,
  )
  const totalInclVat = subtotalExclVat + vatTotal
  return { subtotalExclVat, vatTotal, totalInclVat }
}

function NewInvoicePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { contacts, deals, addInvoice, updateInvoice, getPropertyById } = useDataStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [draftInvoiceId, setDraftInvoiceId] = useState<string | null>(null)

  const [contactId, setContactId] = useState(searchParams.get("contactId") ?? "")
  const [dealId, setDealId] = useState(searchParams.get("dealId") ?? "")

  const [issueDate, setIssueDate] = useState(getTodayISODate())
  const [dueDate, setDueDate] = useState(addDaysISODate(getTodayISODate(), 14))
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber())

  const [supplierName, setSupplierName] = useState("")
  const [supplierAddress, setSupplierAddress] = useState("")
  const [supplierEmail, setSupplierEmail] = useState("")
  const [supplierPhone, setSupplierPhone] = useState("")
  const [supplierVatNumber, setSupplierVatNumber] = useState("")
  const [supplierRcsNumber, setSupplierRcsNumber] = useState("")

  const [paymentIban, setPaymentIban] = useState("")
  const [paymentBic, setPaymentBic] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("Paiement à 14 jours")

  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<InvoiceLineItemDraft[]>([
    { description: "", quantity: 1, unitPrice: 0, vatRate: 17 },
  ])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/v1/settings")
        if (!res.ok) return
        const json = (await res.json()) as any
        if (cancelled) return

        const branding = (json?.agency?.settings?.pdf_branding as any) ?? null
        const agencyName = (branding?.agencyName as string | undefined) ?? (json?.agency?.name as string | undefined) ?? ""

        setSupplierName((prev) => prev || agencyName)
        setSupplierAddress((prev) => prev || ((branding?.address as string | undefined) ?? ""))
        setSupplierEmail((prev) => prev || ((branding?.email as string | undefined) ?? ""))
        setSupplierPhone((prev) => prev || ((branding?.phone as string | undefined) ?? ""))
        setSupplierVatNumber((prev) => prev || ((branding?.legal?.vatNumber as string | undefined) ?? ""))
        setSupplierRcsNumber((prev) => prev || ((branding?.legal?.rcs as string | undefined) ?? ""))
      } catch {
        // ignore
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedDeal = dealId ? deals.find((d) => d.id === dealId) : undefined
  const selectedProperty = selectedDeal ? getPropertyById(selectedDeal.propertyId) : undefined
  const selectedContact = contacts.find((c) => c.id === contactId)

  const totals = useMemo(() => computeInvoiceTotals(items), [items])
  const currencyFormatter = useMemo(() => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }), [])

  const canSubmit =
    !!selectedContact &&
    !!invoiceNumber &&
    !!issueDate &&
    !!dueDate &&
    items.length > 0 &&
    !items.some((i) => !i.description || !i.quantity || i.quantity <= 0 || !Number.isFinite(i.unitPrice))

  const addItem = () => setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0, vatRate: 17 }])

  const removeItem = (index: number) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const updateItem = (index: number, field: keyof InvoiceLineItemDraft, value: string | number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const handleDealChange = (newDealId: string) => {
    if (newDealId === "none") {
      setDealId("")
      return
    }
    setDealId(newDealId)

    const deal = deals.find((d) => d.id === newDealId)
    if (!deal) return

    const property = getPropertyById(deal.propertyId)
    if (!property) return

    const dealValue = (deal as unknown as { value?: number }).value ?? 0
    const commissionAmount = dealValue * 0.03

    setItems([
      {
        description: `Commission de courtage - ${deal.type === "sale" ? "Vente" : "Location"} - ${property.address.street}`,
        quantity: 1,
        unitPrice: commissionAmount,
        vatRate: 17,
      },
      { description: "Frais administratifs", quantity: 1, unitPrice: 250, vatRate: 17 },
    ])

    if (deal.buyerId) setContactId(deal.buyerId)
  }

  const handleCreateInvoice = async () => {
    if (!selectedContact || !canSubmit) return

    setIsSubmitting(true)
    try {
      const basePayload = {
        contactId: selectedContact.id,
        dealId: dealId || null,
        invoiceNumber,
        issueDate,
        currency: "EUR" as const,
        supplier: {
          name: supplierName,
          address: supplierAddress || undefined,
          email: supplierEmail || undefined,
          phone: supplierPhone || undefined,
          vatNumber: supplierVatNumber || undefined,
          rcsNumber: supplierRcsNumber || undefined,
        },
        customer: {
          name: `${selectedContact.firstName} ${selectedContact.lastName}`,
          email: selectedContact.email,
          phone: selectedContact.phone,
        },
        items: items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          vatRate: i.vatRate,
        })),
        totals,
        payment: {
          iban: paymentIban || undefined,
          bic: paymentBic || undefined,
          reference: invoiceNumber,
          terms: paymentTerms || undefined,
        },
        notes: notes || undefined,
        status: "draft" as const,
        dueDate,
        paidAt: null as string | null,
      }

      let invoiceId = draftInvoiceId
      if (invoiceId) {
        updateInvoice(invoiceId, basePayload)
      } else {
        const created = addInvoice(basePayload)
        invoiceId = created.id
        setDraftInvoiceId(created.id)
      }

      router.push(`/dashboard/finance?tab=invoices&invoiceId=${invoiceId}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const buildInvoicePdfData = (): InvoiceData | null => {
    if (!selectedContact) return null
    if (!canSubmit) return null

    return {
      invoice: {
        invoiceNumber,
        issueDate,
        dueDate,
        currency: "EUR",
        supplier: {
          name: supplierName,
          address: supplierAddress || undefined,
          email: supplierEmail || undefined,
          phone: supplierPhone || undefined,
          vatNumber: supplierVatNumber || undefined,
          rcsNumber: supplierRcsNumber || undefined,
        },
        customer: {
          name: `${selectedContact.firstName} ${selectedContact.lastName}`,
          email: selectedContact.email,
          phone: selectedContact.phone,
        },
        items: items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          vatRate: i.vatRate,
        })),
        totals,
        payment: {
          iban: paymentIban || undefined,
          bic: paymentBic || undefined,
          reference: invoiceNumber,
          terms: paymentTerms || undefined,
        },
        notes: notes || undefined,
      },
      property: selectedProperty,
      deal: selectedDeal,
    }
  }

  const persistAndGetUrl = async (args: { invoiceId: string; data: InvoiceData; filename: string }) => {
    const res = await fetch("/api/v1/documents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentType: "invoice",
        data: args.data,
        options: { filename: args.filename },
        persist: { kind: "invoice", id: args.invoiceId },
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

  const ensureDraftInvoice = () => {
    if (!selectedContact || !canSubmit) return null
    const payload = {
      contactId: selectedContact.id,
      dealId: dealId || null,
      invoiceNumber,
      issueDate,
      currency: "EUR" as const,
      supplier: {
        name: supplierName,
        address: supplierAddress || undefined,
        email: supplierEmail || undefined,
        phone: supplierPhone || undefined,
        vatNumber: supplierVatNumber || undefined,
        rcsNumber: supplierRcsNumber || undefined,
      },
      customer: {
        name: `${selectedContact.firstName} ${selectedContact.lastName}`,
        email: selectedContact.email,
        phone: selectedContact.phone,
      },
      items: items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        vatRate: i.vatRate,
      })),
      totals,
      payment: {
        iban: paymentIban || undefined,
        bic: paymentBic || undefined,
        reference: invoiceNumber,
        terms: paymentTerms || undefined,
      },
      notes: notes || undefined,
      status: "draft" as const,
      dueDate,
      paidAt: null as string | null,
    }

    if (draftInvoiceId) {
      updateInvoice(draftInvoiceId, payload)
      return draftInvoiceId
    }

    const created = addInvoice(payload)
    setDraftInvoiceId(created.id)
    return created.id
  }

  const handlePreviewPdf = async () => {
    const pdfData = buildInvoicePdfData()
    if (!pdfData) return

    setIsGeneratingPdf(true)
    try {
      const invoiceId = ensureDraftInvoice()
      if (!invoiceId) return
      const filename = `${invoiceNumber}.pdf`
      const { signedUrl, storagePath } = await persistAndGetUrl({ invoiceId, data: pdfData, filename })
      if (storagePath) updateInvoice(invoiceId, { fileUrl: storagePath, generatedAt: new Date().toISOString() })
      window.open(signedUrl, "_blank", "noopener,noreferrer")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to preview invoice")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handleDownloadPdf = async () => {
    const pdfData = buildInvoicePdfData()
    if (!pdfData) return

    setIsGeneratingPdf(true)
    try {
      const invoiceId = ensureDraftInvoice()
      if (!invoiceId) return
      const filename = `${invoiceNumber}.pdf`
      const { signedUrl, storagePath } = await persistAndGetUrl({ invoiceId, data: pdfData, filename })
      if (storagePath) updateInvoice(invoiceId, { fileUrl: storagePath, generatedAt: new Date().toISOString() })
      downloadFromUrl(signedUrl, filename)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to download invoice")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  return (
    <>
      <DashboardHeader
        title="Create Invoice"
        description="Create a Luxembourg-ready invoice (TVA, HT/TVA/TTC, payment details)."
      />

      <div className="p-6 space-y-6">
        <Link
          href="/dashboard/finance"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Finance
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Invoice Number *</Label>
                    <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Input value="EUR" disabled />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Issue Date *</Label>
                    <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date *</Label>
                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Deal (optional)</Label>
                    <Select value={dealId || "none"} onValueChange={handleDealChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a deal to auto-fill" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No deal</SelectItem>
                        {deals.map((deal) => {
                          const property = getPropertyById(deal.propertyId)
                          const dealValue = (deal as unknown as { value?: number }).value ?? 0
                          return (
                            <SelectItem key={deal.id} value={deal.id}>
                              {property?.address.street} - {currencyFormatter.format(dealValue)}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Client *</Label>
                    <Select value={contactId} onValueChange={setContactId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.firstName} {contact.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Supplier (Your Agency)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input value={supplierAddress} onChange={(e) => setSupplierAddress(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={supplierEmail} onChange={(e) => setSupplierEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>VAT Number (TVA)</Label>
                    <Input value={supplierVatNumber} onChange={(e) => setSupplierVatNumber(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>RCS Number</Label>
                    <Input value={supplierRcsNumber} onChange={(e) => setSupplierRcsNumber(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Line Items</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-start">
                    <div className="flex-1">
                      <Label className="sr-only">Description</Label>
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:flex md:gap-2">
                      <div className="w-full md:w-24">
                        <Label className="sr-only">Qty</Label>
                        <Input
                          type="number"
                          placeholder="Qty"
                          min={1}
                          value={item.quantity || ""}
                          onChange={(e) => updateItem(index, "quantity", Number.parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="w-full md:w-32">
                        <Label className="sr-only">Unit</Label>
                        <Input
                          type="number"
                          placeholder="Unit €"
                          value={Number.isFinite(item.unitPrice) ? item.unitPrice : ""}
                          onChange={(e) => updateItem(index, "unitPrice", Number.parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1 md:w-28">
                        <Label className="sr-only">TVA</Label>
                        <Select
                          value={String(item.vatRate)}
                          onValueChange={(value) => updateItem(index, "vatRate", Number.parseFloat(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="17">TVA 17%</SelectItem>
                            <SelectItem value="8">TVA 8%</SelectItem>
                            <SelectItem value="3">TVA 3%</SelectItem>
                            <SelectItem value="0">TVA 0%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:flex-col md:items-end md:justify-start">
                      <div className="text-sm font-semibold">
                        {currencyFormatter.format(
                          item.quantity * item.unitPrice * (1 + (item.vatRate || 0) / 100),
                        )}
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} disabled={items.length === 1}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>IBAN</Label>
                    <Input value={paymentIban} onChange={(e) => setPaymentIban(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>BIC</Label>
                    <Input value={paymentBic} onChange={(e) => setPaymentBic(e.target.value)} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Payment Terms</Label>
                    <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Référence du mandat, bien concerné, ou mention TVA/autoliquidation…"
                  className="min-h-[120px]"
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium">{selectedContact ? `${selectedContact.firstName} ${selectedContact.lastName}` : "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Deal</span>
                  <span className="font-medium">{selectedProperty ? selectedProperty.reference : "—"}</span>
                </div>
                <div className="border-t pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Sous-total (HT)</span>
                    <span className="font-medium">{currencyFormatter.format(totals.subtotalExclVat)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">TVA</span>
                    <span className="font-medium">{currencyFormatter.format(totals.vatTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-base">
                    <span className="font-semibold">Total (TTC)</span>
                    <span className="font-semibold">{currencyFormatter.format(totals.totalInclVat)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviewPdf}
                disabled={!canSubmit || isGeneratingPdf}
                className="bg-transparent"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                {isGeneratingPdf ? "Generating..." : "Preview PDF"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={!canSubmit || isGeneratingPdf}
                className="bg-transparent"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {isGeneratingPdf ? "Generating..." : "Download PDF"}
              </Button>
              <Button type="button" onClick={handleCreateInvoice} disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Draft
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/dashboard/finance")}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <NewInvoicePageInner />
    </Suspense>
  )
}
