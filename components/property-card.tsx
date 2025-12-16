import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Property } from "@/lib/mock-data"
import { Bed, Bath, Square, MapPin, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface PropertyCardProps {
  property: Property
}

const statusStyles: Record<Property["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-emerald-100 text-emerald-700",
  under_offer: "bg-amber-100 text-amber-700",
  sold: "bg-blue-100 text-blue-700",
  rented: "bg-purple-100 text-purple-700",
  archived: "bg-muted text-muted-foreground",
}

const statusLabels: Record<Property["status"], string> = {
  draft: "Draft",
  published: "Published",
  under_offer: "Under Offer",
  sold: "Sold",
  rented: "Rented",
  archived: "Archived",
}

export function PropertyCard({ property }: PropertyCardProps) {
  const formattedPrice = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(property.price)

  return (
    <Card className="relative overflow-hidden group">
      <Link
        href={`/dashboard/properties/${property.id}`}
        className="absolute inset-0 z-10"
        aria-label={`Open ${property.reference}`}
      >
        <span className="sr-only">Open property</span>
      </Link>
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={property.images[0] || "/placeholder.svg?height=300&width=400&query=modern property"}
          alt={property.address.street}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <Badge className={cn("absolute top-3 left-3", statusStyles[property.status])}>
          {statusLabels[property.status]}
        </Badge>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-xl font-bold text-white">{formattedPrice}</p>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">{property.reference}</p>
            <h3 className="font-semibold text-card-foreground truncate mt-1">{property.address.street}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3.5 w-3.5" />
              {property.address.city}, {property.address.postalCode}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative z-20 h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/properties/${property.id}`}>View details</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/properties/${property.id}`}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/visits/new?propertyId=${encodeURIComponent(property.id)}`}>Schedule visit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/contracts/new?propertyId=${encodeURIComponent(property.id)}`}>Create contract</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Bed className="h-4 w-4" />
            {property.characteristics.bedrooms}
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="h-4 w-4" />
            {property.characteristics.bathrooms}
          </span>
          <span className="flex items-center gap-1.5">
            <Square className="h-4 w-4" />
            {property.characteristics.surface.toLocaleString()} sqft
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {property.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
