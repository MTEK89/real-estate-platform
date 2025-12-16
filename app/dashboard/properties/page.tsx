"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { PropertyCard } from "@/components/property-card"
import { PropertyListItem } from "@/components/property-list-item"
import { PropertyFilters } from "@/components/property-filters"
import { Button } from "@/components/ui/button"
import { useDataStore } from "@/lib/data-store"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function PropertiesPage() {
  const { properties } = useDataStore()
  const [view, setView] = useState<"grid" | "list">("grid")

  return (
    <div className="flex flex-col">
      <DashboardHeader
        title="Properties"
        description={`${properties.length} properties in your portfolio`}
        actions={
          <Link href="/dashboard/properties/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          </Link>
        }
      />

      <div className="flex-1 space-y-6 p-6">
        <PropertyFilters view={view} onViewChange={setView} />

        {view === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {properties.map((property) => (
              <PropertyListItem key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
