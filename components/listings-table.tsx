"use client"

import { useState } from "react"
import { MoreHorizontal, Eye, Pause, Play, Edit, Trash2, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listings, getPropertyById, type Listing } from "@/lib/mock-data"

const statusColors: Record<Listing["status"], string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  paused: "bg-amber-500/10 text-amber-600",
  archived: "bg-muted text-muted-foreground",
}

export function ListingsTable() {
  const [rows, setRows] = useState<Listing[]>(() => listings)
  const [selectedListings, setSelectedListings] = useState<string[]>([])

  const toggleAll = () => {
    if (selectedListings.length === rows.length) {
      setSelectedListings([])
    } else {
      setSelectedListings(rows.map((l) => l.id))
    }
  }

  const toggleListing = (id: string) => {
    if (selectedListings.includes(id)) {
      setSelectedListings(selectedListings.filter((l) => l !== id))
    } else {
      setSelectedListings([...selectedListings, id])
    }
  }

  const openProperty = (propertyId: string) => {
    window.location.href = `/dashboard/properties/${propertyId}`
  }

  const handleViewOnPortal = (listing: Listing) => {
    const first = listing.portals[0]
    toast.info(first ? `Open on ${first.name} (connect portal integration)` : "No portal linked.")
  }

  const handleToggleStatus = (listing: Listing) => {
    setRows((prev) =>
      prev.map((l) =>
        l.id === listing.id
          ? { ...l, status: l.status === "active" ? "paused" : l.status === "paused" ? "active" : l.status }
          : l,
      ),
    )
    toast.success(listing.status === "active" ? "Listing paused." : "Listing activated.")
  }

  const handleDelete = (listing: Listing) => {
    if (!confirm("Delete this listing?")) return
    setRows((prev) => prev.filter((l) => l.id !== listing.id))
    setSelectedListings((prev) => prev.filter((id) => id !== listing.id))
    toast.success("Listing deleted.")
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox checked={rows.length > 0 && selectedListings.length === rows.length} onCheckedChange={toggleAll} />
            </TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Portals</TableHead>
            <TableHead className="text-right">Views</TableHead>
            <TableHead className="text-right">Inquiries</TableHead>
            <TableHead>Published</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((listing) => {
            const property = getPropertyById(listing.propertyId)
            if (!property) return null

            return (
              <TableRow key={listing.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedListings.includes(listing.id)}
                    onCheckedChange={() => toggleListing(listing.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-12 w-16 rounded-md bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${property.images[0] || "/diverse-property-showcase.png"})`,
                      }}
                    />
                    <div>
                      <p className="font-medium text-sm">{listing.headline}</p>
                      <p className="text-xs text-muted-foreground">
                        {property.address.city} · {property.reference}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusColors[listing.status]}>
                    {listing.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {listing.portals.slice(0, 3).map((portal) => (
                      <div
                        key={portal.id}
                        className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium"
                        title={portal.name}
                      >
                        {portal.name[0]}
                      </div>
                    ))}
                    {listing.portals.length > 3 && (
                      <span className="text-xs text-muted-foreground ml-1">+{listing.portals.length - 3}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">{listing.views.toLocaleString()}</TableCell>
                <TableCell className="text-right font-medium">{listing.inquiries}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {listing.publishedAt ? new Date(listing.publishedAt).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openProperty(property.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Listing
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openProperty(property.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewOnPortal(listing)}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View on Portal
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {listing.status === "active" ? (
                        <DropdownMenuItem onClick={() => handleToggleStatus(listing)}>
                          <Pause className="mr-2 h-4 w-4" />
                          Pause Listing
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleToggleStatus(listing)} disabled={listing.status === "archived"}>
                          <Play className="mr-2 h-4 w-4" />
                          Activate Listing
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(listing)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
