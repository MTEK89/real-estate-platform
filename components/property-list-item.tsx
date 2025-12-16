import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Property } from "@/lib/mock-data"
import { Bed, Bath, Square, MapPin, MoreHorizontal, Calendar, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface PropertyListItemProps {
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

export function PropertyListItem({ property }: PropertyListItemProps) {
  const formattedPrice = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(property.price)

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors">
      <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-lg">
        <Image
          src={property.images[0] || "/placeholder.svg?height=96&width=128&query=modern property"}
          alt={property.address.street}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 items-center justify-between min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{property.reference}</span>
            <Badge className={cn("text-xs", statusStyles[property.status])}>{statusLabels[property.status]}</Badge>
          </div>
          <Link href={`/dashboard/properties/${property.id}`} className="hover:underline">
            <h3 className="font-semibold text-card-foreground truncate mt-1">{property.address.street}</h3>
          </Link>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="h-3.5 w-3.5" />
            {property.address.city}, {property.address.postalCode}
          </p>
        </div>

        <div className="hidden md:flex items-center gap-6 mx-6 text-sm text-muted-foreground">
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
            {property.characteristics.surface.toLocaleString()}
          </span>
        </div>

	        <div className="flex items-center gap-4">
	          <p className="text-lg font-bold text-card-foreground">{formattedPrice}</p>
	
	          <div className="flex items-center gap-1">
	            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
	              <Link href={`/dashboard/properties/${property.id}`} aria-label="View property">
	                <Eye className="h-4 w-4" />
	              </Link>
	            </Button>
	            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
	              <Link href={`/dashboard/visits/new?propertyId=${encodeURIComponent(property.id)}`} aria-label="Schedule visit">
	                <Calendar className="h-4 w-4" />
	              </Link>
	            </Button>
	            <DropdownMenu>
	              <DropdownMenuTrigger asChild>
	                <Button variant="ghost" size="icon" className="h-8 w-8">
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
	        </div>
      </div>
    </div>
  )
}
