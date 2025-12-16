"use client"

import type React from "react"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Upload, Sparkles } from "lucide-react"
import { useDataStore } from "@/lib/data-store"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function NewPropertyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { contacts, addProperty, updateProperty, addTask } = useDataStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [propertyType, setPropertyType] = useState("")
  const [status, setStatus] = useState("draft")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [street, setStreet] = useState("")
  const [city, setCity] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [country, setCountry] = useState("Luxembourg")
  const [surface, setSurface] = useState("")
  const [rooms, setRooms] = useState("")
  const [bedrooms, setBedrooms] = useState("")
  const [bathrooms, setBathrooms] = useState("")
  const [yearBuilt, setYearBuilt] = useState("")
  const [condition, setCondition] = useState("")
  const [ownerId, setOwnerId] = useState("")
  const [tags, setTags] = useState("")

  const [mediaFiles, setMediaFiles] = useState<Array<{ file: File; previewUrl: string }>>([])
  const mediaFilesRef = useRef<Array<{ file: File; previewUrl: string }>>([])
  const mediaCount = mediaFiles.length
  const mediaTotalSize = useMemo(() => mediaFiles.reduce((sum, f) => sum + (f.file.size || 0), 0), [mediaFiles])

  // Get sellers/investors as potential owners
  const owners = contacts.filter((c) => c.type === "seller" || c.type === "investor")

  // Pre-fill from URL params
  useEffect(() => {
    const ownerIdParam = searchParams.get("ownerId")
    if (ownerIdParam) setOwnerId(ownerIdParam)
  }, [searchParams])

  useEffect(() => {
    mediaFilesRef.current = mediaFiles
  }, [mediaFiles])

  useEffect(() => {
    return () => {
      for (const f of mediaFilesRef.current) URL.revokeObjectURL(f.previewUrl)
    }
  }, [])

  const addMediaFiles = (files: File[]) => {
    const images = files.filter((f) => f.type?.startsWith("image/"))
    if (!images.length) return

    setMediaFiles((prev) => [
      ...prev,
      ...images.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ])
  }

  const removeMediaAt = (index: number) => {
    setMediaFiles((prev) => {
      const item = prev[index]
      if (item) URL.revokeObjectURL(item.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  // Auto-fill owner details when selected
  const selectedOwner = contacts.find((c) => c.id === ownerId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyType || !price || !street || !city || !ownerId) return

    setIsSubmitting(true)

    try {
      // Generate a reference
      const reference = `PROP-${Date.now().toString(36).toUpperCase()}`

      // Add property to data store
      const newProperty = addProperty({
        reference,
        status: status as "draft" | "published" | "under_offer" | "sold" | "rented" | "archived",
        type: propertyType as "house" | "apartment" | "office" | "retail" | "land",
        address: {
          street,
          city,
          postalCode,
          country,
        },
        characteristics: {
          surface: Number.parseFloat(surface) || 0,
          rooms: Number.parseInt(rooms) || 0,
          bedrooms: Number.parseInt(bedrooms) || 0,
          bathrooms: Number.parseInt(bathrooms) || 0,
          yearBuilt: yearBuilt ? Number.parseInt(yearBuilt) : undefined,
          condition: condition || "Good",
        },
        price: Number.parseFloat(price) || 0,
        ownerId,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        images: [],
      })

      // Upload media (best-effort) and store signed URLs in property.images.
      if (mediaFiles.length) {
        setIsUploadingMedia(true)
        try {
          const form = new FormData()
          form.set("propertyId", newProperty.id)
          for (const { file } of mediaFiles) form.append("files", file)

          const res = await fetch("/api/v1/gallery/upload", { method: "POST", body: form })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error(data?.error || "Upload failed")

          const urls = Array.isArray(data?.created) ? data.created.map((c: any) => c?.url).filter(Boolean) : []
          if (urls.length) updateProperty(newProperty.id, { images: urls })
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Upload failed")
        } finally {
          setIsUploadingMedia(false)
        }
      }

      // Auto-create a task to complete the property listing
      addTask({
        title: `Complete listing for ${reference}`,
        description: `Upload photos, verify details, and publish ${street} property.`,
        assignedTo: "u1",
        relatedTo: { type: "property", id: newProperty.id },
        priority: "medium",
        status: "todo",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        completedAt: null,
      })

      await new Promise((resolve) => setTimeout(resolve, 500))
      router.push("/dashboard/properties")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col">
      <DashboardHeader title="Add New Property" description="Create a new property listing" />

      <div className="flex-1 p-6">
        <Link
          href="/dashboard/properties"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Properties
        </Link>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="type">Property Type *</Label>
                      <Select value={propertyType} onValueChange={setPropertyType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="office">Office</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="land">Land</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price (€) *</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the property..."
                      className="min-h-[120px]"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Address */}
              <Card>
                <CardHeader>
                  <CardTitle>Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address *</Label>
                    <Input
                      id="street"
                      placeholder="123 Main St"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input id="city" placeholder="Luxembourg" value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        placeholder="L-2163"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        placeholder="Luxembourg"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Characteristics */}
              <Card>
                <CardHeader>
                  <CardTitle>Characteristics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="surface">Surface (m²)</Label>
                      <Input
                        id="surface"
                        type="number"
                        placeholder="0"
                        value={surface}
                        onChange={(e) => setSurface(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rooms">Total Rooms</Label>
                      <Input
                        id="rooms"
                        type="number"
                        placeholder="0"
                        value={rooms}
                        onChange={(e) => setRooms(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bedrooms">Bedrooms</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        placeholder="0"
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bathrooms">Bathrooms</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        placeholder="0"
                        value={bathrooms}
                        onChange={(e) => setBathrooms(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="yearBuilt">Year Built</Label>
                      <Input
                        id="yearBuilt"
                        type="number"
                        placeholder="2020"
                        value={yearBuilt}
                        onChange={(e) => setYearBuilt(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition</Label>
                      <Select value={condition} onValueChange={setCondition}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="New">New</SelectItem>
                          <SelectItem value="Excellent">Excellent</SelectItem>
                          <SelectItem value="Very Good">Very Good</SelectItem>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Needs Renovation">Needs Renovation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Media */}
              <Card>
                <CardHeader>
                  <CardTitle>Media</CardTitle>
                </CardHeader>
                <CardContent>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      addMediaFiles(files)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                  />
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                      isDraggingFiles ? "border-primary bg-primary/5" : "border-border",
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsDraggingFiles(true)
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsDraggingFiles(true)
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsDraggingFiles(false)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsDraggingFiles(false)
                      addMediaFiles(Array.from(e.dataTransfer.files || []))
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        fileInputRef.current?.click()
                      }
                    }}
                  >
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Drag and drop images here, or click to select files
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 bg-transparent"
                      onClick={(e) => {
                        e.preventDefault()
                        fileInputRef.current?.click()
                      }}
                    >
                      Select Files
                    </Button>
                  </div>
                  {mediaCount > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          {mediaCount} file{mediaCount === 1 ? "" : "s"} selected
                        </span>
                        <span>{Math.round(mediaTotalSize / 1024 / 1024)} MB</span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {mediaFiles.map((m, idx) => (
                          <div key={`${m.file.name}-${idx}`} className="group relative overflow-hidden rounded-md border bg-muted/20">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={m.previewUrl} alt={m.file.name} className="h-28 w-full object-cover" />
                            <button
                              type="button"
                              className="absolute right-2 top-2 rounded bg-background/80 px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                removeMediaAt(idx)
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      {isUploadingMedia && <p className="mt-2 text-xs text-muted-foreground">Uploading photos…</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Owner *</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={ownerId} onValueChange={setOwnerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {owners.map((owner) => (
                        <SelectItem key={owner.id} value={owner.id}>
                          {owner.firstName} {owner.lastName} ({owner.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedOwner && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span className="font-medium">
                          {selectedOwner.firstName} {selectedOwner.lastName}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{selectedOwner.email}</p>
                      <p className="text-muted-foreground">{selectedOwner.phone}</p>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Link this property to an existing contact or{" "}
                    <Link href="/dashboard/contacts/new" className="text-primary hover:underline">
                      create a new one
                    </Link>
                    .
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Add tags (comma separated)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Add tags to help categorize and filter properties.
                  </p>
                  {tags && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tags
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .map((tag, i) => (
                          <Badge key={i} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting || !propertyType || !price || !street || !city || !ownerId}
                >
                  {isSubmitting ? "Creating..." : "Create Property"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
