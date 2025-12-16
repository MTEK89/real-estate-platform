"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDataStore } from "@/lib/data-store"
import {
  Bed,
  Bath,
  Square,
  MapPin,
  Calendar,
  FileText,
  TrendingUp,
  ArrowLeft,
  Edit,
  Share2,
  Building2,
  User,
  Phone,
  Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { use, useEffect, useState } from "react"

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-emerald-100 text-emerald-700",
  under_offer: "bg-amber-100 text-amber-700",
  sold: "bg-blue-100 text-blue-700",
  rented: "bg-purple-100 text-purple-700",
  archived: "bg-muted text-muted-foreground",
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { properties, contacts, visits, deals, contracts } = useDataStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (id === "new") {
    router.replace("/dashboard/properties/new")
    return null
  }

  const property = properties.find((p) => p.id === id)

  if (!property) {
    return (
      <div className="flex flex-col">
        <DashboardHeader title="Property Not Found" description="The property you're looking for doesn't exist" />
        <div className="flex-1 p-6">
          <Link
            href="/dashboard/properties"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Properties
          </Link>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold mb-2">Property not found</h2>
              <p className="text-muted-foreground mb-4">This property may have been deleted or doesn't exist.</p>
              <Button asChild>
                <Link href="/dashboard/properties">View All Properties</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const owner = contacts.find((c) => c.id === property.ownerId)
  const propertyVisits = visits.filter((v) => v.propertyId === id)
  const propertyDeals = deals.filter((d) => d.propertyId === id)
  const propertyContracts = contracts.filter((c) => c.propertyId === id)

  const formattedPrice = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(property.price)

  return (
    <div className="flex flex-col">
      <DashboardHeader
        title={property.reference}
        description={property.address.street}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit Property
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6">
        <Link
          href="/dashboard/properties"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Properties
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <div className="grid grid-cols-3 gap-1">
                <div className="col-span-2 row-span-2 relative aspect-[4/3]">
                  <Image
                    src={property.images?.[0] || "/placeholder.svg?height=400&width=600&query=modern property exterior"}
                    alt={property.reference}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative aspect-square">
                  <Image
                    src={
                      property.images?.[1] ||
                      "/placeholder.svg?height=200&width=200&query=property interior living room"
                    }
                    alt="Property view"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative aspect-square">
                  <Image
                    src={
                      property.images?.[2] || "/placeholder.svg?height=200&width=200&query=property interior kitchen"
                    }
                    alt="Property view"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </Card>

            {mounted ? (
              <Tabs defaultValue="details">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="visits">Visits ({propertyVisits.length})</TabsTrigger>
                  <TabsTrigger value="deals">Deals ({propertyDeals.length})</TabsTrigger>
                  <TabsTrigger value="documents">Documents ({propertyContracts.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Property Characteristics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Square className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Surface</p>
                          <p className="font-medium">{property.characteristics.surface} m²</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Rooms</p>
                          <p className="font-medium">{property.characteristics.rooms}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bed className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Bedrooms</p>
                          <p className="font-medium">{property.characteristics.bedrooms}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bath className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Bathrooms</p>
                          <p className="font-medium">{property.characteristics.bathrooms}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Year Built</p>
                        <p className="font-medium">{property.characteristics.yearBuilt || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Condition</p>
                        <p className="font-medium">{property.characteristics.condition}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {property.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{property.description}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

                <TabsContent value="visits" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Scheduled Visits</CardTitle>
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/visits/new?propertyId=${id}`}>Schedule Visit</Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {propertyVisits.length > 0 ? (
                      <div className="space-y-3">
                        {propertyVisits.map((visit) => {
                          const visitor = contacts.find((c) => c.id === visit.contactId)
                          return (
                            <div key={visit.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">
                                  {visitor ? `${visitor.firstName} ${visitor.lastName}` : "Unknown"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {visit.date} at {visit.time}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  visit.status === "completed" && "bg-emerald-100 text-emerald-700 border-emerald-200",
                                  visit.status === "scheduled" && "bg-blue-100 text-blue-700 border-blue-200",
                                  visit.status === "cancelled" && "bg-red-100 text-red-700 border-red-200",
                                )}
                              >
                                {visit.status}
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No visits scheduled for this property.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

                <TabsContent value="deals" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Related Deals</CardTitle>
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/pipeline/new?propertyId=${id}`}>Create Deal</Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {propertyDeals.length > 0 ? (
                      <div className="space-y-3">
                        {propertyDeals.map((deal) => {
                          const client = contacts.find((c) => c.id === deal.contactId)
                          return (
                            <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">{deal.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {client ? `${client.firstName} ${client.lastName}` : "Unknown"} -{" "}
                                  {new Intl.NumberFormat("de-DE", {
                                    style: "currency",
                                    currency: "EUR",
                                    maximumFractionDigits: 0,
                                  }).format(deal.value)}
                                </p>
                              </div>
                              <Badge variant="outline">{deal.stage}</Badge>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No deals for this property.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

                <TabsContent value="documents" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Documents & Contracts</CardTitle>
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/contracts/new?propertyId=${id}`}>Create Document</Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {propertyContracts.length > 0 ? (
                      <div className="space-y-3">
                        {propertyContracts.map((contract) => {
                          const client = contacts.find((c) => c.id === contract.clientId)
                          return (
                            <div key={contract.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{contract.type.replace("_", " ")}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {client ? `${client.firstName} ${client.lastName}` : "Unknown"} - {contract.date}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  contract.status === "signed" && "bg-emerald-100 text-emerald-700 border-emerald-200",
                                  contract.status === "pending" && "bg-amber-100 text-amber-700 border-amber-200",
                                  contract.status === "draft" && "bg-muted text-muted-foreground",
                                )}
                              >
                                {contract.status}
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No documents for this property.</p>
                    )}
                  </CardContent>
                </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="rounded-lg border bg-muted/20 p-8 text-sm text-muted-foreground">Loading…</div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge className={cn("capitalize", statusStyles[property.status])}>
                    {property.status.replace("_", " ")}
                  </Badge>
                  <span className="text-sm text-muted-foreground capitalize">{property.type}</span>
                </div>
                <p className="text-3xl font-bold mb-2">{formattedPrice}</p>
                <div className="flex items-center text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    {property.address.street}, {property.address.city}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" asChild>
                    <Link href={`/dashboard/visits/new?propertyId=${id}`}>Schedule Visit</Link>
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent" asChild>
                    <Link href={`/dashboard/pipeline/new?propertyId=${id}`}>Create Offer</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {owner && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Owner Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Link href={`/dashboard/contacts/${owner.id}`} className="font-medium hover:underline">
                      {owner.firstName} {owner.lastName}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{owner.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{owner.email}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total Visits</span>
                  </div>
                  <span className="font-medium">{propertyVisits.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Active Deals</span>
                  </div>
                  <span className="font-medium">{propertyDeals.filter((d) => d.stage !== "closed").length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Documents</span>
                  </div>
                  <span className="font-medium">{propertyContracts.length}</span>
                </div>
              </CardContent>
            </Card>

            {property.tags && property.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {property.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
