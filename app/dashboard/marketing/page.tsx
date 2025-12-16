"use client"

import { useState } from "react"
import { Plus, Upload, Filter, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { MarketingStats } from "@/components/marketing-stats"
import { ListingsTable } from "@/components/listings-table"
import { PortalsGrid } from "@/components/portals-grid"
import { CampaignsTable } from "@/components/campaigns-table"
import { MarketingDocumentsTable } from "@/components/marketing-documents-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useDataStore } from "@/lib/data-store"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { toast } from "sonner"

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState("listings")
  const [showCreateListing, setShowCreateListing] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { properties } = useDataStore()

  // Create Listing Form State
  const [selectedPropertyId, setSelectedPropertyId] = useState("")
  const [headline, setHeadline] = useState("")
  const [description, setDescription] = useState("")
  const [selectedPortals, setSelectedPortals] = useState<string[]>([])

  // Bulk Upload State
  const [bulkSelectedProperties, setBulkSelectedProperties] = useState<string[]>([])
  const [bulkSelectedPortals, setBulkSelectedPortals] = useState<string[]>([])

  const availablePortals = [
    { id: "athome", name: "atHome.lu", logo: "🏠" },
    { id: "immotop", name: "IMMOTOP.LU", logo: "📣" },
    { id: "wortimmo", name: "Wortimmo.lu", logo: "📰" },
    { id: "vivi", name: "vivi.lu", logo: "✨" },
  ]

  const publishedProperties = properties.filter((p) => p.status === "published")

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId)

  // Auto-fill when property is selected
  const handlePropertySelect = (propertyId: string) => {
    setSelectedPropertyId(propertyId)
    const property = properties.find((p) => p.id === propertyId)
    if (property) {
      setHeadline(
        `${property.type.charAt(0).toUpperCase() + property.type.slice(1)} - ${property.characteristics.rooms} rooms - ${property.address.city}`,
      )
      setDescription(
        `Beautiful ${property.type} located in ${property.address.city}. ${property.characteristics.surface}m², ${property.characteristics.bedrooms} bedrooms, ${property.characteristics.bathrooms} bathrooms. ${property.characteristics.condition} condition.`,
      )
    }
  }

  const handleCreateListing = async () => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSubmitting(false)
    setShowCreateListing(false)
    // Reset form
    setSelectedPropertyId("")
    setHeadline("")
    setDescription("")
    setSelectedPortals([])
  }

  const handleBulkUpload = async () => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setShowBulkUpload(false)
    // Reset form
    setBulkSelectedProperties([])
    setBulkSelectedPortals([])
  }

  const togglePortal = (portalId: string) => {
    setSelectedPortals((prev) => (prev.includes(portalId) ? prev.filter((id) => id !== portalId) : [...prev, portalId]))
  }

  const toggleBulkPortal = (portalId: string) => {
    setBulkSelectedPortals((prev) =>
      prev.includes(portalId) ? prev.filter((id) => id !== portalId) : [...prev, portalId],
    )
  }

  const toggleBulkProperty = (propertyId: string) => {
    setBulkSelectedProperties((prev) =>
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId],
    )
  }

  const selectAllProperties = () => {
    if (bulkSelectedProperties.length === publishedProperties.length) {
      setBulkSelectedProperties([])
    } else {
      setBulkSelectedProperties(publishedProperties.map((p) => p.id))
    }
  }

  return (
    <>
      <DashboardHeader
        title="Marketing & Sales"
        description="Manage your property listings, portal integrations, and sales materials"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowBulkUpload(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>
            <Button size="sm" onClick={() => setShowCreateListing(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Listing
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        <MarketingStats />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
	          <div className="flex items-center justify-between">
	            <TabsList>
	              <TabsTrigger value="listings">Listings</TabsTrigger>
	              <TabsTrigger value="portals">Portals</TabsTrigger>
	              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
	              <TabsTrigger value="documents">Documents</TabsTrigger>
	            </TabsList>
	            <Button variant="outline" size="sm" onClick={() => toast.info("Filters coming soon.")}>
	              <Filter className="mr-2 h-4 w-4" />
	              Filters
	            </Button>
	          </div>

          <TabsContent value="listings" className="mt-4">
            <ListingsTable />
          </TabsContent>

          <TabsContent value="portals" className="mt-4">
            <PortalsGrid />
          </TabsContent>

          <TabsContent value="campaigns" className="mt-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Campaigns</h3>
                <p className="text-muted-foreground text-sm">Plan campaigns and track KPIs manually</p>
              </div>
              <Button asChild size="sm">
                <Link href="/dashboard/marketing/campaigns/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Campaign
                </Link>
              </Button>
            </div>
            <CampaignsTable />
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Marketing Documents</h3>
                <p className="text-muted-foreground text-sm">Create and manage your marketing materials</p>
              </div>
              <Button asChild size="sm">
                <Link href="/dashboard/marketing/documents/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Document
                </Link>
              </Button>
            </div>
            <MarketingDocumentsTable />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Listing Dialog */}
      <Dialog open={showCreateListing} onOpenChange={setShowCreateListing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Listing</DialogTitle>
            <DialogDescription>
              Publish a property to real estate portals. Select a property to auto-fill the listing details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Property Selection */}
            <div className="space-y-2">
              <Label>Select Property *</Label>
              <Select value={selectedPropertyId} onValueChange={handlePropertySelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a property to list" />
                </SelectTrigger>
                <SelectContent>
                  {publishedProperties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.reference} - {property.address.street} (€
                      {property.price.toLocaleString("de-DE")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProperty && (
                <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="font-medium">{selectedProperty.address.street}</span>
                  </div>
                  <p className="text-muted-foreground">
                    {selectedProperty.characteristics.surface}m² | {selectedProperty.characteristics.rooms} rooms |{" "}
                    {selectedProperty.characteristics.bedrooms} bed | {selectedProperty.characteristics.bathrooms} bath
                  </p>
                  <p className="text-primary font-medium mt-1">€{selectedProperty.price.toLocaleString("de-DE")}</p>
                </div>
              )}
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <Label>Listing Headline *</Label>
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Enter a compelling headline..."
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the property..."
                className="min-h-[120px]"
              />
            </div>

            {/* Portal Selection */}
            <div className="space-y-2">
              <Label>Select Portals *</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {availablePortals.map((portal) => (
                  <label
                    key={portal.id}
                    className={cn(
                      "flex min-w-0 items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                      selectedPortals.includes(portal.id) ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                    )}
                  >
                    <Checkbox
                      className="shrink-0"
                      checked={selectedPortals.includes(portal.id)}
                      onCheckedChange={() => togglePortal(portal.id)}
                    />
                    <span className="shrink-0 text-lg">{portal.logo}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{portal.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateListing(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateListing}
              disabled={
                isSubmitting || !selectedPropertyId || !headline || !description || selectedPortals.length === 0
              }
            >
              {isSubmitting ? "Publishing..." : "Publish Listing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Upload to Portals</DialogTitle>
            <DialogDescription>
              Select multiple properties and publish them to your chosen portals at once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Portal Selection */}
            <div className="space-y-2">
              <Label>Select Portals *</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {availablePortals.map((portal) => (
                  <label
                    key={portal.id}
                    className={cn(
                      "flex min-w-0 items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                      bulkSelectedPortals.includes(portal.id) ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                    )}
                  >
                    <Checkbox
                      className="shrink-0"
                      checked={bulkSelectedPortals.includes(portal.id)}
                      onCheckedChange={() => toggleBulkPortal(portal.id)}
                    />
                    <span className="shrink-0 text-lg">{portal.logo}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{portal.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Property Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Properties *</Label>
                <Button variant="ghost" size="sm" onClick={selectAllProperties}>
                  {bulkSelectedProperties.length === publishedProperties.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                {publishedProperties.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No published properties available. Publish properties first before creating listings.
                  </div>
                ) : (
                  publishedProperties.map((property) => (
                    <label
                      key={property.id}
                      className={cn(
                        "flex items-center gap-4 p-4 cursor-pointer transition-colors",
                        bulkSelectedProperties.includes(property.id) ? "bg-primary/5" : "hover:bg-muted/50",
                      )}
                    >
                      <Checkbox
                        checked={bulkSelectedProperties.includes(property.id)}
                        onCheckedChange={() => toggleBulkProperty(property.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{property.reference}</span>
                          <Badge variant="outline" className="capitalize">
                            {property.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{property.address.street}</p>
                        <p className="text-sm text-muted-foreground">
                          {property.characteristics.surface}m² | {property.characteristics.rooms} rooms
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-primary">€{property.price.toLocaleString("de-DE")}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              {bulkSelectedProperties.length > 0 && (
                <p className="text-sm text-muted-foreground">{bulkSelectedProperties.length} properties selected</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkUpload(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkUpload}
              disabled={isSubmitting || bulkSelectedProperties.length === 0 || bulkSelectedPortals.length === 0}
            >
              {isSubmitting
                ? "Uploading..."
                : `Upload ${bulkSelectedProperties.length} Listing${bulkSelectedProperties.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
